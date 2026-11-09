"""One frame in, board corners and dirt boxes out: the algorithm behind protocol/algorithm-server.md."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from .board import Board
from .marks import find_corners
from .vision import Params, ink_mask, valid_mask

PROTOCOL_VERSION = 1
_PERSON_KERNEL = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))


@dataclass(frozen=True)
class Grid:
    """Where the graduation ticks really are, in board fractions (0 and 1 included).

    wtbd lays a uniform grid over board space. Reporting regions through this piecewise-linear
    map makes wtbd's uniform cells coincide with the cells drawn on the physical board.
    """

    col_edges: tuple[float, ...]
    row_edges: tuple[float, ...]

    @classmethod
    def load(cls, path: str | Path) -> Grid:
        d = json.loads(Path(path).read_text())
        return cls(tuple(d["col_edges"]), tuple(d["row_edges"]))

    def remap(self, x0: float, y0: float, x1: float, y1: float) -> tuple[float, float, float, float]:
        cols = np.linspace(0, 1, len(self.col_edges))
        rows = np.linspace(0, 1, len(self.row_edges))
        return (
            float(np.interp(x0, self.col_edges, cols)),
            float(np.interp(y0, self.row_edges, rows)),
            float(np.interp(x1, self.col_edges, cols)),
            float(np.interp(y1, self.row_edges, rows)),
        )


@dataclass
class Analysis:
    corners: np.ndarray | None  # frame pixels, TL TR BR BL
    reason: str | None  # why the scan is unusable: no_board | occluded
    regions: list[dict]
    board: np.ndarray | None = None  # rectified board, for debugging
    ink: np.ndarray | None = None

    def to_response(self, frame_size: tuple[int, int]) -> dict:
        w, h = frame_size
        corners = None if self.corners is None else [[round(float(x) / w, 4), round(float(y) / h, 4)] for x, y in self.corners]
        response = {"corners": corners, "regions": self.regions if corners else [], "version": PROTOCOL_VERSION}
        response["frame"] = {"width": w, "height": h}
        if self.reason:
            response["reason"] = self.reason
        return response


def occluded(rect: np.ndarray, p: Params) -> bool:
    """Someone stands between the camera and the board: a large region far darker than the board.

    Marker strokes and the labels along the edges are too thin to survive the opening.
    """
    grey = cv2.cvtColor(rect, cv2.COLOR_BGR2GRAY)
    valid = valid_mask(*grey.shape, p.border)
    level = np.median(grey[valid])
    dark = cv2.morphologyEx(((grey < level - p.person_dark) & valid).astype(np.uint8), cv2.MORPH_OPEN, _PERSON_KERNEL)
    return dark.mean() > p.person_ratio


def ink_regions(ink: np.ndarray, min_pixels: int = 25, join_px: int = 6) -> list[tuple[float, float, float, float, int]]:
    """Tight boxes around blobs of ink, as (x0, y0, x1, y1) board fractions plus their ink pixel count.

    Strokes closer than `join_px` are grouped, so a letter is one box but separate words stay apart:
    a union box would task every cell in between.
    """
    h, w = ink.shape
    joined = cv2.dilate(ink.astype(np.uint8), np.ones((2 * join_px + 1, 2 * join_px + 1), np.uint8))
    n, labels = cv2.connectedComponents(joined, connectivity=8)
    ys, xs = np.nonzero(ink)
    ids = labels[ys, xs]
    count = np.bincount(ids, minlength=n)
    x0 = np.full(n, w)
    y0 = np.full(n, h)
    x1 = np.zeros(n, int)
    y1 = np.zeros(n, int)
    np.minimum.at(x0, ids, xs)
    np.minimum.at(y0, ids, ys)
    np.maximum.at(x1, ids, xs + 1)
    np.maximum.at(y1, ids, ys + 1)
    return [(x0[i] / w, y0[i] / h, x1[i] / w, y1[i] / h, int(count[i])) for i in range(1, n) if count[i] >= min_pixels]


def analyze(img: np.ndarray, grid: Grid | None = None, size_mm: tuple[float, float] = (1120.0, 490.0), p: Params | None = None) -> Analysis:
    p = p or Params()
    corners = find_corners(img)
    if corners is None:
        return Analysis(None, "no_board", [])
    board = Board(corners, size_mm)
    rect = board.rectify(img)
    if occluded(rect, p):
        return Analysis(None, "occluded", [], rect)
    ink = ink_mask(rect, p)
    regions = []
    for x0, y0, x1, y1, pixels in ink_regions(ink):
        if grid is not None:
            x0, y0, x1, y1 = grid.remap(x0, y0, x1, y1)
        score = min(1.0, 0.5 + pixels / 400)
        regions.append({"x": round(x0, 4), "y": round(y0, 4), "w": round(x1 - x0, 4), "h": round(y1 - y0, 4), "score": round(score, 2)})
    return Analysis(corners, None, regions, rect, ink)


def annotate(analysis: Analysis, grid: Grid | None, cols: int, rows: int) -> np.ndarray | None:
    """The rectified board with wtbd's grid and the reported boxes drawn on it."""
    if analysis.board is None:
        return None
    img = analysis.board.copy()
    h, w = img.shape[:2]
    if analysis.ink is not None:
        img[analysis.ink] = (255, 0, 255)
    col_edges = grid.col_edges if grid else np.linspace(0, 1, cols + 1)
    row_edges = grid.row_edges if grid else np.linspace(0, 1, rows + 1)
    for e in col_edges[1:-1]:
        cv2.line(img, (round(e * w), 0), (round(e * w), h), (0, 160, 0), 1)
    for e in row_edges[1:-1]:
        cv2.line(img, (0, round(e * h)), (w, round(e * h)), (0, 160, 0), 1)
    for r in analysis.regions:
        x0, y0, x1, y1 = r["x"], r["y"], r["x"] + r["w"], r["y"] + r["h"]
        if grid is not None:
            x0, x1 = (float(np.interp(v, np.linspace(0, 1, len(grid.col_edges)), grid.col_edges)) for v in (x0, x1))
            y0, y1 = (float(np.interp(v, np.linspace(0, 1, len(grid.row_edges)), grid.row_edges)) for v in (y0, y1))
        cv2.rectangle(img, (round(x0 * w), round(y0 * h)), (round(x1 * w), round(y1 * h)), (0, 140, 255), 2)
    return img
