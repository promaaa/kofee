# eraseTask Abstract

An erase task is one grid cell the eraser must clean. The camera, not the eraser, decides whether it worked: the
eraser only reports Done or Can't reach, and the next usable scan returns the verdict (success, retry, failed).

## Rules

- A board has at most one open task per cell and at most one active (dispatched or verifying) task, because there
  is one eraser. The oldest pending task is dispatched as soon as nothing is active.
- A verifying task is judged only by a scan the server received `EraseTask.settleMs` after Done, so the eraser has
  stepped out of the camera's view.
- Still dirty after the last of `maxAttempts` dispatches, Can't reach, or no Done within
  `EraseTask.dispatchTimeoutMs` all end the task as failed. Its cell is not tasked again for
  `EraseTask.retaskCooldownMs`, so a stain that will not come off does not loop forever.
- A pending task whose cell reads stably clean is canceled: someone else erased it.
- Tasks are created and moved only by the server; the generated create, update and remove endpoints are closed.

pending -> dispatched -> verifying -> succeeded | dispatched (retry) | failed; dispatched -> failed; pending -> canceled
