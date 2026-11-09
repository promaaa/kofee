# kofee API

The Python loop (camera, perception, planner, verifier) runs on the laptop that holds the camera and serves
everything a front-end needs. Base URL: `http://<laptop-ip>:8001`, printed at startup. CORS is open to any
origin, and the interactive schema lives at `/docs`. A bare fallback UI is served at `/`.

## Endpoints

| Method | Path | What you get |
| --- | --- | --- |
| `GET` | `/api/state` | The current state (schema below) |
| `GET` | `/api/events` | Server-Sent Events: the same JSON, pushed about 10 times per second |
| `GET` | `/api/episodes` | Every episode of the current job, with `image_urls` for its before/after crops |
| `POST` | `/api/command` | `{"action": "start" \| "done" \| "reset" \| "calibrate", "corners"?: [[x, y] x 4]}` |
| `GET` | `/frame/{name}.jpg` | Latest image: `board` (top-down, rectified), `camera` (960x540), `dashboard` (1280x720) |
| `GET` | `/stream/{name}.mjpg` | The same images as an MJPEG stream, usable directly as `<img src>` |
| `GET` | `/runs/{job}/{file}` | Episode images |

### Commands

| Action | Effect |
| --- | --- |
| `start` | Starts a job (from `ready` or `done`) |
| `done` | The agent says it has finished: verify now instead of waiting for the board to be clear for 1.2 s |
| `reset` | Back to `ready` |
| `calibrate` | With `corners` (4 points, normalised 0..1 to the camera image, any order): recalibrate. Without: click mode in the OpenCV window |

## State

```jsonc
{
  "t": 1234.56,                         // seconds, monotonic clock of the laptop
  "state": "assigned",                  // calibrate | ready | scan | assigned | working | result | done
  "status": { "text": "Go to the board", "tone": "wait" },   // tone: info | wait | ok | bad
  "agents": [{ "name": "Marc", "kind": "human", "tool": "eraser" }],
  "task": {                             // null when there is no current task
    "id": "T003", "cell": "C2", "attempt": 1, "action": "erase",
    "region_uv": [0.232, 0.25, 0.355, 0.5],      // u0, v0, u1, v1 (see Coordinates)
    "region_mm": [255, 125, 390, 250],           // same region in millimetres on the board
    "success": "ink_ratio < 0.25%"
  },
  "agent": { "name": "Marc", "kind": "human", "tool": "eraser" },   // who the task is assigned to
  "renderings": {                       // the same task, rendered for each embodiment
    "human": "Marc, erase cell C2.",
    "robot": "arm.wipe(x=255..390mm, y=125..250mm, passes=3)"
  },
  "result": null,                       // true / false while state == "result"
  "clean_ratio": 0.0025,
  "board": {
    "size_mm": [1100, 500], "image_size": [1000, 455],
    "col_edges": [0, 0.108, 0.2315, ...], "row_edges": [0, 0.25, 0.5, 0.75, 1],
    "cells": [{ "id": "A1", "uv": [0, 0, 0.108, 0.25] }],
    "fine_col_edges": [...], "fine_row_edges": [...]
  },
  "cells": { "A1": 0.0, "B2": 0.0067 },  // ink ratio of every cell at the last measurement
  "dirty": ["B2", "C2"],
  "heatmap": { "rows": 16, "cols": 32, "values": [0.0, 0.013, null] },  // row-major; null = hidden by someone
  "scene": { "occupied": false, "person": 0.0, "motion": 0.0, "settle": 1.0 },  // 1.0 = threshold / ready
  "flywheel": {
    "episodes": 4,
    "by_agent": { "Marc": { "attempts": 2, "successes": 2, "seconds": 18.4 } },
    "last": { "episode": 4, "success": true },
    "log_dir": "/runs/20261109-121500"
  }
}
```

State machine:

```
calibrate -> ready --start--> scan -> assigned --someone at the board--> working
          --board clear for 1.2 s, or "done"--> result (2.5 s) -> scan -> ... -> done
```

A failed verification leaves the cell dirty, so the next scan assigns it again, to the next embodiment.

## Coordinates

- `(u, v)` in `[0, 1]^2` spans the black frame (inner corners of the four L marks): `u` left to right,
  `v` top to bottom. `/frame/board.jpg` covers exactly that rectangle, so a region overlays it with CSS
  percentages: `left: u0*100%`, `top: v0*100%`, `width: (u1-u0)*100%`, `height: (v1-v0)*100%`.
- Cell ids: column letter (`A`, `B`, ... left to right) then row number (`1`, `2`, ... top to bottom).
  Column boundaries come from the graduation ticks drawn on the board.
- The heatmap splits every cell into 4 x 4 sub-cells (`fine_col_edges`, `fine_row_edges`).

## Minimal client

```js
const api = "http://192.168.0.12:8001";

new EventSource(`${api}/api/events`).onmessage = (e) => render(JSON.parse(e.data));
document.querySelector("img").src = `${api}/stream/board.mjpg`;

const send = (action) =>
  fetch(`${api}/api/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
```

## Episode records

`runs/<job>/episodes.jsonl`, one JSON object per attempt:

```json
{"episode": 2, "task": {"id": "T002", "cell": "C2", "...": "..."},
 "agent": {"name": "Kangmin", "kind": "human", "tool": "eraser"},
 "duration_s": 9.8, "work_s": 6.1, "ink_before": 0.0621, "ink_after": 0.0007, "success": true,
 "side_effects": {"also_cleaned": [], "newly_dirty": []},
 "images": {"before": "ep002_C2_before.jpg", "after": "ep002_C2_after.jpg"},
 "timestamp": "2026-11-09T12:15:03"}
```
