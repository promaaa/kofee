"""A real 960 px monitor frame of the demo board: four L marks, black labels, blue and black writing."""

from pathlib import Path

import cv2

from kofee.analyze import Grid, analyze, cell_names, cells_covered

ROOT = Path(__file__).parent.parent


def test_real_frame():
    result = analyze(cv2.imread(str(ROOT / "tests/fixtures/board_960.jpg")), Grid.load(ROOT / "grid.json"))
    assert result.corners is not None
    assert {"C2", "D2", "E2", "F2"} <= set(cell_names(cells_covered(result.regions, 8, 4)))
