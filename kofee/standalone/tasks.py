"""The embodiment-agnostic task interface, and the agents (embodiments) that execute it."""

from __future__ import annotations

import json
import math
import shutil
import subprocess
from collections import Counter
from dataclasses import asdict, dataclass

from ..board import Board


@dataclass(frozen=True)
class Task:
    """A unit of work stated only in board coordinates, with its own success criterion.

    Nothing in it assumes who or what will execute it: this is the unified interface.
    """

    id: str
    cell: str
    region_uv: tuple[float, float, float, float]
    region_mm: tuple[float, float, float, float]
    attempt: int
    action: str = "erase"
    success: str = "ink_ratio < 0.25%"

    def to_dict(self) -> dict:
        d = asdict(self)
        d["region_uv"] = [round(x, 3) for x in self.region_uv]
        d["region_mm"] = [round(x) for x in self.region_mm]
        return d

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


class Planner:
    """Turns the measured board state into the next task: dirty cells, in reading order."""

    def __init__(self, board: Board, clean_ratio: float, max_attempts: int = 3):
        self.board = board
        self.clean_ratio = clean_ratio
        self.max_attempts = max_attempts
        self.attempts: Counter[str] = Counter()
        self.count = 0

    def dirty(self, ratios: dict[str, float]) -> list[str]:
        return [c.id for c in self.board.cells if ratios.get(c.id, 0.0) >= self.clean_ratio]

    def given_up(self, ratios: dict[str, float]) -> list[str]:
        return [cid for cid in self.dirty(ratios) if self.attempts[cid] >= self.max_attempts]

    def next_task(self, ratios: dict[str, float]) -> Task | None:
        todo = [cid for cid in self.dirty(ratios) if self.attempts[cid] < self.max_attempts]
        if not todo:
            return None
        cell = self.board.cell(todo[0])
        self.attempts[cell.id] += 1
        self.count += 1
        return Task(
            id=f"T{self.count:03d}",
            cell=cell.id,
            region_uv=cell.uv,
            region_mm=self.board.uv_to_mm(*cell.uv),
            attempt=self.attempts[cell.id],
            success=f"ink_ratio < {self.clean_ratio:.2%}",
        )


@dataclass
class Agent:
    """One embodiment. Each renders the same Task in the form it can execute."""

    name: str
    kind: str = "human"  # "human" | "robot-arm"
    tool: str = "eraser"
    voice: str | None = "Samantha"

    def instruction(self, task: Task) -> str:
        if self.kind == "robot-arm":
            return robot_command(task)
        return f"{self.name}, erase cell {task.cell}."


def robot_command(task: Task, eraser_mm: float = 50.0) -> str:
    """The same task as a motion primitive for a robot arm, in board millimetres."""
    x0, y0, x1, y1 = task.region_mm
    passes = max(1, math.ceil((y1 - y0) / eraser_mm))
    return f"arm.wipe(x={x0:.0f}..{x1:.0f}mm, y={y0:.0f}..{y1:.0f}mm, passes={passes})"


def say(text: str, voice: str | None) -> None:
    """Speak without blocking the camera loop (macOS `say`)."""
    if voice and shutil.which("say"):
        subprocess.Popen(["say", "-v", voice, text])
