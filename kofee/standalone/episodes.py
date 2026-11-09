"""The flywheel's dataset: every attempt, labelled automatically by the verifier."""

from __future__ import annotations

import json
import time
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np

from ..board import Board
from .tasks import Agent, Task


def crop(img: np.ndarray, px: tuple[int, int, int, int], margin: float = 0.25) -> np.ndarray:
    x0, y0, x1, y1 = px
    mx, my = int((x1 - x0) * margin), int((y1 - y0) * margin)
    h, w = img.shape[:2]
    return img[max(0, y0 - my) : min(h, y1 + my), max(0, x0 - mx) : min(w, x1 + mx)]


class EpisodeLog:
    """Append-only log: what was asked, who did it, what the camera saw, and the verdict."""

    def __init__(self, root: str | Path):
        self.dir = Path(root) / time.strftime("%Y%m%d-%H%M%S")
        self.dir.mkdir(parents=True, exist_ok=True)
        self.path = self.dir / "episodes.jsonl"
        self.records: list[dict] = []

    def add(
        self,
        *,
        task: Task,
        agent: Agent,
        board: Board,
        before: np.ndarray,
        after: np.ndarray,
        ink_before: float,
        ink_after: float,
        success: bool,
        t_assigned: float,
        t_start: float | None,
        t_end: float,
        side_effects: dict,
    ) -> dict:
        n = len(self.records) + 1
        images = {}
        for tag, img in (("before", before), ("after", after)):
            name = f"ep{n:03d}_{task.cell}_{tag}.jpg"
            cv2.imwrite(str(self.dir / name), crop(img, board.cell(task.cell).px))
            images[tag] = name
        record = {
            "episode": n,
            "task": task.to_dict(),
            "agent": {"name": agent.name, "kind": agent.kind, "tool": agent.tool},
            "duration_s": round(t_end - t_assigned, 2),
            "work_s": round(t_end - t_start, 2) if t_start is not None else None,
            "ink_before": round(ink_before, 5),
            "ink_after": round(ink_after, 5),
            "success": success,
            "side_effects": side_effects,
            "images": images,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }
        self.records.append(record)
        with self.path.open("a") as f:
            f.write(json.dumps(record) + "\n")
        return record

    def stats(self) -> dict[str, dict]:
        by_agent: dict[str, dict] = defaultdict(lambda: {"attempts": 0, "successes": 0, "seconds": 0.0})
        for r in self.records:
            s = by_agent[r["agent"]["name"]]
            s["attempts"] += 1
            s["successes"] += int(r["success"])
            s["seconds"] += r["duration_s"]
        return dict(by_agent)
