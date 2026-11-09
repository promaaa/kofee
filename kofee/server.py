"""HTTP API for front-ends (laptop, phone).

The camera loop publishes its state and images into a `Hub`; the web server reads from it.
Front-ends get the live state as JSON (polling or Server-Sent Events), images as JPEG or MJPEG,
and send commands back. See docs/API.md.
"""

from __future__ import annotations

import asyncio
import json
import queue
import socket
import threading
from pathlib import Path

import cv2
import numpy as np
from pydantic import BaseModel

ACTIONS = {"start", "done", "reset", "calibrate"}


class Command(BaseModel):
    action: str  # start | done | reset | calibrate
    corners: list[list[float]] | None = None  # calibrate: 4 points, normalised to the camera image (0..1)

INDEX_HTML = """<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>kofee</title>
<style>
  body { margin: 0; background: #141414; color: #eee; font-family: -apple-system, system-ui, sans-serif; }
  #task { font-size: 40px; font-weight: 800; padding: 16px 16px 4px; }
  #status { font-size: 20px; padding: 0 16px 12px; color: #aaa; }
  img { width: 100%; display: block; }
  .bar { display: flex; gap: 8px; padding: 12px; }
  button { flex: 1; font-size: 20px; padding: 16px; border: 0; border-radius: 12px; background: #333; color: #fff; }
  button.primary { background: #f5a623; color: #000; font-weight: 700; }
</style></head>
<body>
  <div id="task">kofee</div><div id="status">connecting…</div>
  <img src="/stream/dashboard.mjpg" alt="live dashboard">
  <div class="bar">
    <button onclick="send('start')">Start</button>
    <button class="primary" onclick="send('done')">Done</button>
    <button onclick="send('reset')">Reset</button>
  </div>
<script>
  const events = new EventSource('/api/events');
  events.onmessage = (e) => {
    const s = JSON.parse(e.data);
    document.getElementById('task').textContent = s.task ? `${s.agent.name}: erase ${s.task.cell}` : s.state.toUpperCase();
    document.getElementById('status').textContent = s.status.text;
  };
  const send = (action) => fetch('/api/command', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({action}) });
</script>
</body></html>
"""


class Hub:
    """Thread-safe mailbox between the camera loop (producer) and the web server (consumers)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._state: dict = {}
        self._version = 0
        self._jpegs: dict[str, bytes] = {}
        self._episodes: list[dict] = []
        self.commands: queue.Queue[dict] = queue.Queue()

    def publish(self, state: dict, images: dict[str, np.ndarray], episodes: list[dict], quality: int = 80) -> None:
        encoded = {}
        for name, img in images.items():
            ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
            if ok:
                encoded[name] = buf.tobytes()
        with self._lock:
            self._state = state
            self._version += 1
            self._jpegs.update(encoded)
            self._episodes = episodes

    def state(self) -> tuple[int, dict]:
        with self._lock:
            return self._version, self._state

    def jpeg(self, name: str) -> bytes | None:
        with self._lock:
            return self._jpegs.get(name)

    def episodes(self) -> list[dict]:
        with self._lock:
            return list(self._episodes)


def create_api(hub: Hub, runs_dir: Path):
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import HTMLResponse, Response, StreamingResponse
    from fastapi.staticfiles import StaticFiles

    api = FastAPI(title="kofee", summary="Live state, images and commands of the kofee loop.")
    api.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
    runs_dir.mkdir(parents=True, exist_ok=True)
    api.mount("/runs", StaticFiles(directory=runs_dir), name="runs")

    @api.get("/", response_class=HTMLResponse, include_in_schema=False)
    def index() -> str:
        return INDEX_HTML

    @api.get("/api/state")
    def get_state() -> dict:
        return hub.state()[1]

    @api.get("/api/events")
    async def events() -> StreamingResponse:
        async def stream():
            last = -1
            while True:
                version, state = hub.state()
                if version != last:
                    last = version
                    yield f"data: {json.dumps(state)}\n\n"
                await asyncio.sleep(0.1)

        return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})

    @api.get("/api/episodes")
    def get_episodes() -> list[dict]:
        return hub.episodes()

    @api.post("/api/command")
    def command(cmd: Command) -> dict:
        if cmd.action not in ACTIONS:
            raise HTTPException(400, f"unknown action {cmd.action!r}, expected one of {sorted(ACTIONS)}")
        if cmd.action == "calibrate" and cmd.corners is not None and len(cmd.corners) != 4:
            raise HTTPException(400, "calibrate needs exactly 4 corners")
        hub.commands.put(cmd.model_dump())
        return {"ok": True}

    @api.get("/frame/{name}.jpg")
    def frame(name: str) -> Response:
        jpg = hub.jpeg(name)
        if jpg is None:
            raise HTTPException(404, f"no image {name!r} yet")
        return Response(jpg, media_type="image/jpeg", headers={"Cache-Control": "no-store"})

    @api.get("/stream/{name}.mjpg")
    async def stream(name: str) -> StreamingResponse:
        async def frames():
            last = None
            while True:
                jpg = hub.jpeg(name)
                if jpg is not None and jpg is not last:
                    last = jpg
                    yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpg + b"\r\n"
                await asyncio.sleep(0.05)

        return StreamingResponse(frames(), media_type="multipart/x-mixed-replace; boundary=frame")

    return api


def serve(hub: Hub, runs_dir: Path, port: int) -> threading.Thread:
    """Run the API on a background thread (OpenCV needs the main thread on macOS)."""
    import uvicorn

    server = uvicorn.Server(uvicorn.Config(create_api(hub, runs_dir), host="0.0.0.0", port=port, log_level="warning"))
    thread = threading.Thread(target=server.run, daemon=True, name="kofee-api")
    thread.start()
    return thread


def lan_address() -> str:
    """Best guess of this machine's address on the local network (no packet is sent)."""
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
        except OSError:
            return "127.0.0.1"
