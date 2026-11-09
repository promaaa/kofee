"""Screen rendering. The laptop faces the board, so the instruction is drawn huge."""

from __future__ import annotations

import textwrap
from dataclasses import dataclass
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from ..board import Board
from .tasks import Agent, Task, robot_command

SIZE = (1920, 1080)

# Colours are BGR (OpenCV order).
BG = (24, 22, 20)
GRID = (150, 150, 150)
TEXT = (240, 240, 240)
MUTED = (150, 150, 150)
AMBER = (0, 190, 255)
GREEN = (110, 210, 80)
RED = (80, 80, 240)
INK = (255, 60, 220)
DIRTY = (0, 140, 255)
HIDDEN = (90, 90, 90)
FINE_GRID = (185, 185, 185)
TONES = {"info": TEXT, "wait": AMBER, "ok": GREEN, "bad": RED}

FACES = {
    "regular": ("/System/Library/Fonts/Avenir Next.ttc", 7),
    "medium": ("/System/Library/Fonts/Avenir Next.ttc", 5),
    "bold": ("/System/Library/Fonts/Avenir Next.ttc", 2),
    "heavy": ("/System/Library/Fonts/Avenir Next.ttc", 8),
    "mono": ("/System/Library/Fonts/Menlo.ttc", 0),
}


@lru_cache(maxsize=64)
def font(face: str, size: int) -> ImageFont.FreeTypeFont:
    path, index = FACES[face]
    try:
        return ImageFont.truetype(path, size, index=index)
    except OSError:  # not on macOS: fall back to Pillow's bundled font
        return ImageFont.load_default(size)


class Canvas:
    """OpenCV drawing plus a single Pillow pass for anti-aliased text."""

    def __init__(self, img: np.ndarray | None = None):
        self.img = img if img is not None else np.full((SIZE[1], SIZE[0], 3), BG, np.uint8)
        self.texts: list[tuple] = []

    def text(self, xy, s: str, size: int, color=TEXT, face: str = "medium", anchor: str = "lt") -> None:
        self.texts.append((xy, s, size, color, face, anchor))

    def finish(self) -> np.ndarray:
        rgb = Image.fromarray(cv2.cvtColor(self.img, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(rgb)
        for xy, s, size, color, face, anchor in self.texts:
            draw.text(xy, s, font=font(face, size), fill=tuple(reversed(color)), anchor=anchor)
        return cv2.cvtColor(np.asarray(rgb), cv2.COLOR_RGB2BGR)


@dataclass
class View:
    """Everything the dashboard shows, decoupled from the app's state machine."""

    state: str
    frame: np.ndarray
    rect: np.ndarray
    board: Board
    ink: np.ndarray | None
    heat: np.ndarray | None  # fine ink ratios (rows x cols), NaN where the board is hidden
    fine_edges: tuple[list[float], list[float]]
    ratios: dict[str, float]
    clean_ratio: float
    occupied: bool
    person: float  # occupancy signal, 1.0 = threshold
    motion: float  # motion signal, 1.0 = threshold
    settle: float  # 0..1 progress towards the next measurement
    task: Task | None
    agent: Agent | None
    status: str
    tone: str
    result: bool | None
    stats: dict[str, dict]
    episodes: int
    log_path: str | None
    show_ink: bool


def calibration_view(frame: np.ndarray, clicks: list[tuple[int, int]]) -> np.ndarray:
    img = cv2.resize(frame, SIZE)
    strip = img[:130].astype(np.float32) * 0.35
    img[:130] = strip.astype(np.uint8)
    c = Canvas(img)
    c.text((40, 24), "Calibration: click the inner corner of each black L", 42, TEXT, "bold")
    c.text((40, 84), f"{len(clicks)}/4 corners · any order · Backspace undo · Esc cancel", 26, MUTED)
    for x, y in clicks:
        cv2.circle(img, (x, y), 14, AMBER, 3)
        cv2.circle(img, (x, y), 3, AMBER, -1)
    if len(clicks) >= 2:
        cv2.polylines(img, [np.int32(clicks)], len(clicks) == 4, AMBER, 2)
    return c.finish()


def dashboard(v: View) -> np.ndarray:
    c = Canvas()
    _header(c, v)
    _board(c, v, x=40, y=100, width=1200)
    _camera(c, v, x=40, y=680, width=560)
    _scene(c, v, x=640, y=680, width=600)
    if v.task is not None and v.agent is not None:
        _task_card(c, v, x=1290, y=100)
    elif v.state == "done":
        _done_card(c, v, x=1290, y=100)
    else:
        _idle_card(c, v, x=1290, y=100)
    _flywheel(c, v, x=1290, y=870)
    c.text((40, 1046), "SPACE start / verify now   C calibrate   R reset   D ink overlay   F fullscreen   Q quit", 20, MUTED)
    return c.finish()


STATE_LABELS = {
    "ready": ("READY", MUTED),
    "scan": ("LOOKING AT THE BOARD", AMBER),
    "assigned": ("WAITING FOR AGENT", AMBER),
    "working": ("AGENT AT WORK", AMBER),
    "done": ("DONE", GREEN),
}


def _header(c: Canvas, v: View) -> None:
    c.text((40, 22), "kofee", 44, TEXT, "heavy")
    c.text((190, 40), "one task interface · any embodiment · automatic verification", 22, MUTED)
    if v.state == "result":
        label, color = ("VERIFIED: CLEAN", GREEN) if v.result else ("VERIFIED: NOT CLEAN", RED)
    else:
        label, color = STATE_LABELS.get(v.state, (v.state.upper(), MUTED))
    width = font("bold", 26).getlength(label)
    cv2.circle(c.img, (int(1880 - width - 22), 50), 9, color, -1)
    c.text((1880, 50), label, 26, color, "bold", anchor="rm")


def _board(c: Canvas, v: View, x: int, y: int, width: int) -> None:
    scale = width / v.rect.shape[1]
    img = cv2.resize(v.rect, (width, round(v.rect.shape[0] * scale)), interpolation=cv2.INTER_AREA)
    h = img.shape[0]
    box = lambda cell: tuple(round(t * scale) for t in cell.px)  # noqa: E731

    if v.heat is not None:  # fine heatmap: what the verifier sees, cell by cell
        tint = img.copy()
        fine_cols, fine_rows = v.fine_edges
        xs = [round(e * width) for e in fine_cols]
        ys = [round(e * h) for e in fine_rows]
        for ri in range(len(ys) - 1):
            for ci in range(len(xs) - 1):
                ratio = v.heat[ri, ci]
                if np.isnan(ratio):
                    color = HIDDEN
                elif ratio >= 0.04:
                    color = RED
                elif ratio >= 0.01:
                    color = DIRTY
                else:
                    continue
                cv2.rectangle(tint, (xs[ci] + 1, ys[ri] + 1), (xs[ci + 1] - 1, ys[ri + 1] - 1), color, -1)
        img = cv2.addWeighted(tint, 0.45, img, 0.55, 0)
        for e in fine_cols[1:-1]:
            cv2.line(img, (round(e * width), 0), (round(e * width), h), FINE_GRID, 1)
        for e in fine_rows[1:-1]:
            cv2.line(img, (0, round(e * h)), (width, round(e * h)), FINE_GRID, 1)

    if v.show_ink and v.ink is not None and not v.occupied:
        mask = cv2.resize(v.ink.astype(np.uint8), (width, h), interpolation=cv2.INTER_NEAREST).astype(bool)
        img[mask] = INK

    for e in v.board.col_edges[1:-1]:
        cv2.line(img, (round(e * width), 0), (round(e * width), h), GRID, 1)
    for e in v.board.row_edges[1:-1]:
        cv2.line(img, (0, round(e * h)), (width, round(e * h)), GRID, 1)
    cv2.rectangle(img, (0, 0), (width - 1, h - 1), GRID, 2)

    for cell in v.board.cells:
        x0, y0, x1, y1 = box(cell)
        c.text((x + x0 + 8, y + y0 + 6), cell.id, 20, (90, 90, 90), "bold")
        ratio = v.ratios.get(cell.id, 0.0)
        if ratio >= v.clean_ratio:
            c.text((x + x1 - 8, y + y1 - 8), f"{ratio:.1%}", 18, (0, 110, 220), "bold", anchor="rs")

    if v.task is not None:
        x0, y0, x1, y1 = box(v.board.cell(v.task.cell))
        color = AMBER if v.result is None else (GREEN if v.result else RED)
        cv2.rectangle(img, (x0, y0), (x1, y1), color, 6)
    c.img[y : y + h, x : x + width] = img


def _camera(c: Canvas, v: View, x: int, y: int, width: int) -> None:
    fh, fw = v.frame.shape[:2]
    s = width / fw
    img = cv2.resize(v.frame, (width, round(fh * s)), interpolation=cv2.INTER_AREA)
    cv2.polylines(img, [np.int32(v.board.corners * s)], True, GREEN, 2)
    if v.task is not None:
        u0, v0, u1, v1 = v.task.region_uv
        quad = v.board.uv_to_image([(u0, v0), (u1, v0), (u1, v1), (u0, v1)]) * s
        cv2.polylines(img, [np.int32(quad)], True, AMBER, 3)
    c.img[y : y + img.shape[0], x : x + width] = img
    c.text((x + 10, y + 8), "CAMERA", 18, TEXT, "bold")


def _bar(c: Canvas, x: int, y: int, width: int, fill: float, color) -> None:
    cv2.rectangle(c.img, (x, y), (x + width, y + 12), (60, 60, 60), -1)
    cv2.rectangle(c.img, (x, y), (x + round(width * min(max(fill, 0.0), 1.0)), y + 12), color, -1)


def _scene(c: Canvas, v: View, x: int, y: int, width: int) -> None:
    c.text((x, y), "SCENE", 20, MUTED, "bold")
    rows = [
        ("Someone at the board", "yes" if v.occupied else "no", v.person / 2, AMBER if v.occupied else GREEN),
        ("Motion", "", v.motion / 2, AMBER if v.motion >= 1 else GREEN),
        ("Board settled", "measuring" if v.settle >= 1 else "", v.settle, GREEN if v.settle >= 1 else MUTED),
    ]
    for i, (label, value, fill, color) in enumerate(rows):
        ty = y + 40 + i * 70
        c.text((x, ty), label, 24, TEXT)
        c.text((x + width, ty), value, 24, color, "bold", anchor="rt")
        _bar(c, x, ty + 38, width, fill, color)
    ly = y + 260
    legend = [(DIRTY, "some ink"), (RED, "heavy ink"), (HIDDEN, "hidden"), (AMBER, "task")]
    for i, (swatch, label) in enumerate(legend):
        lx = x + i * 150
        cv2.rectangle(c.img, (lx, ly + 4), (lx + 22, ly + 26), swatch, -1 if i < 3 else 3)
        c.text((lx + 32, ly + 2), label, 20, MUTED)


def _task_card(c: Canvas, v: View, x: int, y: int) -> None:
    task, agent = v.task, v.agent
    c.text((x, y), f"TASK {task.id} · ATTEMPT {task.attempt}", 24, MUTED, "bold")
    c.text((x, y + 36), agent.name, 72, TEXT, "bold")
    c.text((x, y + 140), f"erase cell  ·  {agent.tool}", 32, MUTED)
    color = AMBER if v.result is None else (GREEN if v.result else RED)
    c.text((x - 8, y + 178), task.cell, 230, color, "heavy")
    for i, line in enumerate(textwrap.wrap(v.status, 30)[:2]):
        c.text((x, y + 448 + i * 44), line, 36, TONES.get(v.tone, TEXT), "bold")
    c.text((x, y + 540), "UNIFIED TASK", 20, MUTED, "bold")
    for i, line in enumerate(textwrap.wrap(task.to_json(), 54)[:4]):
        c.text((x, y + 570 + i * 24), line, 17, TEXT, "mono")
    c.text((x, y + 680), "SAME TASK, PER EMBODIMENT", 20, MUTED, "bold")
    c.text((x, y + 710), f"human  {agent.instruction(task) if agent.kind == 'human' else ''}", 17, TEXT, "mono")
    c.text((x, y + 736), f"robot  {robot_command(task)}", 17, TEXT, "mono")


def _idle_card(c: Canvas, v: View, x: int, y: int) -> None:
    dirty = [cid for cid, r in v.ratios.items() if r >= v.clean_ratio]
    if v.state == "ready":
        c.text((x, y), "READY", 24, MUTED, "bold")
        for i, line in enumerate(["Write in blue", "inside the frame,", "then press SPACE"]):
            c.text((x, y + 40 + i * 76), line, 60, TEXT, "bold")
    else:
        c.text((x, y), "PLANNING", 24, MUTED, "bold")
        c.text((x, y + 40), "Looking at", 60, TEXT, "bold")
        c.text((x, y + 116), "the board…", 60, TEXT, "bold")
        for i, line in enumerate(textwrap.wrap(v.status, 30)[:2]):
            c.text((x, y + 230 + i * 46), line, 36, TONES.get(v.tone, TEXT), "bold")
    c.text((x, y + 360), f"{len(dirty)} dirty cell{'s' if len(dirty) != 1 else ''} detected", 36, AMBER if dirty else GREEN, "bold")
    for i, line in enumerate(textwrap.wrap("  ".join(dirty), 40)[:4]):
        c.text((x, y + 416 + i * 32), line, 24, TEXT, "mono")


def _done_card(c: Canvas, v: View, x: int, y: int) -> None:
    c.text((x, y), "DONE", 24, MUTED, "bold")
    c.text((x, y + 40), "Board clean" if v.tone == "ok" else "Finished", 84, GREEN if v.tone == "ok" else RED, "heavy")
    for i, line in enumerate(textwrap.wrap(v.status, 34)[:3]):
        c.text((x, y + 170 + i * 42), line, 32, TEXT)
    c.text((x, y + 340), "Every attempt above is a labelled episode,", 26, MUTED)
    c.text((x, y + 374), "verified by the camera, not by a person.", 26, MUTED)
    c.text((x, y + 440), "SPACE to run again", 26, AMBER, "bold")


def _flywheel(c: Canvas, v: View, x: int, y: int) -> None:
    c.text((x, y), "FLYWHEEL", 22, MUTED, "bold")
    c.text((x + 590, y), f"{v.episodes} labelled episode{'s' if v.episodes != 1 else ''}", 22, TEXT, "bold", anchor="rt")
    c.text((x, y + 36), f"{'embodiment':<14}{'tries':>6}{'pass':>6}{'rate':>7}{'avg s':>8}", 18, MUTED, "mono")
    for i, (name, s) in enumerate(list(v.stats.items())[:3]):
        rate = s["successes"] / s["attempts"] if s["attempts"] else 0.0
        avg = s["seconds"] / s["attempts"] if s["attempts"] else 0.0
        row = f"{name[:13]:<14}{s['attempts']:>6}{s['successes']:>6}{rate:>7.0%}{avg:>8.1f}"
        c.text((x, y + 64 + i * 28), row, 20, TEXT, "mono")
    if v.log_path:
        c.text((x, y + 160), v.log_path, 15, MUTED, "mono")
