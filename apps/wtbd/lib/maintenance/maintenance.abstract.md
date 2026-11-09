# maintenance Abstract

A maintenance request is one consumable (the marker or the eraser pad) that a human must replace. AI watches, the
robot erases, and humans keep both supplied: this is the human's job list.

## Rules

- At most one open request per consumable; a human report while one is open returns that request.
- Each consumable has a level in percent (`ConsumableLevels`), summed from the erase log since its last replacement:
  marker use is erase tasks created (each one a cell someone wrote on), eraser use is the attempts of the tasks
  dispatched, so every retry wears the pad. A level at or below `ConsumableLevels.requestAtPercent` opens a `usage`
  request, which records the level it opened at.
- An erase task that fails still dirty after every attempt opens an eraser request at once: the camera saw the pad
  stop cleaning.
- Levels are checked and published (`consumableLevelsChanged`) after every usable scan; marking a request replaced
  puts that consumable back at 100% and publishes too. `consumableLevels` reads them on demand.

open -> done
