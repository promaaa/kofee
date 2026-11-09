"""The algorithm server of protocol/algorithm-server.md: POST /analyze and GET /health."""

from __future__ import annotations

import argparse
import itertools
import os
import socket
import time
from pathlib import Path
from typing import Annotated

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from . import __version__
from .analyze import Analysis, Grid, analyze, annotate, cell_names, cells_covered, side_by_side

MAX_BODY_BYTES = 5 * 1024 * 1024

Fraction = Annotated[float, Field(ge=0.0, le=1.0)]
Point = tuple[Fraction, Fraction]


class Region(BaseModel):
    x: Fraction
    y: Fraction
    w: Fraction
    h: Fraction
    score: Fraction | None = None


class FrameSize(BaseModel):
    width: int
    height: int


class AnalyzeResponse(BaseModel):
    corners: tuple[Point, Point, Point, Point] | None
    regions: list[Region] = Field(default_factory=list)
    version: int = 1
    frame: FrameSize | None = None
    reason: str | None = None  # proposed in section 12: no_board | occluded


def create_app(grid: Grid | None = None, debug_dir: Path | None = None, record_dir: Path | None = None) -> FastAPI:
    app = FastAPI(title="kofee algorithm server", version=__version__)
    latest: dict[str, bytes] = {}
    session = None
    if record_dir is not None:
        session = record_dir / time.strftime("%Y%m%d-%H%M%S")
        session.mkdir(parents=True, exist_ok=True)
    frame_numbers = itertools.count(1)

    def run(img: np.ndarray, board_id: str, cols: int, rows: int) -> dict:
        started = time.perf_counter()
        fits = grid is not None and len(grid.col_edges) == cols + 1 and len(grid.row_edges) == rows + 1
        result: Analysis = analyze(img, grid if fits else None)
        response = result.to_response((img.shape[1], img.shape[0]))
        AnalyzeResponse.model_validate(response)
        board = annotate(result, grid if fits else None, cols, rows)
        dirty_cells = cell_names(cells_covered(response["regions"], cols, rows))
        dirty = " ".join(dirty_cells)
        status = "ok" if response["corners"] else response.get("reason", "no_board")
        elapsed_ms = (time.perf_counter() - started) * 1000
        print(f"{time.strftime('%H:%M:%S')} {board_id} {img.shape[1]}x{img.shape[0]} {status:<9} dirty: {dirty or '-'}  {elapsed_ms:.0f} ms", flush=True)
        if board is not None:
            latest["board"] = cv2.imencode(".jpg", board)[1].tobytes()
        if debug_dir is not None:
            cv2.imwrite(str(debug_dir / f"{board_id}_frame.jpg"), img)
            if board is not None:
                cv2.imwrite(str(debug_dir / f"{board_id}_board.jpg"), board)
        if session is not None:
            n = next(frame_numbers)
            cv2.imwrite(str(session / f"frame_{n:06d}.jpg"), img)
            cv2.imwrite(str(session / f"view_{n:06d}.jpg"), side_by_side(img, result, board, dirty_cells))
            with (session / "frames.csv").open("a") as f:
                f.write(f"{n},{time.strftime('%H:%M:%S')},{board_id},{status},{dirty}\n")
        return response

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": __version__}

    @app.post("/analyze", responses={200: {"model": AnalyzeResponse}})
    async def analyze_frame(
        request: Request,
        board_id: Annotated[str, Query(alias="boardId", min_length=1)],
        cols: Annotated[int, Query(ge=1)] = 8,
        rows: Annotated[int, Query(ge=1)] = 4,
    ) -> dict:
        body = await request.body()
        if len(body) > MAX_BODY_BYTES:
            raise HTTPException(413, "frame larger than 5 MB")
        img = cv2.imdecode(np.frombuffer(body, np.uint8), cv2.IMREAD_COLOR) if body else None
        if img is None:
            raise HTTPException(400, "body is not a decodable JPEG")
        return await run_in_threadpool(run, img, board_id, cols, rows)

    @app.get("/debug/board.jpg", include_in_schema=False)
    def debug_board() -> Response:
        if "board" not in latest:
            raise HTTPException(404, "no board analysed yet")
        return Response(latest["board"], media_type="image/jpeg", headers={"Cache-Control": "no-store"})

    return app


def lan_address() -> str:
    """Best guess of this machine's address on the local network (no packet is sent)."""
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
        except OSError:
            return "127.0.0.1"


def main(argv: list[str] | None = None) -> None:
    import uvicorn

    ap = argparse.ArgumentParser(prog="kofee", description="Algorithm server for wtbd (protocol/algorithm-server.md).")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--grid", default="grid.json", help="tick positions from kofee-grid (ignored when the file is missing)")
    ap.add_argument("--debug-dir", default=os.environ.get("DEBUG_DIR"), help="write each frame and annotated board here")
    ap.add_argument("--record", default=None, help="keep every frame and annotated board in a new session folder here")
    args = ap.parse_args(argv)
    grid = Grid.load(args.grid) if Path(args.grid).exists() else None
    debug_dir = Path(args.debug_dir) if args.debug_dir else None
    if debug_dir is not None:
        debug_dir.mkdir(parents=True, exist_ok=True)
    grid_info = f"{len(grid.col_edges) - 1}x{len(grid.row_edges) - 1} from {args.grid}" if grid else "uniform"
    print(f"kofee algorithm server: VISION_API_URL=http://{lan_address()}:{args.port}  (grid {grid_info})", flush=True)
    record_dir = Path(args.record).resolve() if args.record else None
    uvicorn.run(create_app(grid, debug_dir, record_dir), host=args.host, port=args.port, log_level="warning")
