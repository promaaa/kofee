"""Measure where the graduation ticks sit on the board, for `kofee --grid`."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import cv2

from .board import Board, find_ticks, uniform_edges
from .marks import find_corners


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(prog="kofee-grid", description="Read the graduation ticks from a photo of the board.")
    ap.add_argument("image", help="a frame from the monitor camera, nobody in front of the board")
    ap.add_argument("--cols", type=int, default=8, help="columns to assume when no ticks are found")
    ap.add_argument("--rows", type=int, default=4, help="rows to assume when no ticks are found")
    ap.add_argument("--out", default="grid.json")
    args = ap.parse_args(argv)

    img = cv2.imread(args.image)
    if img is None:
        sys.exit(f"cannot read {args.image}")
    corners = find_corners(img)
    if corners is None:
        sys.exit("the four L marks are not all visible in this image")
    board = Board(corners)
    cols = find_ticks(img, board, "u")
    rows = find_ticks(img, board, "v")
    grid = {"col_edges": cols or uniform_edges(args.cols), "row_edges": rows or uniform_edges(args.rows)}
    Path(args.out).write_text(json.dumps(grid, indent=2) + "\n")
    print(f"{len(grid['col_edges']) - 1} columns ({'ticks' if cols else 'uniform'}), "
          f"{len(grid['row_edges']) - 1} rows ({'ticks' if rows else 'uniform'}) -> {args.out}")
