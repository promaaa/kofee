# wtbd: 30-second demo video plan (v1)

- **Event:** c0mpiled seoul, 5-hour team prototype. Shot on the real whiteboard near the end.
- **Deliverable:** 30.0 s, 16:9, 1920×1080, 30 fps, captions burned in, works with the sound off.
- **Frame:** our answer to YC RFS "New Operating Systems for the Physical World".
- **Hard rule:** every product shot is a real capture. A generated shot appears once, carries a label and reads as the future.

Facts this plan relies on (from the module notes and constants): the board is 120 × 60 cm, cut into an 8 × 4 grid of 15 cm
cells (columns A–H, rows 1–4). A cell turns dirty after 3 usable scans in a row. A verdict waits for a scan at least 1.5 s
after Done. There are at most 3 attempts, and a job can fail as still dirty, can't reach or timeout.

**Hero cell: C2** (label `C2 · 38 cm, 23 cm`). In the reference photo, C2 sits clear of both the ceiling hotspots (around
B1, D1, H1) and the bottom streaks (around D3–F4). Every take follows C2.

---

## 1. Hook (0–3 s)

| # | Visual | On-screen text (frame 1) | First VO line | Strength | Weakness |
|---|---|---|---|---|---|
| H1 "Rejected" | Over-the-shoulder close-up of the eraser phone in a hand, with the smudged board soft behind it. The screen slams to full amber: `RETRY · Still dirty · Attempt 2/3`. | **Our OS just rejected a human's work.** | "Our OS just rejected a human's work." | Most saturated, highest-contrast frame we own. It raises a question (who rejected it, and why?) and shows our differentiator, camera verification. 100% real. | Starts in the middle of the story, so it needs a 0.4 s rewind to restart the loop. |
| H2 "Nobody erases" | Three jump cuts of a hand filling the board with ink. Then the monitor grid snaps on with red cells. | **Nobody here erases. The board still gets clean.** | "Nobody here erases." | Clear premise in one line. | Writing on a whiteboard is a mundane first frame, and the payoff comes late. |
| H3 "This robot is a person" | Wide shot: a teammate wearing a paper badge `ROBOT v0 (human)` marches to the board, phone pulsing. | **Our robot is a human. The OS can't tell.** | "Our robot is a human." | Funny, and honest up front. States the thesis in a second. | Reads as a joke, so a judge may file it under "no robot". |

**Pick: H1.** The full-screen amber flash stops a muted scroll on frame 1. The caption carries the whole idea without
sound, and the next 15 s answer the question it raises. It is also our real product doing the thing incumbents don't do,
which is judging physical work from evidence. H3's badge stays as a prop in the wide shots, so the honesty still comes
through without spending the hook on it.

Cut in on the first amber frame, with the caption already there: no fade, no logo.

## 2. Pitch and RFS mapping

**One-line pitch:** *A camera-run OS for physical work. It turns mess into jobs, hands each job to any worker (a person
today, a robot tomorrow) and checks every result itself.*

**Angle:** the RFS asks how to route a job between an agent, a robot and a person. Our OS doesn't care who erases. The job,
the verdict and the record stay the same whoever does the work, so today a person plays the robot on camera, deliberately.

| RFS asks | What the video shows | Keep it honest |
|---|---|---|
| Three kinds of workers | AI (vision finds the dirt, cuts it into eraser-sized jobs, judges the result) · robot (the eraser slot) · human (the writer, with no software) | Our "agent" scopes and verifies work. It does not quote prices. |
| Route a job between them | A job is a cell plus a verifiable outcome, independent of the worker. "Can't reach" ends a job, which is where a job would hand off to a different worker. | Today: one eraser, oldest job first. Routing across several workers is the next step, so say "tomorrow". |
| Safety side by side | A cell needs 3 steady frames, so a passing hand creates no job. The verdict waits until the eraser has stepped out. | Show the hand-passing evidence only in real-vision mode (see 8.3). |
| Reliability | Camera verdicts, at most 3 attempts, success rate / average attempts / ink-to-clean tiles | Real numbers from the session, shown as raw counts (`7/9`), never typed in by hand. |
| Recorded data | Every job's lifecycle on a live timeline | "As it actually happens" means we show the real timeline, not a mockup. |

## 3. Shot list (0–30 s)

Layouts: **A** = real footage on the left 2/3 with the phone screen recording on the right 1/3 in a phone frame. **B** =
monitor screen recording full frame, with the real wide shot as a picture-in-picture top right (25%). **C** = dashboard full
frame with keyframed zooms.

| Time | On screen | Caption | Voice-over | Audio | Source |
|---|---|---|---|---|---|
| 0.0–3.0 | **Hook H1.** Close-up over the actor's shoulder: phone flashes full amber `RETRY · Still dirty · Attempt 2/3`, with the C2 smudge behind it. (Fall back to layout A if the filmed screen is unreadable.) | Our OS just rejected a human's work. | (0.3) "Our OS just rejected a human's work." | 0.0 app buzz plus spoken cue "Retry", no music for 0.5 s, then the beat drops | Real: filming camera + eraser screen recording |
| 3.0–3.4 | Reverse-scrub rewind to the clean board | (none) | (none) | Rewind whoosh | Edit effect on real footage |
| 3.4–6.0 | Wide shot, 35–45° off axis. The writer sketches in bold black across C2 and its neighbours. The actor, wearing the `ROBOT v0 (human)` badge, waits at the side. All four L marks visible. | Humans write. Nobody erases. | "Here, people write. Nobody erases." | Music bed | Real: filming camera |
| 6.0–9.5 | **Layout B.** Monitor overlay: green board outline locked on the 4 L marks, 8×4 grid. The writer's arm sweeps across clean E2–G2: those cells flash amber `1/3` and drop back with no job. C2 ticks `1/3 → 2/3 → 3/3` and turns red. | Dirty = 3 steady frames. Passing hands ignored. | "A camera watches. Passing hands don't count." | Soft tick per scan | Monitor screen recording + real PiP |
| 9.5–13.0 | **Layout A.** The actor walks to the board. Phone: board map with C2 pulsing, `C2 · 38 cm, 23 cm`, `Attempt 1/3`, a huge **Done** button. | Dirty cell → job. Today's robot: a person. | "Dirty cells become jobs. Today, a person plays the robot." | App dispatch chime | Real + eraser screen recording |
| 13.0–18.0 | **Layout A, 2× speed ramp.** One light swipe, step out to the floor mark, Done → `Checking…` → amber RETRY (0.6 s, recognised from the hook) → proper wipe, step out, Done → full green `CLEAN`. | Camera judges: **SUCCESS** / **RETRY** / **FAILED** (in the app's green, amber and red) | "The camera, not the worker, decides." | App cues "Retry", then "Clean", music lifts | Real + eraser screen recording |
| 18.0–21.5 | **Layout C.** Dashboard: live frame, cell map with C2 going clean, timeline row `C2 · dispatched → retry → succeeded · 2 attempts · 41 s`, one failed row (`can't reach`), stat tiles. Zoom from the row to the tiles. | Every job recorded, as it happens. | "Every job is recorded, as it actually happens." | Music build | Dashboard screen recording |
| 21.5–26.0 | **Split.** Left: a robot arm wiping a whiteboard square, tagged `Concept · AI-generated` in the corner, cooler grade. Right: the same real phone screen recording of job C2. (Fallback with no generation: a motion card where the worker icon flips person → robot → agent beside a fixed C2 job card.) | Swap the worker. Same job, verdict, record. | "Tomorrow, swap in a robot. Same job, same verdict, same record." | Music peak | Generated (labelled) + real screen recording |
| 26.0–30.0 | **End card.** `wtbd` · *One OS for agents, robots and people.* · Built in 5 hours at **c0mpiled seoul** · For YC RFS: New Operating Systems for the Physical World · team names / repo QR | (the card) | (26.2) "wtbd. One OS for every kind of worker." | Music button ending at 29.6 | Title card (CapCut) |

**Product name** (`wtbd` is a placeholder). Suggestions only, the team decides:
1. *Witness*: the camera witnesses and judges every job.
2. *Handoff*: a job moves between agent, robot and person.
3. *Tabula*: a clean slate.

## 4. Voice-over script (63 words, English)

| Time | Line | Words |
|---|---|---|
| 0.3 | Our OS just rejected a human's work. | 7 |
| 3.4 | Here, people write. Nobody erases. | 5 |
| 6.0 | A camera watches. Passing hands don't count. | 7 |
| 9.5 | Dirty cells become jobs. Today, a person plays the robot. | 10 |
| 13.0 | The camera, not the worker, decides. | 7 |
| 18.0 | Every job is recorded, as it actually happens. | 8 |
| 21.5 | Tomorrow, swap in a robot. Same job, same verdict, same record. | 11 |
| 26.2 | wtbd. One OS for every kind of worker. | 8 |

- Leave 13–18 s mostly to the app's own spoken cues ("Retry", "Clean"). They prove the loop is live.
- **Captions carry the meaning when muted.** Each one stays at most 7 words and holds at least 1.5 s. These lines exist only
  as captions: "3 steady frames", "SUCCESS / RETRY / FAILED", "Swap the worker", plus every end-card line.
- Record in a quiet room or car: phone voice memo, 15–20 cm from the mouth, three reads. CapCut text-to-speech is the last
  resort.

## 5. Must-have UI states (build in this order)

Legibility bar: the phone fills about a third of a 1080p frame, so the big labels must take up at least 15% of the screen
height. Colours come from the semantic tokens (success, warning, destructive).

| P | Screen | State | Must show | Shot |
|---|---|---|---|---|
| P0-1 | `/board/:id/eraser` | **RETRY flash** | Full-screen amber, `RETRY` huge, `Still dirty · Attempt 2/3`, spoken "Retry", vibration (Android). Held ≥ 1.2 s. | 0–3, 13–18 |
| P0-2 | eraser | **Dispatched** | 8×4 board map with the target cell pulsing, `C2 · 38 cm, 23 cm`, `Attempt 1/3`, huge **Done**, small **Can't reach** | 9.5–18, 21.5–26 |
| P0-3 | eraser | **SUCCESS flash** | Full-screen green, `CLEAN`, spoken "Clean" | 13–18 |
| P0-4 | `/board/:id/monitor` | **Overlay** | Camera preview, board outline on the 4 L marks, 8×4 grid, dirty cells filled red | 6–9.5 |
| P0-5 | `/board/:id` | **Job timeline** | Newest first: cell, status chips (pending → dispatched → verifying → retry → succeeded / failed), attempts, ink-to-clean seconds, fail reason (still dirty / can't reach / timeout) | 18–21.5 |
| P0-6 | dashboard | **Stat tiles** | Success `7/9 · 78%`, average attempts, mean ink-to-clean (s). Computed from recorded jobs. | 18–21.5 |
| P1-7 | monitor | **Streak pips** | Candidate cells outlined amber with `1/3`, `2/3`, red at `3/3`. A passing arm visibly resets them. | 6–9.5 (real mode only) |
| P1-8 | eraser | **Verifying** | `Step out of view · checking` with a 1.5 s progress ring | 13–18 |
| P1-9 | eraser | **Start / idle** | `Tap to start shift` (unlocks audio and the screen wake lock), then `No jobs · board clean` | setup, 3.4–6 |
| P1-10 | dashboard | **Live frame + cell map** | The latest frame with the dirty-cell map (reuse the monitor overlay) | 18–21.5 |
| P1-11 | monitor + dashboard | **Mock mode** | Persistent badge `VISION: TEAMMATE (MOCK)`, plus a dashboard panel where a tap toggles a cell between dirty and clean | fallback only |
| P2-12 | eraser | **FAILED flash** | Full-screen red, `FAILED · can't reach` / `gave up after 3`, spoken "Failed" | timeline row only |
| P2-13 | monitor | **Board not found** | Red banner when an L mark is hidden | setup aid |
| P2-14 | all three | **Dev clock** | Server time to 0.1 s behind `?clock=1`, cropped out in the edit | sync aid |
| P2-15 | eraser | **Worker label** | Header `Robot slot · worker: human` | narrative nicety |

## 6. Filming setup on the real whiteboard

### 6.1 Devices and positions

| Device | Role | Position | Settings | Records |
|---|---|---|---|---|
| **M**: monitor phone | Runs `/board/:id/monitor` (rear camera), sends about 1 JPEG/s | On a tripod or stacked boxes 2–2.5 m back, lens 20–30 cm above the board's top edge, tilted down. All 4 L marks in frame with about 10% margin. **Never moves**, and its spot is marked with tape on the floor. | Exposure/focus locked on the board, brightness max, on power, Focus/DND on | Built-in screen recording (iOS Control Center / Android quick tile) |
| **F**: filming camera | The team's best phone camera | Tripod at chest height, 35–45° to one side, 2.5–3 m back. Frames writer, actor and board, and stays out of M's view. Handheld close-ups for the hook. | 1080p30 (or 4K30 for crop-zooms), exposure/focus locked, about −0.7 EV. With a manual app, shutter 1/60 or 1/120 (Korea runs 60 Hz mains, so other speeds risk LED flicker). | Video + room audio |
| **E**: eraser phone | `/board/:id/eraser` in the actor's hand | Moves with the actor | Auto-Lock off, DND, brightness and volume max | Built-in screen recording **with mic on** (for sync) and device audio |
| **D**: dashboard laptop | `/board/:id`, optionally mirrored to a TV beside the board (angled away from the glass) | Out of M's view | 1920×1080 | macOS Cmd+Shift+5 or OBS |

### 6.2 Glare and reflections (from the reference photo)

The photo shows three ceiling-light hotspots across the top third (around B1, D1, H1) and vertical light streaks rising from
the bottom centre (around D3–F4). The bottom-left L mark sits right at the edge where the reflections start. Hotspots wash
out ink, so dirt gets missed. Streaks can break L-mark detection, and on film the whole thing looks like an unlit garage.

Fixes, in order:
1. **Raise M above the board's top edge and angle it down.** A glossy vertical board mirrors whatever is behind the camera.
   With the lens higher than the board, every reflected ray heads toward the floor, so the ceiling lights drop out. The
   L-mark straightening removes the keystone this adds.
2. **Switch off the ceiling fixtures you can see mirrored**, usually the row directly in front of the board (ask the venue).
3. **Find the source of the bottom streaks:** put your eye where M's lens is and look into the board. Whatever bright thing is
   mirrored (a lamp, a window, a monitor, a lit corridor) gets switched off or moved, or blocked by a dark jacket or black
   cloth hung behind and below the camera.
4. **Light from the side, not the top:** one soft source at 45° (a desk lamp bounced off white foam board), so its
   reflection falls outside both cameras' views.
5. **Check F separately.** Being off axis, it sees different reflections. Recheck on its own preview.
6. If the board is movable, tilt its top a few degrees toward the room.

Before shooting: wipe the whole board with cleaner (ghost stains create stray jobs). Use only black chisel-tip markers. Leave
the L marks uncovered. Run the overlay for 30 s with a person at the board and confirm all four marks hold.

### 6.3 Choreography (one loop, about 90 s real time)

1. Board clean. E shows `No jobs`. All four devices recording. Slate.
2. The writer sketches across C2, then reaches across clean E2–G2 to point. This gives the "hands ignored" evidence.
3. The writer steps out left to a floor mark outside M's view.
4. E pulses C2. The actor enters from the right and does **one deliberately light swipe**, steps out to the right floor mark,
   and taps Done. The sloppiness is staged, but the verdict is the system's real judgment of the board. If no retry fires,
   **retake**. Never splice in a flash from another job.
5. RETRY. The actor erases properly, steps out, taps Done, and gets CLEAN.
6. After the hero loop, let 6–8 more jobs run and tap **Can't reach** once, so the timeline and tiles show real counts.

### 6.4 Layout and captions

16:9 throughout, using layouts A/B/C from section 3. Captions are bottom centre inside 90% title-safe: white bold on a black
box at 60–70% opacity, at least 64 px, at most 7 words. SUCCESS/RETRY/FAILED are coloured to match the app.

### 6.5 Syncing the takes

- Record each loop as **one continuous master take on all four devices** and cut every shot out of it. Start order:
  D → M → E → F.
- **Slate:** the actor holds E toward F while the writer claps once in front of the board. F audio, the E screen
  recording's mic and the laptop mic all catch it.
- In CapCut: line up the clap spikes, then fine-tune on the **first verdict flash**, which appears in F's shot of the phone
  and as the first coloured frame of E's recording. The dashboard row changes on the same server event, so align it there.
- Backup: the P2 dev clock in a corner of every screen.

## 7. Generated media (optional)

Rules: monitor, eraser, dashboard, the board and the loop are **never** generated or "enhanced". A generated shot shows
`Concept · AI-generated` for its whole duration and gets a cooler, desaturated grade. Do not feed our real board photo into
image-to-video, because the result would pass for footage of our setup. All text is added in CapCut (models misspell).

| Shot | Tool | Worth it in 5 h? | Why |
|---|---|---|---|
| 21.5–26 "Tomorrow" robot B-roll | Seedance 2.5, text-to-video | **Yes**, the only one | We can't film a robot, and this shot pays off the thesis. Queue it at T+1:30. 3–4 tries take about 30 min. |
| Same shot as a still | Seedream + CapCut slow zoom | **Yes, as a backup** | Use it if the video warps the arm or the eraser |
| End-card background | Seedream | Optional (10 min) | A text-only card works |
| Hook / any product shot | (none) | **Never** | This footage is the proof |
| "80% of workers" stock montage | (none) | No | Off-message, and it costs seconds the product needs |

**Seedance 2.5 (robot B-roll):**
> Realistic medium shot of a white office whiteboard with black marker sketches. A compact robot arm mounted on the board's
> top frame lowers a felt eraser and wipes one square section clean in two smooth passes, then retracts. Small dark
> L-shaped tape marks at the four corners. Soft even daylight, matte grey wall, no people, no glare. Locked tripod, slow
> push-in, shallow depth of field. 5 seconds, 16:9.
> Avoid: text, logos, readable writing, human hands, neon or sci-fi glow, lens flare, warped joints.

**Seedream (backup still):**
> Photorealistic still: a robot arm mounted on top of a whiteboard holds a felt eraser mid-wipe over one clean square among
> black marker notes. Soft daylight, matte office wall, no people, no text, 16:9.

**Seedream (end-card background, optional):**
> Minimal flat illustration, top-down whiteboard divided into an 8 by 4 grid of thin grey lines, one cell filled soft
> green, wide empty off-white area on the left for a title, no text, 16:9.

## 8. Production timeline inside the hackathon

### 8.1 Roles (3–4 people; everyone also builds)

| Role | Shoot job | With 3 people |
|---|---|---|
| A: Writer / director | Writes on the board, claps the slate, calls takes, checks captions | Also locks off F on a tripod |
| B: Eraser-actor | Plays the robot. Owns E's setup: DND, Auto-Lock, screen recording, `Tap to start shift`. | Same |
| C: Camera / light | Runs F, fixes glare, tapes floor marks, shoots the hook close-up | Merged into A |
| D: Capture / editor | Records the dashboard, starts M's recording, drives the mock in fallback, edits in **CapCut desktop** | Same |

### 8.2 Schedule (T = hackathon start, 5 h)

| When | Who | What |
|---|---|---|
| T+0:20 (15 min) | All | Lock the hook, script and the P0 UI list into the build plan |
| T+0:45 (15 min) | C | Glare test at the board: settle M's position and lights, tape floor marks, give the vision dev real test frames (ink, L marks, a passing hand) |
| T+1:30 (30 min) | D | Queue Seedance and Seedream. Build the CapCut template: caption style, layouts A/B/C, end card, licensed music. |
| T+2:30 (15 min) | All | **Insurance take**: one loop with whatever works (mock is fine) plus a scratch VO, so a submittable cut exists |
| T+3:15 | All | **Real-vision go/no-go** (8.3) |
| T+3:30 | All | UI freeze (no deploys during the shoot). Run the risk checklist. |
| T+3:40–4:15 | All | Rehearse once, then up to **3 master takes**, the hook close-up again, VO (3 reads) |
| T+4:15–4:45 | D (+A) | Sync, cut to the VO, captions, music at −18 dB under the VO, end card. Export 1080p30 H.264 at **≤ 30.0 s**. |
| T+4:45–4:55 | Someone who hasn't seen it | Watch it muted on a phone. Fix, re-export, submit. |

### 8.3 Fallback if the real algorithm isn't ready

**Go criteria at T+3:15, under shoot lighting:** all 4 L marks found in at least 90% of frames over 2 minutes with a person
working; a written cell turns dirty within about 5 s; a properly erased cell reads clean; a smudged cell still reads dirty.
If any check fails, switch to the mock.

**Mock run:** D marks cells dirty and clean from the dashboard panel (P1-11) while watching the real board, so D plays the
vision model. Two settings have to change for the shoot (they are build-plan items, not something to do in the edit):
- **Turn off the mock's random clean on Done** (`MockVisionApi.eraseSuccessRate`, 0.7 today). Otherwise a dice roll decides
  RETRY versus CLEAN, not the board. D clears C2 only when it is actually clean.
- **The mock reports a fixed rectangle as the board corners** (5–95% x, 8–92% y), not the real L marks. In mock mode, hide
  the board outline, or frame M so the marks sit on those corners. Either way the mock badge stays visible. Never present
  that rectangle as detection.

**Changes on screen, so the mock version stays honest:**

| Shot | Real mode | Mock mode |
|---|---|---|
| 6–9.5 caption | Dirty = 3 steady frames. Passing hands ignored. | Today's vision: a teammate. Swappable too. |
| 6–9.5 VO | "A camera watches. Passing hands don't count." | "Today, a teammate plays the vision model." |
| 6–9.5 visual | Streak pips plus the arm-sweep evidence | Overlay with `VISION: TEAMMATE (MOCK)` badge, no hand-evidence claim |
| 13–18 VO | "The camera, not the worker, decides." | "The watcher, not the worker, decides." |
| End card | (none) | Small line: *Vision model in progress. Dirt marked by a teammate in this demo.* |

This fits the thesis instead of fighting it: today people fill both the AI role and the robot role, and the OS (grid, jobs,
dispatch, retry and verdict flow, record) runs unchanged.

## 9. Risk checklist (run at T+3:30 and before every take)

- [ ] **Phones asleep:** Auto-Lock off (iOS) or screen timeout set to max (Android) on M and E; wake lock active after
      `Tap to start shift`; both on power banks.
- [ ] **Notifications:** Focus/DND on every phone and the laptop. No banners in the screen recordings.
- [ ] **iPhone as eraser:** Safari has no vibration API, so drop the vibration claim (flash and voice carry the moment). An
      Android phone keeps the buzz. Speech only starts after a tap, hence `Tap to start shift`.
- [ ] **Glare:** check M's overlay and F's preview after any light change. Exposure locked on both.
- [ ] **Bodies blocking the camera:** writer and actor step out to their taped floor marks. Corners are never covered. The
      actor taps Done only once outside M's view.
- [ ] **Network:** server on a team laptop, every device on one hotspot. Board ID bookmarked on all devices. Restart
      procedure rehearsed once.
- [ ] **Ink:** fresh black markers, board pre-cleaned, no ghost stains.
- [ ] **Audio:** VO recorded away from the venue noise. App cues come from E's screen recording, not the room. Music from a
      library licensed for commercial use.
- [ ] **People in frame:** frame out other teams, or ask them first.
- [ ] **Numbers:** stat tiles show real session counts. If the sample is tiny, show raw counts and no claims.
- [ ] **Retake budget:** 3 master takes or 35 min, whichever comes first, then cut from the best take or the insurance take.
- [ ] **Export:** exactly ≤ 30.0 s, 1080p30. Name placeholder replaced. Captions proofread. Watched once muted.

## Decisions needed

1. Product name (`wtbd` placeholder, suggestions in section 3).
2. Eraser phone: Android (keeps the vibration) or iPhone (drop the vibration claim).
3. Confirm the cell label format: column A–H, row 1–4, cm from the top-left L-mark elbow to the cell centre.
