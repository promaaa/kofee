# eraseTask Abstract
EraseTask represents erase task records managed by the app.

## Rules
- Anyone may read a erase task; nobody creates, updates or removes one until the slice names a guard.
- Removal is soft: a removed erase task keeps its row with `removedAt` set.
