"""End-to-end checks on synthetic camera frames: a board seen in perspective, blue writing,
an orange reflection, a person stepping in to erase, and the automatic verdicts."""

import cv2
import numpy as np
import pytest

from nunchi.standalone.app import App, State, build_parser
from nunchi.board import Board, find_ticks
from nunchi.vision import Params, cell_ratios, ink_mask

W, H = 1280, 720
CORNERS = np.float32([(240, 160), (1040, 170), (1060, 560), (220, 540)])  # TL, TR, BR, BL
BOARD_RGB = (205, 208, 210)
FPS = 30


def blank() -> np.ndarray:
    img = np.full((H, W, 3), 90, np.uint8)
    cv2.fillPoly(img, [np.int32([(170, 100), (1110, 110), (1130, 650), (150, 640)])], BOARD_RGB)
    return img


def make_board(cols=8, rows=4) -> Board:
    return Board(CORNERS, (1100.0, 500.0), [i / cols for i in range(cols + 1)], [i / rows for i in range(rows + 1)])


def scribble(img: np.ndarray, board: Board, cell_id: str, colour=(170, 90, 40), part=1.0) -> None:
    """Handwriting-like zigzag across `part` of a cell's width (BGR blue marker by default)."""
    u0, v0, u1, v1 = board.cell(cell_id).uv
    pts = [(u0 + (u1 - u0) * (0.15 + 0.7 * part * k / 7), v0 + (v1 - v0) * (0.3 if k % 2 else 0.7)) for k in range(8)]
    cv2.polylines(img, [np.int32(board.uv_to_image(pts))], False, colour, 3, cv2.LINE_AA)


def erase(img: np.ndarray, board: Board, cell_id: str, part: float = 1.0) -> None:
    """Wipe the left `part` of a cell back to clean board."""
    u0, v0, u1, v1 = board.cell(cell_id).uv
    u1 = u0 + (u1 - u0) * part
    quad = board.uv_to_image([(u0 - 0.01, v0 - 0.01), (u1, v0 - 0.01), (u1, v1 + 0.01), (u0 - 0.01, v1 + 0.01)])
    cv2.fillPoly(img, [np.int32(quad)], BOARD_RGB)


def person(img: np.ndarray, board: Board, cell_id: str) -> np.ndarray:
    out = img.copy()
    u0, v0, u1, v1 = board.cell(cell_id).uv
    cx, cy = board.uv_to_image([((u0 + u1) / 2, (v0 + v1) / 2)])[0]
    cv2.ellipse(out, (int(cx), int(cy) + 120), (110, 230), 0, 0, 360, (60, 40, 30), -1)
    return out


def test_ink_is_detected_but_reflections_are_not():
    board = make_board()
    img = blank()
    scribble(img, board, "C2")
    cv2.line(img, tuple(np.int32(board.uv_to_image([(0.6, 0.55)])[0])), tuple(np.int32(board.uv_to_image([(0.7, 0.95)])[0])), (170, 200, 255), 7)
    p = Params()
    ratios = cell_ratios(ink_mask(board.rectify(img), p), board, p)
    assert ratios["C2"] > 0.01
    dirty = {c for c, r in ratios.items() if r >= p.clean_ratio}
    assert dirty == {"C2"}


def test_ticks_define_the_columns():
    board = make_board()
    img = blank()
    edges = [0.11, 0.235, 0.36, 0.485, 0.61, 0.735, 0.86]
    for v_tick in (-0.03, 1.03):
        for u in edges:
            a, b = board.uv_to_image([(u, v_tick - 0.02), (u, v_tick + 0.02)])
            cv2.line(img, tuple(np.int32(a)), tuple(np.int32(b)), (20, 20, 20), 3)
    found = find_ticks(img, board, "u")
    assert found is not None and len(found) == 9
    assert np.allclose(found[1:-1], edges, atol=0.01)
    assert find_ticks(img, board, "v") is None


@pytest.fixture
def app(tmp_path):
    board = make_board()
    board.save(tmp_path / "board.json")
    args = build_parser().parse_args(
        ["--board", str(tmp_path / "board.json"), "--runs", str(tmp_path / "runs"), "--mute", "--agents", "Ada,Bo"]
    )
    return App(args)


class Clock:
    def __init__(self):
        self.t = 0.0

    def feed(self, app: App, frame: np.ndarray, seconds: float) -> None:
        for _ in range(int(seconds * FPS)):
            self.t += 1 / FPS
            app.process(frame, self.t)


def test_full_job_with_a_failed_attempt_reassigned_to_the_other_embodiment(app):
    board, clock = app.board, Clock()
    scene = blank()
    for cell in ("B2", "C2", "C3"):
        scribble(scene, board, cell)

    clock.feed(app, scene, 1.0)
    assert app.state is State.READY
    assert {c for c, r in app.ratios.items() if r >= app.p.clean_ratio} == {"B2", "C2", "C3"}

    app.start_job(clock.t)
    clock.feed(app, scene, 1.5)
    assert app.state is State.ASSIGNED and app.task.cell == "B2" and app.agent.name == "Ada"

    clock.feed(app, person(scene, board, "B2"), 0.5)
    assert app.state is State.WORKING
    erase(scene, board, "B2")
    clock.feed(app, scene, 1.5)
    assert app.state is State.RESULT and app.result is True

    clock.feed(app, scene, 3.0)
    assert app.state is State.ASSIGNED and app.task.cell == "C2" and app.agent.name == "Bo"
    clock.feed(app, person(scene, board, "C2"), 0.5)
    erase(scene, board, "C2", part=0.5)  # sloppy: half the cell is still dirty
    clock.feed(app, scene, 1.5)
    assert app.state is State.RESULT and app.result is False

    clock.feed(app, scene, 3.0)
    assert app.task.cell == "C2" and app.task.attempt == 2 and app.agent.name == "Ada"
    clock.feed(app, person(scene, board, "C2"), 0.5)
    erase(scene, board, "C2")
    clock.feed(app, scene, 1.5)
    assert app.result is True

    clock.feed(app, scene, 3.0)
    assert app.task.cell == "C3"
    clock.feed(app, person(scene, board, "C3"), 0.5)
    erase(scene, board, "C3")
    clock.feed(app, scene, 5.0)
    assert app.state is State.DONE

    records = app.log.records
    assert [(r["task"]["cell"], r["agent"]["name"], r["success"]) for r in records] == [
        ("B2", "Ada", True),
        ("C2", "Bo", False),
        ("C2", "Ada", True),
        ("C3", "Bo", True),
    ]
    assert app.log.path.read_text().count("\n") == 4
