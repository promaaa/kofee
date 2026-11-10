"""protocol/algorithm-server.md, checked end to end on synthetic monitor frames."""

import math

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from nunchi.analyze import Grid
from nunchi.server import create_app

W, H = 960, 540
ELBOWS = {"tl": (150, 120), "tr": (810, 118), "br": (814, 420), "bl": (146, 424)}
SIGNS = {"tl": (1, 1), "tr": (-1, 1), "br": (-1, -1), "bl": (1, -1)}
URL = "/analyze?boardId=test&cols=8&rows=4"


def tape(img, role, arm=24, t=7):
    ex, ey = ELBOWS[role]
    sx, sy = SIGNS[role]
    ox, oy = ex - t * sx, ey - t * sy
    length = arm + t
    poly = [(ox, oy), (ox + length * sx, oy), (ox + length * sx, oy + t * sy), (ex, ey), (ox + t * sx, oy + length * sy), (ox, oy + length * sy)]
    cv2.fillPoly(img, [np.int32(poly)], (125, 128, 130))


def frame(dirty=("C2", "F3"), marks=("tl", "tr", "br", "bl"), person=False) -> bytes:
    img = np.full((H, W, 3), (150, 152, 155), np.uint8)
    for x in range(0, W, 70):
        cv2.line(img, (x, 0), (x, H), (40, 40, 40), 3)
    cv2.rectangle(img, (110, 60), (850, 539), (212, 214, 216), -1)
    for role in marks:
        tape(img, role)
    (x0, y0), (x1, y1) = ELBOWS["tl"], ELBOWS["br"]
    for cell in dirty:
        c, r = "ABCDEFGH".index(cell[0]), int(cell[1]) - 1
        u = lambda f: int(x0 + (x1 - x0) * (c + f) / 8)  # noqa: E731
        v = lambda f: int(y0 + (y1 - y0) * (r + f) / 4)  # noqa: E731
        pts = [(u(0.2 + 0.6 * k / 6), v(0.3 if k % 2 else 0.7)) for k in range(7)]
        cv2.polylines(img, [np.int32(pts)], False, (170, 90, 40), 2, cv2.LINE_AA)
    if person:
        cv2.ellipse(img, (480, 330), (110, 230), 0, 0, 360, (70, 45, 30), -1)
    return cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 70])[1].tobytes()


def cells(regions, cols=8, rows=4):
    """The app server's cellsCoveredBy (apps/nunchi/common/boardGrid.ts)."""
    out = set()
    for r in regions:
        if (r.get("score") or 1) < 0.5:
            continue
        left, right = max(0, math.floor(r["x"] * cols)), min(cols - 1, math.ceil((r["x"] + r["w"]) * cols) - 1)
        top, bottom = max(0, math.floor(r["y"] * rows)), min(rows - 1, math.ceil((r["y"] + r["h"]) * rows) - 1)
        out |= {"ABCDEFGH"[c] + str(row + 1) for c in range(left, right + 1) for row in range(top, bottom + 1)}
    return out


@pytest.fixture
def client():
    return TestClient(create_app())


def post(client, body: bytes, url: str = URL):
    return client.post(url, content=body, headers={"Content-Type": "image/jpeg"})


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_corners_and_dirty_cells(client):
    res = post(client, frame()).json()
    expected = [[x / W, y / H] for x, y in ELBOWS.values()]
    assert np.allclose(res["corners"], expected, atol=0.01)
    assert cells(res["regions"]) == {"C2", "F3"}
    assert res["frame"] == {"width": W, "height": H}


def test_clean_board_has_no_regions(client):
    res = post(client, frame(dirty=())).json()
    assert res["corners"] is not None and res["regions"] == []


def test_hidden_mark_or_person_makes_the_scan_unusable(client):
    assert post(client, frame(marks=("tl", "tr", "br"))).json() == {
        "corners": None, "regions": [], "version": 1, "frame": {"width": W, "height": H}, "reason": "no_board"}
    assert post(client, frame(person=True)).json()["reason"] == "occluded"


def test_grey_residue_counts_but_black_edge_labels_do_not(client):
    img = cv2.imdecode(np.frombuffer(frame(dirty=()), np.uint8), cv2.IMREAD_COLOR)
    cv2.line(img, (170, 250), (190, 250), (20, 20, 20), 3)
    cv2.putText(img, "2", (158, 262), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (20, 20, 20), 2)
    cv2.line(img, (420, 300), (445, 305), (150, 150, 150), 3)
    res = post(client, cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 70])[1].tobytes()).json()
    assert cells(res["regions"]) == {"D3"}


def test_grid_aligns_app_cells_with_the_ticks():
    shifted = Grid((0.0, 0.1, 0.225, 0.35, 0.475, 0.6, 0.725, 0.85, 1.0), (0.0, 0.25, 0.5, 0.75, 1.0))
    assert shifted.remap(0.225, 0.3, 0.35, 0.4)[0] == pytest.approx(0.25)
    res = post(TestClient(create_app(shifted)), frame(dirty=("C2",))).json()
    assert cells(res["regions"]) <= {"C2", "D2"}


def test_bad_requests(client):
    assert post(client, b"not a jpeg").status_code == 400
    assert post(client, frame(), "/analyze?cols=8&rows=4").status_code == 422
    assert post(client, frame(), "/analyze?boardId=x&cols=zero&rows=4").status_code == 422
