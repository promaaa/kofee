# vision Service Abstract

Vision turns one camera frame into a board scan by calling the whiteboard algorithm: the external algorithm server
when `visionApiUrl` (or `VISION_API_URL`) is set, the in-process mock otherwise.

## Rules

- The algorithm returns dirt as board-fraction rectangles; vision rasterises them onto the board's grid, so the
  algorithm never needs to know the grid.
- A failed or slow algorithm call (3 s) yields an unusable scan, never an error, so the camera loop keeps running.
- The mock reads dirty and glare cells set through `setMockDirt` / `setMockGlare`. Its `eraseSuccessRate` is 0, so
  Done never cleans a cell by chance: a teammate marks it clean, and a verdict is never a dice roll.
- With a server configured, wtbd checks `GET /health` at boot (a warning, never a boot failure) and sends
  `X-Protocol-Version: 1` on every frame.

Algorithm server contract: `POST {visionApiUrl}/analyze?boardId=main&cols=&rows=` with an `image/jpeg` body answers
`{ corners: [[x, y] x4] | null, regions: [{ x, y, w, h, score }], unknown?: [{ x, y, w, h }] }` — corners as frame
fractions in TL, TR, BR, BL order (null when any L mark is missing), regions and unknown as board fractions after
straightening the board. Full contract: `protocol/algorithm-server.md`.
