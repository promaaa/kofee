"""Main loop: perceive, plan, instruct, verify, log, whoever the embodiment is."""

from __future__ import annotations

import argparse
import queue
import sys
import time
from collections import deque
from enum import Enum
from pathlib import Path

import cv2
import numpy as np

from . import ui
from ..analyze import Grid
from ..board import Board, find_ticks, order_corners, uniform_edges
from ..grid import GRID_FILE
from ..marks import find_corners
from .camera import FrameSource
from .episodes import EpisodeLog
from ..server import lan_address
from .api import Hub, serve
from .tasks import Agent, Planner, Task, robot_command, say
from ..vision import Params, SceneMonitor, cell_ratios, grid_ratios, ink_mask, subdivide

WINDOW = "nunchi"
DEFAULT_SIZE_MM = (1100.0, 500.0)
PUBLISH_EVERY_S = 0.1


class State(Enum):
    CALIBRATE = "calibrate"  # click the four inner corners of the black frame
    READY = "ready"  # live detection; SPACE starts a job
    SCAN = "scan"  # wait for a clear board, then plan the next task
    ASSIGNED = "assigned"  # task announced; waiting for the agent to reach the board
    WORKING = "working"  # someone is at the board
    RESULT = "result"  # verdict on screen for a moment
    DONE = "done"  # nothing left to clean


def parse_agent(spec: str, voice: str | None) -> Agent:
    name, _, tool = spec.strip().partition(":")
    return Agent(name=name, tool=tool or "eraser", voice=voice)


def parse_size(spec: str) -> tuple[float, float]:
    w, h = spec.lower().split("x")
    return float(w), float(h)


class App:
    def __init__(self, args: argparse.Namespace, source: FrameSource | None = None, hub: Hub | None = None):
        self.args = args
        self.p = Params(clean_ratio=args.clean / 100, settle_s=args.settle)
        self.source = source
        self.hub = hub
        self.voice = None if args.mute else args.voice
        self.agents = [parse_agent(s, self.voice) for s in args.agents.split(",")]
        self.board_path = Path(args.board)
        self.board = Board.load(self.board_path) if self.board_path.exists() else None
        self.state = State.READY if self.board else State.CALIBRATE
        self.clicks: list[tuple[int, int]] = []
        self.monitor = SceneMonitor(self.p)
        self.recent: deque[np.ndarray] = deque(maxlen=7)
        self.frame: np.ndarray | None = None
        self.rect: np.ndarray | None = None
        self.ink: np.ndarray | None = None
        self.live: dict[str, float] = {}
        self.ratios: dict[str, float] = {}
        self.heat: np.ndarray | None = None  # fine ink ratios, rows x cols, NaN where someone hides the board
        self.log: EpisodeLog | None = None
        self.planner: Planner | None = None
        self.task: Task | None = None
        self.agent: Agent | None = None
        self.turn = 0
        self.before: np.ndarray | None = None
        self.ratios_before: dict[str, float] = {}
        self.t_assigned = 0.0
        self.t_start: float | None = None
        self.t_state = time.monotonic()
        self.t_published = 0.0
        self.t_auto = 0.0
        self.status, self.tone = "", "info"
        self.result: bool | None = None
        self.show_ink = True
        self.fullscreen = False

    # ---------------------------------------------------------------- main loop

    def run(self, window: bool = True) -> None:
        if window:
            cv2.namedWindow(WINDOW, cv2.WINDOW_NORMAL)
            cv2.resizeWindow(WINDOW, 1440, 810)
            cv2.setMouseCallback(WINDOW, self.on_mouse)
        try:
            while True:
                frame = self.source.read()
                now = time.monotonic()
                if frame is None:
                    if self.source.ended:
                        break
                    time.sleep(0.01)
                    continue
                self.frame = frame
                self.handle_commands(now)
                if self.state is State.CALIBRATE:
                    self.try_auto_calibrate(now)
                else:
                    self.process(frame, now)
                publish = self.hub is not None and now - self.t_published >= PUBLISH_EVERY_S
                if window or publish:
                    canvas = self.render(now)
                if publish:
                    self.publish(now, canvas)
                if window:
                    cv2.imshow(WINDOW, canvas)
                    if not self.on_key(cv2.waitKey(1) & 0xFF, now):
                        break
        except KeyboardInterrupt:
            pass
        finally:
            self.source.close()
            if window:
                cv2.destroyAllWindows()

    def process(self, frame: np.ndarray, now: float) -> None:
        """One perception + decision step (separate from the window so it can be tested)."""
        self.frame = frame
        self.follow_camera(now)
        self.rect = self.board.rectify(frame)
        self.recent.append(self.rect)
        self.ink = ink_mask(self.rect, self.p)
        self.live = cell_ratios(self.ink, self.board, self.p)
        self.monitor.update(self.rect, now)
        cols, rows = self.fine_edges()
        heat = grid_ratios(self.ink, cols, rows, self.p.border)
        heat[grid_ratios(self.monitor.blobs, cols, rows) > 0.2] = np.nan
        self.heat = heat
        if self.state is State.READY and not self.monitor.occupied:
            self.ratios = self.live
        self.step(now)

    def step(self, now: float) -> None:
        settled = self.monitor.settled(now)
        if self.state is State.SCAN:
            if settled:
                self.plan(now)
            else:
                self.set_status("Waiting for a clear view of the board", "wait")
        elif self.state is State.ASSIGNED:
            if self.monitor.occupied:
                self.t_start = now
                self.goto(State.WORKING, now)
                self.set_status("Working… step aside when done", "wait")
            elif settled and self.live.get(self.task.cell, 0.0) < self.p.clean_ratio:
                self.verify(now)  # cleaned without being seen, e.g. reaching in from the side
        elif self.state is State.WORKING:
            if settled:
                self.verify(now)
        elif self.state is State.RESULT:
            if now - self.t_state > 2.5:
                self.task = None
                self.goto(State.SCAN, now)

    def fine_edges(self) -> tuple[list[float], list[float]]:
        k = self.args.fine
        return subdivide(self.board.col_edges, k), subdivide(self.board.row_edges, k)

    # -------------------------------------------------------------- transitions

    def goto(self, state: State, now: float) -> None:
        self.state, self.t_state = state, now

    def set_status(self, text: str, tone: str) -> None:
        self.status, self.tone = text, tone

    def measure(self) -> tuple[np.ndarray, dict[str, float]]:
        """Median of the last frames: robust to sensor noise and to a stray passer-by."""
        snapshot = np.median(np.stack(self.recent), axis=0).astype(np.uint8)
        return snapshot, cell_ratios(ink_mask(snapshot, self.p), self.board, self.p)

    def start_job(self, now: float) -> None:
        self.log = EpisodeLog(self.args.runs)
        self.planner = Planner(self.board, self.p.clean_ratio)
        self.turn, self.task, self.result = 0, None, None
        self.goto(State.SCAN, now)
        print(f"job started, logging to {self.log.path}")

    def plan(self, now: float) -> None:
        snapshot, self.ratios = self.measure()
        task = self.planner.next_task(self.ratios)
        if task is None:
            self.finish(now)
            return
        self.task, self.result = task, None
        self.agent = self.agents[self.turn % len(self.agents)]
        self.turn += 1
        self.before, self.ratios_before = snapshot, dict(self.ratios)
        self.t_assigned, self.t_start = now, None
        self.goto(State.ASSIGNED, now)
        self.set_status("Go to the board", "wait")
        say(self.agent.instruction(task), self.agent.voice)
        print(f"{task.id} -> {self.agent.name}: {task.to_json()}")

    def verify(self, now: float) -> None:
        after, self.ratios = self.measure()
        target = self.task.cell
        ink_after = self.ratios[target]
        success = ink_after < self.p.clean_ratio
        dirty_before = {c for c, r in self.ratios_before.items() if r >= self.p.clean_ratio}
        dirty_after = {c for c, r in self.ratios.items() if r >= self.p.clean_ratio}
        side_effects = {
            "also_cleaned": sorted(dirty_before - dirty_after - {target}),
            "newly_dirty": sorted(dirty_after - dirty_before),
        }
        record = self.log.add(
            task=self.task,
            agent=self.agent,
            board=self.board,
            before=self.before,
            after=after,
            ink_before=self.ratios_before.get(target, 0.0),
            ink_after=ink_after,
            success=success,
            t_assigned=self.t_assigned,
            t_start=self.t_start,
            t_end=now,
            side_effects=side_effects,
        )
        self.result = success
        if success:
            self.set_status(f"{target} verified clean", "ok")
            say(f"{target} is clean.", self.voice)
        else:
            self.set_status(f"{ink_after:.1%} ink left in {target}, trying again", "bad")
            say(f"{target} is not clean yet.", self.voice)
        self.goto(State.RESULT, now)
        print(f"episode {record['episode']}: {target} by {self.agent.name} -> {'PASS' if success else 'FAIL'}")

    def finish(self, now: float) -> None:
        stuck = self.planner.given_up(self.ratios)
        n = len(self.log.records)
        passed = sum(r["success"] for r in self.log.records)
        self.task = None
        self.goto(State.DONE, now)
        summary = f"{n} episodes, {passed} passed, {len({r['agent']['name'] for r in self.log.records})} embodiments."
        if stuck:
            self.set_status(f"Gave up on {', '.join(stuck)}. {summary}", "bad")
            say(f"Finished. {len(stuck)} cells could not be cleaned.", self.voice)
        else:
            self.set_status(summary, "ok")
            say(f"Board clean. {n} episodes logged.", self.voice)
        print(f"job done: {summary} Log: {self.log.path}")

    def reset(self) -> None:
        self.task, self.result, self.agent = None, None, None
        self.state = State.READY
        self.set_status("", "info")

    def try_auto_calibrate(self, now: float) -> None:
        """Find the four L marks on their own, at most once a second, unless corners are being clicked."""
        if self.clicks or now - self.t_auto < 1.0:
            return
        self.t_auto = now
        corners = find_corners(self.frame)
        if corners is not None:
            self.calibrate(corners)

    def follow_camera(self, now: float) -> None:
        """Once a second, look for the marks again and re-aim the board if the camera has moved.

        The job in progress is kept: only the geometry changes.
        """
        if now - self.t_auto < 1.0 or self.monitor.occupied:
            return
        self.t_auto = now
        corners = find_corners(self.frame)
        if corners is None:
            return
        moved = np.abs(order_corners(corners) - self.board.corners).max()
        if moved > 0.01 * self.frame.shape[1]:
            self.board = Board(order_corners(corners), self.board.size_mm, self.board.col_edges, self.board.row_edges)
            self.board.save(self.board_path)
            self.monitor = SceneMonitor(self.p)
            self.recent.clear()
            print(f"camera moved by {moved:.0f} px: board re-aimed", flush=True)

    def calibrate(self, corners_px) -> None:
        """Build the board from the 4 frame corners (camera pixels) and read the graduation ticks."""
        corners = order_corners(corners_px)
        if self.args.size_mm:
            size_mm = parse_size(self.args.size_mm)
        else:
            size_mm = self.board.size_mm if self.board else DEFAULT_SIZE_MM
        draft = Board(corners, size_mm, uniform_edges(self.args.cols), uniform_edges(self.args.rows))
        if Path(self.args.grid).exists():
            grid = Grid.load(self.args.grid)
            cols, rows = list(grid.col_edges), list(grid.row_edges)
        else:
            cols = find_ticks(self.frame, draft, "u")
            rows = find_ticks(self.frame, draft, "v")
        self.board = Board(corners, size_mm, cols or draft.col_edges, rows or draft.row_edges)
        self.board.save(self.board_path)
        print(
            f"calibrated: {self.board.cols} columns ({'from ticks' if cols else 'uniform'}), "
            f"{self.board.rows} rows ({'from ticks' if rows else 'uniform'}) -> {self.board_path}"
        )
        self.clicks = []
        self.monitor = SceneMonitor(self.p)
        self.recent.clear()
        self.reset()

    # ------------------------------------------------------------------- input

    def handle_commands(self, now: float) -> None:
        """Commands from the web API (phone / laptop front-end)."""
        while self.hub is not None:
            try:
                cmd = self.hub.commands.get_nowait()
            except queue.Empty:
                return
            action = cmd["action"]
            if action == "calibrate":
                if cmd.get("corners") and self.frame is not None:
                    fh, fw = self.frame.shape[:2]
                    self.calibrate([(x * fw, y * fh) for x, y in cmd["corners"]])
                else:
                    self.clicks, self.state = [], State.CALIBRATE
            elif self.state is State.CALIBRATE:
                continue
            elif action == "start" and self.state in (State.READY, State.DONE):
                self.start_job(now)
            elif action == "done" and self.state in (State.ASSIGNED, State.WORKING):
                self.verify(now)
            elif action == "reset":
                self.reset()

    def on_mouse(self, event: int, x: int, y: int, flags: int, param) -> None:
        if self.state is State.CALIBRATE and event == cv2.EVENT_LBUTTONDOWN:
            self.clicks.append((x, y))
            if len(self.clicks) == 4:
                fh, fw = self.frame.shape[:2]
                sx, sy = fw / ui.SIZE[0], fh / ui.SIZE[1]
                self.calibrate([(cx * sx, cy * sy) for cx, cy in self.clicks])

    def on_key(self, key: int, now: float) -> bool:
        if key == 255:
            return True
        if self.state is State.CALIBRATE:
            if key in (8, 127) and self.clicks:
                self.clicks.pop()
            elif key == 27 and self.board is not None:
                self.clicks, self.state = [], State.READY
            elif key == ord("q"):
                return False
            return True
        if key in (ord("q"), 27):
            return False
        if key == ord(" "):
            if self.state in (State.READY, State.DONE):
                self.start_job(now)
            elif self.state in (State.ASSIGNED, State.WORKING):
                self.verify(now)
        elif key == ord("c"):
            self.clicks, self.state = [], State.CALIBRATE
        elif key == ord("r"):
            self.reset()
        elif key == ord("d"):
            self.show_ink = not self.show_ink
        elif key == ord("f"):
            self.fullscreen = not self.fullscreen
            mode = cv2.WINDOW_FULLSCREEN if self.fullscreen else cv2.WINDOW_NORMAL
            cv2.setWindowProperty(WINDOW, cv2.WND_PROP_FULLSCREEN, mode)
        return True

    # ------------------------------------------------------------------ output

    def render(self, now: float) -> np.ndarray:
        if self.state is State.CALIBRATE:
            return ui.calibration_view(self.frame, self.clicks)
        return ui.dashboard(self.view(now))

    def view(self, now: float) -> ui.View:
        return ui.View(
            state=self.state.value,
            frame=self.frame,
            rect=self.rect,
            board=self.board,
            ink=self.ink,
            heat=self.heat,
            fine_edges=self.fine_edges(),
            ratios=self.ratios,
            clean_ratio=self.p.clean_ratio,
            occupied=self.monitor.occupied,
            person=self.monitor.person / self.p.person_ratio,
            motion=self.monitor.motion / self.p.motion_ratio,
            settle=min(1.0, self.monitor.clear_for(now) / self.p.settle_s),
            task=self.task,
            agent=self.agent,
            status=self.status,
            tone=self.tone,
            result=self.result,
            stats=self.log.stats() if self.log else {},
            episodes=len(self.log.records) if self.log else 0,
            log_path="/".join(self.log.path.parts[-3:]) if self.log else None,
            show_ink=self.show_ink,
        )

    def snapshot(self, now: float) -> dict:
        """The state every front-end renders (see docs/API.md)."""
        board, task, agent = self.board, self.task, self.agent
        state: dict = {
            "t": round(now, 3),
            "state": self.state.value,
            "status": {"text": self.status, "tone": self.tone},
            "agents": [{"name": a.name, "kind": a.kind, "tool": a.tool} for a in self.agents],
            "task": task.to_dict() if task else None,
            "agent": {"name": agent.name, "kind": agent.kind, "tool": agent.tool} if task and agent else None,
            "renderings": {"human": agent.instruction(task), "robot": robot_command(task)} if task and agent else None,
            "result": self.result,
            "clean_ratio": self.p.clean_ratio,
            "board": None,
            "cells": {},
            "dirty": [],
            "heatmap": None,
            "scene": {
                "occupied": self.monitor.occupied,
                "person": round(self.monitor.person / self.p.person_ratio, 3),
                "motion": round(self.monitor.motion / self.p.motion_ratio, 3),
                "settle": round(min(1.0, self.monitor.clear_for(now) / self.p.settle_s), 3),
            },
            "flywheel": {
                "episodes": len(self.log.records) if self.log else 0,
                "by_agent": self.log.stats() if self.log else {},
                "last": self.log.records[-1] if self.log and self.log.records else None,
                "log_dir": f"/runs/{self.log.dir.name}" if self.log else None,
            },
        }
        if board is not None:
            fine_cols, fine_rows = self.fine_edges()
            state["board"] = {
                "size_mm": list(board.size_mm),
                "image_size": list(board.rect_size),
                "col_edges": board.col_edges,
                "row_edges": board.row_edges,
                "cells": [{"id": c.id, "uv": [round(x, 4) for x in c.uv]} for c in board.cells],
                "fine_col_edges": [round(e, 4) for e in fine_cols],
                "fine_row_edges": [round(e, 4) for e in fine_rows],
            }
            state["cells"] = {cid: round(r, 5) for cid, r in self.ratios.items()}
            state["dirty"] = [cid for cid, r in self.ratios.items() if r >= self.p.clean_ratio]
        if self.heat is not None:
            state["heatmap"] = {
                "rows": self.heat.shape[0],
                "cols": self.heat.shape[1],
                "values": [None if np.isnan(v) else round(float(v), 4) for v in self.heat.ravel()],
            }
        return state

    def publish(self, now: float, canvas: np.ndarray) -> None:
        images = {"dashboard": cv2.resize(canvas, (1280, 720), interpolation=cv2.INTER_AREA)}
        if self.frame is not None:
            images["camera"] = cv2.resize(self.frame, (960, 540), interpolation=cv2.INTER_AREA)
        if self.rect is not None and self.state is not State.CALIBRATE:
            images["board"] = self.rect
        episodes = [dict(r, image_urls={k: f"/runs/{self.log.dir.name}/{v}" for k, v in r["images"].items()}) for r in self.log.records] if self.log else []
        self.hub.publish(self.snapshot(now), images, episodes)
        self.t_published = now


def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="nunchi", description="Embodiment-agnostic whiteboard cleaning.")
    ap.add_argument("--source", default="0", help="webcam index or video file (default: 0)")
    ap.add_argument("--loop", action="store_true", help="loop a video file")
    ap.add_argument("--board", default="board.json", help="calibration file (default: board.json)")
    ap.add_argument("--grid", default=str(GRID_FILE), help="tick positions from nunchi-grid; read from the board when missing")
    ap.add_argument("--agents", default="Marc,Kangmin", help="embodiments, comma separated, as name[:tool]")
    ap.add_argument("--voice", default="Samantha", help="macOS voice for spoken instructions")
    ap.add_argument("--mute", action="store_true", help="no spoken instructions")
    ap.add_argument("--cols", type=int, default=8, help="columns when no ticks are found (default: 8)")
    ap.add_argument("--rows", type=int, default=4, help="rows when no ticks are found (default: 4)")
    ap.add_argument("--fine", type=int, default=4, help="heatmap subdivisions per cell side (default: 4)")
    ap.add_argument("--size-mm", default=None, help="frame size in mm, e.g. 1100x500")
    ap.add_argument("--clean", type=float, default=0.25, help="max ink %% for a clean cell (default: 0.25)")
    ap.add_argument("--settle", type=float, default=1.2, help="seconds of clear board before measuring")
    ap.add_argument("--runs", default="runs", help="where episodes are logged (default: runs/)")
    ap.add_argument("--port", type=int, default=8001, help="HTTP API port (default: 8001)")
    ap.add_argument("--no-server", action="store_true", help="do not start the HTTP API")
    ap.add_argument("--headless", action="store_true", help="no OpenCV window (front-ends use the API)")
    return ap


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    sys.stdout.reconfigure(line_buffering=True)
    args.runs = str(Path(args.runs).resolve())  # runs/ may be a symlink into Google Drive
    hub = None
    if not args.no_server:
        hub = Hub()
        serve(hub, Path(args.runs), args.port)
        print(f"API: http://{lan_address()}:{args.port}  (docs: /docs, fallback UI: /)")
    App(args, FrameSource(args.source, loop=args.loop), hub).run(window=not args.headless)


if __name__ == "__main__":
    main()
