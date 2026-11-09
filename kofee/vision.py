"""Pixel-level perception on the rectified board image: ink, people and motion."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import cv2
import numpy as np

from .board import Board


@dataclass
class Params:
    ink_dark: int = 18            # ink is at least this much darker (L*, 0-255) than its local background...
    ink_max_warmth: int = 2       # ...and not warmer than it, which rejects the orange light reflections
    border: float = 0.025         # ignore this fraction of the frame along its edges (black corners, ticks)
    clean_ratio: float = 0.0025   # a cell is clean when less than this fraction of it is ink
    person_dark: int = 45         # pixels this much darker than the clear board: a person, an arm, an eraser
    person_ratio: float = 0.004   # the board is occupied above this fraction of such pixels
    motion_ratio: float = 0.004   # the image is still below this fraction of changing pixels
    settle_s: float = 1.2         # the board must stay clear and still this long before it is measured


@lru_cache(maxsize=8)
def valid_mask(h: int, w: int, border: float) -> np.ndarray:
    mask = np.zeros((h, w), dtype=bool)
    b = round(border * h)
    mask[b : h - b, b : w - b] = True
    return mask


def subdivide(edges: list[float], k: int) -> list[float]:
    """Split every interval of a grid into k equal parts (the fine heatmap grid)."""
    out = []
    for a, b in zip(edges, edges[1:]):
        out += [a + (b - a) * i / k for i in range(k)]
    return out + [edges[-1]]


def ink_mask(rect: np.ndarray, p: Params) -> np.ndarray:
    """Pixels covered by marker ink: darker than their surroundings and not orange.

    Thin strokes lose most of their colour to the camera's chroma subsampling, so darkness is
    the main cue. The colour test only has to reject warm reflections, which are brighter anyway.
    """
    lab = cv2.cvtColor(rect, cv2.COLOR_BGR2LAB)
    lum, warm = lab[..., 0], lab[..., 2]
    dark = cv2.medianBlur(lum, 31).astype(np.int16) - lum > p.ink_dark
    not_warm = warm.astype(np.int16) - cv2.medianBlur(warm, 31) <= p.ink_max_warmth
    return dark & not_warm & valid_mask(*rect.shape[:2], p.border)


def grid_ratios(mask: np.ndarray, col_edges: list[float], row_edges: list[float], border: float = 0.0) -> np.ndarray:
    """Fraction of each cell of a (possibly non-uniform) grid covered by `mask`, as a rows x cols array.

    Uses integral images, so a 32 x 16 heatmap costs about as much as a single cell.
    """
    h, w = mask.shape[:2]
    valid = valid_mask(h, w, border)
    hits = cv2.integral((mask & valid).astype(np.uint8))
    area = cv2.integral(valid.astype(np.uint8))
    xs = np.round(np.asarray(col_edges) * w).astype(int)
    ys = np.round(np.asarray(row_edges) * h).astype(int)

    def box_sums(ii: np.ndarray) -> np.ndarray:
        return (
            ii[np.ix_(ys[1:], xs[1:])] - ii[np.ix_(ys[:-1], xs[1:])] - ii[np.ix_(ys[1:], xs[:-1])] + ii[np.ix_(ys[:-1], xs[:-1])]
        ).astype(np.float64)

    a = box_sums(area)
    return np.divide(box_sums(hits), a, out=np.zeros_like(a), where=a > 0)


def cell_ratios(mask: np.ndarray, board: Board, p: Params) -> dict[str, float]:
    """Fraction of each cell's visible area covered by ink, keyed by cell id."""
    grid = grid_ratios(mask, board.col_edges, board.row_edges, p.border)
    return {cell.id: float(r) for cell, r in zip(board.cells, grid.ravel())}


_PERSON_KERNEL = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))


class SceneMonitor:
    """Tells whether someone is in front of the board and whether the image is still.

    A person, an arm or an eraser shows up as a large region much darker than the clear board.
    Marker strokes are too thin to survive the morphological opening, so writing never counts.
    """

    def __init__(self, p: Params):
        self.p = p
        self.reference: np.ndarray | None = None  # board as last seen clear, half resolution
        self.previous: np.ndarray | None = None
        self.clear_since: float | None = None
        self.blobs: np.ndarray | None = None  # where people are, half resolution
        self.person = 0.0
        self.motion = 0.0

    def update(self, rect: np.ndarray, now: float) -> None:
        small = cv2.resize(rect, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
        grey = cv2.GaussianBlur(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY), (5, 5), 0).astype(np.float32)
        valid = valid_mask(*grey.shape, self.p.border)
        if self.reference is None:
            self.reference = grey.copy()
        dark = ((self.reference - grey) > self.p.person_dark).astype(np.uint8)
        self.blobs = cv2.morphologyEx(dark, cv2.MORPH_OPEN, _PERSON_KERNEL).astype(bool)
        self.person = float(self.blobs[valid].mean())
        if self.previous is not None:
            self.motion = float((np.abs(grey - self.previous) > 18)[valid].mean())
        self.previous = grey

        if self.person < self.p.person_ratio and self.motion < self.p.motion_ratio:
            if self.clear_since is None:
                self.clear_since = now
            cv2.accumulateWeighted(grey, self.reference, 0.05)  # follow slow exposure drift
        else:
            self.clear_since = None

    @property
    def occupied(self) -> bool:
        return self.person >= self.p.person_ratio

    def clear_for(self, now: float) -> float:
        return 0.0 if self.clear_since is None else now - self.clear_since

    def settled(self, now: float) -> bool:
        return self.clear_for(now) >= self.p.settle_s
