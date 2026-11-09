"""Frame sources: a live webcam, or a recorded video for offline development."""

from __future__ import annotations

import threading
import time

import cv2
import numpy as np


class FrameSource:
    """Delivers BGR frames from a webcam index ("0") or a video file path.

    Webcam frames are grabbed on a background thread so `read()` always returns the most recent
    image rather than a stale buffered one. Video files are paced at their native frame rate
    (dropping frames when processing falls behind) so timing logic behaves as it does live.
    """

    def __init__(self, source: str = "0", width: int = 1920, height: int = 1080, loop: bool = False):
        self.is_file = not source.isdigit()
        self.loop = loop
        self.ended = False
        if self.is_file:
            self._cap = cv2.VideoCapture(source)
        else:
            self._cap = cv2.VideoCapture(int(source), cv2.CAP_AVFOUNDATION)
            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        if not self._cap.isOpened():
            raise RuntimeError(f"cannot open video source {source!r}")

        self._fps = self._cap.get(cv2.CAP_PROP_FPS) or 30.0
        self._t0 = time.monotonic()
        self._pos = 0
        self._frame: np.ndarray | None = None
        self._lock = threading.Lock()
        self._running = True
        if not self.is_file:
            self._thread = threading.Thread(target=self._grab_loop, daemon=True)
            self._thread.start()

    def _grab_loop(self) -> None:
        while self._running:
            ok, frame = self._cap.read()
            if ok:
                with self._lock:
                    self._frame = frame
            else:
                time.sleep(0.01)

    def read(self) -> np.ndarray | None:
        """Most recent frame; None while the webcam warms up or once a file has ended."""
        if not self.is_file:
            with self._lock:
                return None if self._frame is None else self._frame.copy()
        due = self._t0 + self._pos / self._fps
        if (wait := due - time.monotonic()) > 0:
            time.sleep(wait)
        for _ in range(int((time.monotonic() - due) * self._fps)):  # drop frames we are late for
            self._cap.grab()
            self._pos += 1
        ok, frame = self._cap.read()
        self._pos += 1
        if ok:
            return frame
        if self.loop:
            self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            self._t0, self._pos = time.monotonic(), 0
            return self.read()
        self.ended = True
        return None

    def close(self) -> None:
        self._running = False
        if not self.is_file:
            self._thread.join(timeout=1.0)
        self._cap.release()
