# boardRect Abstract

A rectangle on the whiteboard, embedded by erase tasks as their target and by scans as detected dirt.

## Rules

- Every value is a fraction of the board (0 to 1), never pixels or centimetres: x and w of the width, y and h of the
  height.
- The origin is the inner elbow of the top-left L mark, x grows right and y grows down, so the four L marks sit
  outside the 0–1 square and never read as dirt.
