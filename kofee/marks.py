"""Find the four L-shaped tape marks in a camera frame and return their inner elbows."""

from __future__ import annotations

from dataclasses import dataclass
from itertools import product

import cv2
import numpy as np

WORK_WIDTH = 960
ROLES = ("tl", "tr", "br", "bl")
ARM_TOLERANCE_DEG = 10.0
_EDGES_OF = {"tl": ((0, 1), (0, 3)), "tr": ((0, 1), (1, 2)), "br": ((1, 2), (3, 2)), "bl": ((0, 3), (3, 2))}
_KERNEL = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))


@dataclass(frozen=True)
class Mark:
    role: str  # tl | tr | br | bl
    elbow: tuple[float, float]  # concave corner of the L, in working pixels
    area: float
    angle: float  # direction of the arms, degrees modulo 90


def _orientation(contour: np.ndarray, x: int, y: int, bw: int, bh: int) -> str | None:
    """An L fills two adjacent sides of its bounding box: the top-left mark (┏) fills top and left."""
    blob = np.zeros((bh, bw), np.uint8)
    cv2.drawContours(blob, [contour - (x, y)], -1, 1, -1)
    sh, sw = max(1, bh // 3), max(1, bw // 3)
    top, bottom = blob[:sh].mean(), blob[-sh:].mean()
    left, right = blob[:, :sw].mean(), blob[:, -sw:].mean()
    if max(top, bottom) < 1.5 * min(top, bottom) or max(left, right) < 1.5 * min(left, right):
        return None
    return ("t" if top > bottom else "b") + ("l" if left > right else "r")


def find_marks(img: np.ndarray) -> list[Mark]:
    """Every L-shaped grey blob in a WORK_WIDTH-wide frame.

    Several contrast thresholds are tried: a glint can split a mark at one threshold, and at
    another a mark can touch the wall's black grid through the one-pixel board edge.
    """
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    value = hsv[..., 2]
    darkness = cv2.medianBlur(value, 49).astype(np.int16) - value
    grey = hsv[..., 1] < 90
    marks = []
    for threshold in (12, 20, 30):
        mask = ((darkness > threshold) & grey).astype(np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, _KERNEL)  # thin marker strokes vanish, tape arms stay
        marks += _l_shapes(mask)
    return marks


def _l_shapes(mask: np.ndarray) -> list[Mark]:
    h, w = mask.shape
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    marks = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if not 0.00008 * h * w <= area <= 0.006 * h * w:
            continue
        x, y, bw, bh = cv2.boundingRect(contour)
        if not 0.4 <= bw / bh <= 2.5:
            continue
        hull_area = cv2.contourArea(cv2.convexHull(contour))
        if hull_area == 0 or not 0.25 <= area / hull_area <= 0.8:
            continue
        defects = cv2.convexityDefects(contour, cv2.convexHull(contour, returnPoints=False))
        if defects is None:
            continue
        defects = defects.reshape(-1, 4)  # OpenCV 4 returns (n, 1, 4), OpenCV 5 returns (n, 4)
        deepest = defects[defects[:, 3].argmax()]
        if deepest[3] / 256 < 0.2 * max(bw, bh):
            continue
        role = _orientation(contour, x, y, bw, bh)
        if role is None:
            continue
        ex, ey = contour[deepest[2], 0]
        marks.append(Mark(role, (float(ex), float(ey)), area, cv2.minAreaRect(contour)[2] % 90))
    return marks


def _plausible(quad: np.ndarray, frame_area: float) -> bool:
    tl, tr, br, bl = quad
    if not (tl[0] < tr[0] and bl[0] < br[0] and tl[1] < bl[1] and tr[1] < br[1]):
        return False
    if not cv2.isContourConvex(quad.reshape(-1, 1, 2)) or cv2.contourArea(quad) < 0.03 * frame_area:
        return False
    top, bottom = np.linalg.norm(tr - tl), np.linalg.norm(br - bl)
    left, right = np.linalg.norm(bl - tl), np.linalg.norm(br - tr)
    return min(top, bottom) / max(top, bottom) >= 0.6 and min(left, right) / max(left, right) >= 0.6


def _angle_gap(a: float, b: float) -> float:
    return abs((a - b + 45) % 90 - 45)


def _arms_follow_edges(quad: np.ndarray, combo: tuple[Mark, ...]) -> bool:
    """Tape lies flat on the board, so each mark's arms run along the two frame edges it starts.

    A blob picked up in place of a hidden mark (a sleeve, a label) breaks this, even when the
    quadrilateral it makes still looks reasonable.
    """
    for mark in combo:
        for i, j in _EDGES_OF[mark.role]:
            dx, dy = quad[j] - quad[i]
            if _angle_gap(np.degrees(np.arctan2(dy, dx)) % 90, mark.angle) > ARM_TOLERANCE_DEG:
                return False
    return True


def find_corners(img: np.ndarray) -> np.ndarray | None:
    """Inner elbows of the four marks in frame pixels, ordered TL, TR, BR, BL; None unless all four are seen."""
    scale = min(1.0, WORK_WIDTH / img.shape[1])
    small = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA) if scale < 1 else img
    marks = find_marks(small)
    by_role = {r: sorted((m for m in marks if m.role == r), key=lambda m: -m.area)[:6] for r in ROLES}
    frame_area = small.shape[0] * small.shape[1]
    best, best_score = None, 0.0
    for combo in product(*(by_role[r] for r in ROLES)):
        quad = np.float32([m.elbow for m in combo])
        areas = [m.area for m in combo]
        if min(areas) < 0.3 * max(areas) or not _plausible(quad, frame_area) or not _arms_follow_edges(quad, combo):
            continue
        score = cv2.contourArea(quad) * min(areas) / max(areas)  # the four tape marks have similar sizes
        if score > best_score:
            best, best_score = quad, score
    return None if best is None else best / scale
