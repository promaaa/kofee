# Algorithm server protocol (v1)

The app server (TypeScript, [`apps/nunchi/`](../apps/nunchi/)) sends each camera frame to the algorithm server
(Python, [`nunchi/server.py`](../nunchi/server.py)). The algorithm server answers with where the board is in the
frame and where the ink is on the board. This page describes that HTTP contract.

| Component | Role |
|---|---|
| Monitor | Browser page with a camera aimed at the board. Uploads one JPEG at a time to the app server. |
| App server | Maps ink to grid cells, creates erase tasks and judges attempts. Calls the algorithm server. |
| Eraser | Phone page that tells a person which cell to erase. |
| Algorithm server | Stateless Python service with one endpoint. Only the app server calls it. |

## `POST /analyze`

```
POST {VISION_API_URL}/analyze?boardId=main&cols=8&rows=4
Content-Type: image/jpeg
X-Protocol-Version: 1

<raw JPEG bytes>
```

The body is the JPEG exactly as the Monitor captured it, about 960 px wide. `boardId` is always `main` and is only
used in logs. `cols` and `rows` are hints: the app server maps boxes to cells itself.

The response is always `200` with JSON when the image could be decoded:

```json
{
  "corners": [[0.060, 0.100], [0.940, 0.091], [0.950, 0.900], [0.050, 0.909]],
  "regions": [{ "x": 0.27, "y": 0.30, "w": 0.08, "h": 0.15, "score": 0.91 }],
  "unknown": [{ "x": 0.12, "y": 0.00, "w": 0.15, "h": 0.20 }]
}
```

When the board cannot be seen (a person in front of it, a mark hidden, the camera moved), the answer is still `200`:

```json
{ "corners": null, "regions": [] }
```

| Field | Type | Meaning |
|---|---|---|
| `corners` | 4 × `[x, y]` or `null` | Inner corners of the four L marks in **frame space**, ordered TL, TR, BR, BL. `null` makes the scan unusable. |
| `regions` | array of `{x, y, w, h, score?}` | Ink boxes in **board space**. Boxes with `score < 0.5` are ignored. A missing score counts as 1. |
| `unknown` | array of `{x, y, w, h}`, optional | Areas that cannot be read, such as glare, in board space. Cells they touch are neither dirty nor clean in this scan. |

This server also sends `version`, `frame` (`{width, height}`) and `reason` (`no_board` or `occluded` when
`corners` is `null`). The app server ignores unknown keys. The response model is `AnalyzeResponse` in [`nunchi/server.py`](../nunchi/server.py).

## `GET /health`

```
GET /health  ->  200 {"status": "ok", "version": "0.1.0"}
```

The app server calls it once at startup and logs a warning if it fails. It never blocks startup.

## Coordinates

No coordinate is in pixels.

- **Frame space** (`corners`): `x = px / width`, `y = py / height` of the received JPEG, origin top-left, y down.
- **Board space** (`regions`, `unknown`): the board after perspective correction, scaled to 0–1 on both axes. The
  origin is the inner corner of the top-left mark. The tape lies outside the 0–1 square, so it is never read as ink.

The app server lays an 8 × 4 grid over board space. Columns are lettered A–H and rows numbered 1–4:

```
 x=0                                                          x=1
   +------+------+------+------+------+------+------+------+     y=0
   |  A1  |  B1  |  C1  |  D1  |  E1  |  F1  |  G1  |  H1  |
   +------+------+------+------+------+------+------+------+     y=0.25
   |  A2  |  B2  |  C2  |  D2  |  E2  |  F2  |  G2  |  H2  |
   +------+------+------+------+------+------+------+------+     y=0.5
   |  A3  |  B3  |  C3  |  D3  |  E3  |  F3  |  G3  |  H3  |
   +------+------+------+------+------+------+------+------+     y=0.75
   |  A4  |  B4  |  C4  |  D4  |  E4  |  F4  |  G4  |  H4  |
   +------+------+------+------+------+------+------+------+     y=1
```

A box marks every cell it overlaps (`cellsCoveredBy` in
[`apps/nunchi/common/boardGrid.ts`](../apps/nunchi/common/boardGrid.ts)). For `x 0.27, y 0.30, w 0.08, h 0.15`:

```
columns  floor(0.27 × 8) = 2  to  ceil(0.35 × 8) − 1 = 2   ->  C
rows     floor(0.30 × 4) = 1  to  ceil(0.45 × 4) − 1 = 1   ->  2
cell     C2
```

| Box (`x, y, w, h`) | Cells | Reason |
|---|---|---|
| `0.37, 0.30, 0.01, 0.10` | C2, D2 | Any overlap counts |
| `0.25, 0.25, 0.125, 0.25` | C2 | An edge exactly on a grid line does not spill over |
| `-0.02, 0.30, 0.06, 0.10` | A2 | Partly outside the board: clamped |
| `1.05, 0.30, 0.05, 0.10` | none | Entirely outside the board: ignored |
| `0.10, 0.30, 0.80, 0.10` | A2 … H2 | One box over two words marks the whole row |

The algorithm server should therefore return one tight box per blob, without padding.

## How the app server uses the answer

- A cell becomes a task after it reads dirty for `BoardGrid.stableMs` (1 s) of usable scans. A task is cancelled
  the same way when the cell reads clean.
- After the person taps Done, the first usable scan received at least 1.5 s later decides the attempt. Dirty means
  a retry, up to 3 attempts. Clean means success.
- Frames are time-stamped when they arrive, so a slow answer never moves a frame to the wrong side of Done.

## Errors and timing

Every failure makes that one frame unusable. The app server does not retry frames.

| Situation | Algorithm server answers |
|---|---|
| Board found | `200` with corners and regions |
| Board not visible | `200` with `{"corners": null, "regions": []}` |
| Body is not a decodable JPEG | `400` |
| Invalid query parameters | `422` |
| Body larger than 5 MB | `413` |

The app server aborts a request after **3 s**. The current server answers in about 16 ms for a 960 × 540 frame.
The Monitor sends the next frame only after the previous answer, so latency sets the scan rate.

The server must be **stateless**: each answer depends only on its frame. In particular, it must never reuse earlier
corners when a mark is hidden, because `corners: null` is how the app server skips frames with someone in front of
the board.

## Configuration

```bash
nunchi --port 8000                                   # algorithm server, prints its LAN URL
VISION_API_URL=http://192.168.0.42:8000 bun run dev  # app server
```

Give the base URL only, with no trailing slash. When `VISION_API_URL` is unset, the app server uses a built-in mock.
There is no authentication and no TLS, so keep both servers on a local network.

Quick check from the app server machine:

```bash
curl -s http://192.168.0.42:8000/health
curl -s -X POST 'http://192.168.0.42:8000/analyze?boardId=main&cols=8&rows=4' \
  -H 'Content-Type: image/jpeg' --data-binary @tests/fixtures/board_960.jpg
```

## Versioning

The app server sends `X-Protocol-Version: 1`. New optional fields and query parameters stay in v1. A change to
coordinate meaning, corner order, required fields or status codes needs v2.
