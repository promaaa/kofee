
# kofee

This workspace was created with [Akan.js](https://akanjs.com), a Bun-first full-stack TypeScript framework.

Akan lets you write business code once and connect it across web, server, fetch clients, state, database contracts,
and deployment artifacts with strict conventions.

## Quick Start

Install dependencies:

```bash
bun install
bun install -g @akanjs/cli
```

Start the app:

```bash
akan start wtbd --open
```

Build for production:

```bash
akan build wtbd
```

## Project Structure

```text
apps/wtbd/
|-- akan.config.ts      # app configuration
|-- page/               # route pages
|-- lib/                # app domain modules
|-- ui/                 # app UI components
|-- env/                # runtime environment contracts
`-- public/             # static assets

libs/                   # shared libraries for multiple apps
pkgs/                   # local packages, if your workspace grows into them
```

## Where To Start

- Edit `apps/wtbd/page/_index.tsx` to change the first page.
- Edit `apps/wtbd/akan.config.ts` when the app needs routes, domains, base paths, or deployment options.
- Add business modules under `apps/wtbd/lib/` when your app needs typed domain logic.

## Useful Commands

```bash
akan start wtbd
akan build wtbd
akan lint wtbd
```

## Learn More

- Akan.js docs: https://akanjs.com/docs
- Package: https://www.npmjs.com/package/akanjs


---

## Whiteboard cleaning (Python)

Embodiment-agnostic whiteboard cleaning with automatic visual verification.

A camera watches a whiteboard. Anything written in blue inside the black frame is "dirt".
The system turns what it sees into tasks ("erase cell C2") expressed only in board
coordinates, hands them to whichever embodiment is available, and checks the result
from the camera on its own. Every attempt becomes a labelled episode.

> Work in progress — full write-up coming.

## Quick start

```bash
uv sync
uv run kofee            # webcam 0; first run asks you to click the 4 frame corners
```

## Layout

| Module | Role |
| --- | --- |
| `kofee/camera.py` | Frame sources: webcam or video file |
| `kofee/board.py` | Calibration (4 corners), rectification, grid of cells, tick detection |
| `kofee/vision.py` | Ink detection, person/motion detection |
| `kofee/tasks.py` | The task interface, planner and embodiments |
| `kofee/episodes.py` | Episode log (the flywheel dataset) |
