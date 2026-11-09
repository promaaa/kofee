# consumableLevels Abstract

How much of the marker and the eraser pad is left, summed from the erase log since each was last replaced; the
maintenance module computes it and publishes it after every usable scan and every replacement.

## Rules

- Marker use is one per erase task created (a cell of ink written); eraser use is the sum of `attempt` over tasks
  dispatched since the pad swap, so a retry wears the pad as much as a first pass.
- A percent is `100 - 100 * used / life`, rounded and floored at 0; a fresh consumable reads 100.
- Life is `markerLife = 30` cells and `eraserLife = 20` passes. At `requestAtPercent = 10` or below, maintenance opens
  a `usage` request for a human.
- The value is never stored; it is recomputed from the log, so it survives a server restart.
