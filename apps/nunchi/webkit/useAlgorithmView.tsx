"use client";
import { useEffect, useRef, useState } from "react";

import { fetch } from "../lib/useClient";

export const useAlgorithmView = (scanKey: number | null) => {
  const urlRef = useRef<string | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (scanKey === null || isLoadingRef.current) return;
    isLoadingRef.current = true;
    fetch
      .algorithmView()
      .then((bytes) => {
        if (!isMountedRef.current || !bytes.length) return;
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }));
        setUrl(urlRef.current);
      })
      .catch(() => null)
      .finally(() => {
        isLoadingRef.current = false;
      });
  }, [scanKey]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  return { url };
};
