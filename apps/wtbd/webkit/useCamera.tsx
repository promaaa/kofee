"use client";
import { useEffect, useRef, useState } from "react";

export type CameraError = "insecure" | "denied" | "unavailable";

interface CameraOptions {
  width?: number;
  quality?: number;
}

const encodeFrame = async (video: HTMLVideoElement, canvas: HTMLCanvasElement, width: number, quality: number) => {
  canvas.width = width;
  canvas.height = Math.round((width * video.videoHeight) / video.videoWidth);
  canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
};

const nextVideoFrame = (video: HTMLVideoElement) =>
  new Promise<void>((resolve) => {
    if (typeof video.requestVideoFrameCallback === "function") video.requestVideoFrameCallback(() => resolve());
    else requestAnimationFrame(() => resolve());
  });

export const useCamera = (
  onFrame: (frame: Uint8Array<ArrayBuffer>) => unknown,
  { width = 960, quality = 0.7 }: CameraOptions = {},
) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef<boolean>(false);
  const onFrameRef = useRef(onFrame);
  const [error, setError] = useState<CameraError | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [aspect, setAspect] = useState(16 / 9);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  const stop = () => {
    runningRef.current = false;
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsRunning(false);
    setFps(0);
  };

  const loop = async () => {
    const canvas = document.createElement("canvas");
    let answeredAt = 0;
    let shownAt = 0;
    let smoothed = 0;
    const send = async (frame: Uint8Array<ArrayBuffer>) => {
      try {
        await onFrameRef.current(frame);
      } catch {
        return;
      }
      const now = performance.now();
      const instant = answeredAt ? 1000 / (now - answeredAt) : 0;
      smoothed = smoothed ? smoothed * 0.9 + instant * 0.1 : instant;
      answeredAt = now;
      if (now - shownAt < 500) return;
      shownAt = now;
      setFps(smoothed);
    };
    let inFlight: Promise<void> = Promise.resolve();
    while (runningRef.current) {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        continue;
      }
      await nextVideoFrame(video);
      const frame = await encodeFrame(video, canvas, width, quality);
      await inFlight;
      if (frame && runningRef.current) inFlight = send(frame);
    }
  };

  const start = async () => {
    if (runningRef.current) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("insecure");
      return;
    }
    const stream = await navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, frameRate: { ideal: 60 } },
        audio: false,
      })
      .catch((reason: unknown) => {
        setError(reason instanceof DOMException && reason.name === "NotAllowedError" ? "denied" : "unavailable");
        return null;
      });
    const video = videoRef.current;
    if (!stream || !video) return;
    streamRef.current = stream;
    video.srcObject = stream;
    await video.play().catch(() => undefined);
    if (video.videoWidth && video.videoHeight) setAspect(video.videoWidth / video.videoHeight);
    setError(null);
    runningRef.current = true;
    setIsRunning(true);
    void loop();
  };

  useEffect(() => stop, []);

  return { videoRef, error, isRunning, aspect, fps, start, stop };
};
