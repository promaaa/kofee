# kofee

Embodiment-agnostic whiteboard cleaning with automatic visual verification.

A camera watches a whiteboard. Anything written in blue inside the black frame is "dirt".
The system turns what it sees into tasks ("erase cell C2") expressed only in board
coordinates, hands them to whichever embodiment is available, and checks the result
from the camera on its own. Every attempt becomes a labelled episode.

> Work in progress — full write-up coming.

## Quick start

```bash
uv sync
uv run kofee            # webcam 0; first run asks you to click the 4 frame corners
```

## Layout

| Module | Role |
| --- | --- |
| `kofee/camera.py` | Frame sources: webcam or video file |
| `kofee/board.py` | Calibration (4 corners), rectification, grid of cells, tick detection |
| `kofee/vision.py` | Ink detection, person/motion detection |
| `kofee/tasks.py` | The task interface, planner and embodiments |
| `kofee/episodes.py` | Episode log (the flywheel dataset) |
