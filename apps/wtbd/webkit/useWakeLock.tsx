"use client";
import { useEffect } from "react";

export const useWakeLock = () => {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    const request = async () => {
      if (document.visibilityState !== "visible" || !("wakeLock" in navigator)) return;
      // the browser refuses a wake lock outside a secure context (a phone on plain-http LAN)
      sentinel = await navigator.wakeLock.request("screen").catch(() => null);
    };
    void request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void sentinel?.release();
    };
  }, []);
};
