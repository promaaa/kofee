# boardScan Abstract

The analysis of one camera frame: where the board is in the frame and which grid cells look dirty. It is a
response and pubsub payload only; scans are never stored.

## Rules

- A scan is usable only when all four L marks were found. An unusable scan (board blocked, moved, or the algorithm
  unreachable) creates, cancels and judges nothing.
- `capturedAt` is when the server received the frame, before analysis, so a slow algorithm cannot push a frame
  past an erase report it predates.
