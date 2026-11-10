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
CELL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
_PERSON_KERNEL = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))


def cells_covered(regions: list[dict], cols: int, rows: int) -> list[tuple[int, int]]:
    """(col, row) of every cell a region touches, as the app server's cellsCoveredBy counts them."""
    out = set()
    for r in regions:
        if (r.get("score") or 1.0) < 0.5:
            continue
        left, right = max(0, int(np.floor(r["x"] * cols))), min(cols - 1, int(np.ceil((r["x"] + r["w"]) * cols)) - 1)
        top, bottom = max(0, int(np.floor(r["y"] * rows))), min(rows - 1, int(np.ceil((r["y"] + r["h"]) * rows)) - 1)
        out |= {(c, row) for c in range(left, right + 1) for row in range(top, bottom + 1)}
    return sorted(out, key=lambda cr: (cr[1], cr[0]))


def cell_names(cells: list[tuple[int, int]]) -> list[str]:
    return [f"{CELL_LETTERS[c]}{r + 1}" for c, r in cells]


@dataclass(frozen=True)
class Grid:
    """Where the graduation ticks really are, in board fractions (0 and 1 included).

    The app server lays a uniform grid over board space. Reporting regions through this piecewise-linear
    map makes the app server's uniform cells coincide with the cells drawn on the physical board.
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


def ink_regions(ink: np.ndarray, min_pixels: int = 40, join_px: int = 6) -> list[tuple[float, float, float, float, int]]:
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


_BANNERS = {"no_board": "BOARD NOT FULLY VISIBLE - SCAN SKIPPED", "occluded": "SOMEONE IN FRONT - SCAN SKIPPED"}


def side_by_side(frame: np.ndarray, analysis: Analysis, board: np.ndarray | None, dirty: list[str]) -> np.ndarray:
    """A 1920x1080 view for the video: the camera frame with the board outline, and what is reported."""
    canvas = np.full((1080, 1920, 3), 24, np.uint8)
    TOP = 270
    cam = frame.copy()
    if analysis.corners is not None:
        cv2.polylines(cam, [analysis.corners.astype(np.int32)], True, (80, 220, 80), max(2, frame.shape[1] // 400))
    cam = cv2.resize(cam, (940, round(940 * frame.shape[0] / frame.shape[1])), interpolation=cv2.INTER_AREA)
    canvas[TOP : TOP + cam.shape[0], 10 : 10 + cam.shape[1]] = cam[: 1080 - TOP]
    if board is None:
        board = np.full((437, 1000, 3), 40, np.uint8)
    view = cv2.resize(board, (940, round(940 * board.shape[0] / board.shape[1])), interpolation=cv2.INTER_AREA)
    canvas[TOP : TOP + view.shape[0], 970 : 970 + view.shape[1]] = view
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(canvas, "camera", (10, TOP - 25), font, 1.2, (200, 200, 200), 2, cv2.LINE_AA)
    cv2.putText(canvas, "what the algorithm reports", (970, TOP - 25), font, 1.2, (200, 200, 200), 2, cv2.LINE_AA)
    if analysis.reason:
        cv2.putText(canvas, _BANNERS.get(analysis.reason, analysis.reason), (970, TOP + view.shape[0] + 70), font, 1.1, (80, 80, 240), 3, cv2.LINE_AA)
    else:
        text = f"dirty cells: {' '.join(dirty)}" if dirty else "board clean"
        cv2.putText(canvas, text, (970, TOP + view.shape[0] + 70), font, 1.3, (0, 160, 255) if dirty else (80, 220, 80), 3, cv2.LINE_AA)
    cv2.putText(canvas, "nunchi", (10, TOP - 110), font, 1.6, (240, 240, 240), 3, cv2.LINE_AA)
    return canvas


def annotate(analysis: Analysis, grid: Grid | None, cols: int, rows: int) -> np.ndarray | None:
    """The rectified board as the app server will understand it: grid, dirty cells, ink and reported boxes."""
    if analysis.board is None:
        return None
    img = analysis.board.copy()
    h, w = img.shape[:2]
    col_edges = grid.col_edges if grid else np.linspace(0, 1, cols + 1)
    row_edges = grid.row_edges if grid else np.linspace(0, 1, rows + 1)
    xs = [round(e * w) for e in col_edges]
    ys = [round(e * h) for e in row_edges]
    dirty = set(cells_covered(analysis.regions, cols, rows))
    tint = img.copy()
    for c, r in dirty:
        cv2.rectangle(tint, (xs[c], ys[r]), (xs[c + 1], ys[r + 1]), (0, 140, 255), -1)
    img = cv2.addWeighted(tint, 0.3, img, 0.7, 0)
    if analysis.ink is not None:
        img[analysis.ink] = (255, 0, 255)
    for x in xs[1:-1]:
        cv2.line(img, (x, 0), (x, h), (0, 160, 0), 1)
    for y in ys[1:-1]:
        cv2.line(img, (0, y), (w, y), (0, 160, 0), 1)
    for r in range(rows):
        for c in range(cols):
            colour = (0, 90, 200) if (c, r) in dirty else (120, 120, 120)
            cv2.putText(img, f"{CELL_LETTERS[c]}{r + 1}", (xs[c] + 6, ys[r] + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, colour, 2)
    for r in analysis.regions:
        x0, y0, x1, y1 = r["x"], r["y"], r["x"] + r["w"], r["y"] + r["h"]
        if grid is not None:
            x0, x1 = (float(np.interp(v, np.linspace(0, 1, len(grid.col_edges)), grid.col_edges)) for v in (x0, x1))
            y0, y1 = (float(np.interp(v, np.linspace(0, 1, len(grid.row_edges)), grid.row_edges)) for v in (y0, y1))
        cv2.rectangle(img, (round(x0 * w), round(y0 * h)), (round(x1 * w), round(y1 * h)), (0, 140, 255), 2)
    return img
