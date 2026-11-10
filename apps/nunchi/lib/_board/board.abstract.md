# board Service Abstract

The board service owns the one watched whiteboard: it takes the monitor's camera frames, keeps each grid cell's
recent dirty/clean history, and hands every usable scan to erase tasks. The board's size and grid are fixed in
`common/boardGrid.ts`; nothing about the board is stored.

## Rules

- A cell counts as dirty or clean only after its usable scans have agreed for `BoardGrid.stableMs`, so a writing
  hand or the eraser's body passing in front of the camera does not create or cancel tasks. The debounce is time, not
  a scan count, because the monitor sends frames as fast as the camera and the pipeline allow.
- Cell streaks live in server memory. A restart forgets them, which only delays new tasks by `stableMs`.
- One frame is analysed at a time; a frame that arrives mid-analysis is dropped and answered with an unusable scan,
  so two frames can never create the same task twice.
- `resetBoard` forgets streaks and mock dirt and cancels every open task, for a clean start between demo takes.
- Anyone may watch the frames and scans; sending frames and resetting are open locally and need sign-in once
  deployed.
