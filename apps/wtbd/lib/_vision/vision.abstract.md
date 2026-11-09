# vision Service Abstract

Vision turns one camera frame into a board scan by calling the whiteboard algorithm: the external algorithm server
when `visionApiUrl` (or `VISION_API_URL`) is set, the in-process mock otherwise.

## Rules

- The algorithm returns dirt as board-fraction rectangles; vision rasterises them onto the board's grid, so the
  algorithm never needs to know the grid.
- A failed or slow algorithm call (3 s) yields an unusable scan, never an error, so the camera loop keeps running.
- The mock reads dirty cells set through `setMockDirt` and cleans a cell with probability
  `MockVisionApi.eraseSuccessRate` when the eraser reports Done, so retries happen without a real camera.

Algorithm server contract: `POST {visionApiUrl}/analyze?boardId=&cols=&rows=` with an `image/jpeg` body answers
`{ corners: [[x, y] x4] | null, regions: [{ x, y, w, h, score }] }` — corners as frame fractions in TL, TR, BR,
BL order (null when any L mark is missing), regions as board fractions after straightening the board.
