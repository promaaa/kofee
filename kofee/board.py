"""Board geometry: the calibrated frame, its grid of cells and the rectifying homography.

The frame is the rectangle spanned by the inner corners of the four black L marks.
Everything downstream works in the frame's normalised coordinates (u, v) in [0, 1]^2.
That shared coordinate system is what makes a task executable by any embodiment:
a camera, a person and a robot arm can all ground "cell C2" in their own space.
"""

from __future__ import annotations

import json
import string
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np

RECT_WIDTH = 1000  # width in px of the rectified, top-down image of the frame


def uniform_edges(n: int) -> list[float]:
    return [i / n for i in range(n + 1)]


def order_corners(points) -> np.ndarray:
    """Sort four points as top-left, top-right, bottom-right, bottom-left (click order is free)."""
    p = np.asarray(points, dtype=np.float32).reshape(4, 2)
    s, d = p.sum(axis=1), p[:, 1] - p[:, 0]
    return np.float32([p[s.argmin()], p[d.argmin()], p[s.argmax()], p[d.argmax()]])


@dataclass(frozen=True)
class Cell:
    id: str                                # spreadsheet style: column letter + row number, e.g. "C2"
    uv: tuple[float, float, float, float]  # (u0, v0, u1, v1) in normalised frame coordinates
    px: tuple[int, int, int, int]          # (x0, y0, x1, y1) in the rectified image


@dataclass
class Board:
    corners: np.ndarray                    # (4, 2) camera px: top-left, top-right, bottom-right, bottom-left
    size_mm: tuple[float, float] = (1100.0, 500.0)
    col_edges: list[float] = field(default_factory=lambda: uniform_edges(8))
    row_edges: list[float] = field(default_factory=lambda: uniform_edges(4))

    def __post_init__(self) -> None:
        self.corners = np.asarray(self.corners, dtype=np.float32).reshape(4, 2)
        w = RECT_WIDTH
        h = round(w * self.size_mm[1] / self.size_mm[0])
        self.rect_size = (w, h)
        dst = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
        self.H = cv2.getPerspectiveTransform(self.corners, dst)
        self.H_inv = np.linalg.inv(self.H)
        self.cells = [
            Cell(
                f"{string.ascii_uppercase[c]}{r + 1}",
                (u0, v0, u1, v1),
                (round(u0 * w), round(v0 * h), round(u1 * w), round(v1 * h)),
            )
            for r, (v0, v1) in enumerate(zip(self.row_edges, self.row_edges[1:]))
            for c, (u0, u1) in enumerate(zip(self.col_edges, self.col_edges[1:]))
        ]
        self._by_id = {cell.id: cell for cell in self.cells}

    @property
    def cols(self) -> int:
        return len(self.col_edges) - 1

    @property
    def rows(self) -> int:
        return len(self.row_edges) - 1

    def cell(self, cell_id: str) -> Cell:
        return self._by_id[cell_id]

    def rectify(self, frame: np.ndarray, pad: int = 0) -> np.ndarray:
        """Top-down view of the frame, optionally with `pad` px of its surroundings on each side."""
        w, h = self.rect_size
        shift = np.array([[1, 0, pad], [0, 1, pad], [0, 0, 1]], dtype=np.float64)
        return cv2.warpPerspective(frame, shift @ self.H, (w + 2 * pad, h + 2 * pad), flags=cv2.INTER_LINEAR)

    def uv_to_image(self, uv) -> np.ndarray:
        """Normalised frame coordinates -> camera pixels."""
        w, h = self.rect_size
        pts = np.asarray(uv, dtype=np.float32).reshape(-1, 1, 2) * np.float32([w, h])
        return cv2.perspectiveTransform(pts, self.H_inv).reshape(-1, 2)

    def uv_to_mm(self, u0: float, v0: float, u1: float, v1: float) -> tuple[float, float, float, float]:
        width, height = self.size_mm
        return (u0 * width, v0 * height, u1 * width, v1 * height)

    def save(self, path: str | Path) -> None:
        data = {
            "corners": self.corners.round(1).tolist(),
            "size_mm": list(self.size_mm),
            "col_edges": [round(e, 4) for e in self.col_edges],
            "row_edges": [round(e, 4) for e in self.row_edges],
        }
        Path(path).write_text(json.dumps(data, indent=2) + "\n")

    @classmethod
    def load(cls, path: str | Path) -> Board:
        d = json.loads(Path(path).read_text())
        return cls(np.array(d["corners"]), tuple(d["size_mm"]), d["col_edges"], d["row_edges"])


def find_ticks(frame: np.ndarray, board: Board, axis: str, pad: int = 40) -> list[float] | None:
    """Locate the graduation marks drawn along the frame's edges.

    axis="u" reads the ticks on the top and bottom edges (column boundaries), axis="v" those on
    the left and right edges (row boundaries). Returns the full list of edges, 0 and 1 included,
    or None when no regularly spaced set of ticks is found.
    """
    grey = cv2.cvtColor(board.rectify(frame, pad=pad), cv2.COLOR_BGR2GRAY)
    w, h = board.rect_size
    if axis == "u":
        length = w
        bands = [grey[0 : 2 * pad, pad : pad + w], grey[h : h + 2 * pad, pad : pad + w]]
    else:
        length = h
        bands = [grey[pad : pad + h, 0 : 2 * pad].T, grey[pad : pad + h, w : w + 2 * pad].T]

    found = []
    for band in bands:
        dark = band < np.median(band) - 50
        profile = dark.sum(axis=0)
        margin = int(0.05 * length)  # skip the black L corners
        profile[:margin] = 0
        profile[-margin:] = 0
        ticks, x = [], 0
        while x < length:
            if profile[x] >= 4:
                start = x
                while x < length and profile[x] >= 4:
                    x += 1
                if x - start <= 0.03 * length:  # a tick is narrow; text or edges are not
                    ticks.append((start + x - 1) / 2 / length)
            x += 1
        if len(ticks) >= 2:
            gaps = np.diff(ticks)
            if gaps.std() / gaps.mean() < 0.2:
                found.append(ticks)

    if not found:
        return None
    if len(found) == 2 and len(found[0]) == len(found[1]):
        ticks = list(np.mean(found, axis=0))
    else:
        ticks = max(found, key=len)
    return [0.0] + [round(float(t), 4) for t in ticks] + [1.0]
