# board Abstract

A board is one watched whiteboard: its physical size, the grid erase tasks are cut into, and each grid cell's
recent dirty/clean history from the monitor camera.

## Rules

- A cell is `row * cols + col`. Coordinates are board fractions
  measured from the inner elbows of the L marks (see `boardRect`).
- A cell counts as dirty or clean only after `Board.stableScans` usable scans in a row agree, so a writing hand or
  the eraser's body passing in front of the camera does not create or cancel tasks.
- Only usable scans (all four L marks found) move the streaks.
- One frame per board is analysed at a time; a frame that arrives mid-analysis is dropped and answered with an
  unusable scan, so two frames can never create the same task twice.
- Anyone may read a board and watch its frames; creating and changing one is open locally and needs sign-in once
  deployed. Removal is soft.
