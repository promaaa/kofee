# board Abstract
Board represents board records managed by the app.

## Rules
- Anyone may read a board; nobody creates, updates or removes one until the slice names a guard.
- Removal is soft: a removed board keeps its row with `removedAt` set.
