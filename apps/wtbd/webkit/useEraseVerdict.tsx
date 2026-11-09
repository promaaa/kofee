"use client";
import { useEffect, useState } from "react";

import type * as cnst from "../lib/cnst";
import { fetch } from "../lib/useClient";

type Feedback = cnst.EraseFeedback["value"];

const vibrationOf: { [key in Feedback]: number[] } = {
  success: [120],
  retry: [80, 60, 80, 60, 80],
  failed: [500],
};

const speak = (phrase: string, lang: string) => {
  // WebKit drops an utterance queued right after cancel(), so cancel only what is still playing
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(phrase);
  utterance.lang = lang === "ko" ? "ko-KR" : "en-US";
  speechSynthesis.speak(utterance);
};

export const useEraseVerdict = (lang: string, phrases: { [key in Feedback]: string }) => {
  const [verdict, setVerdict] = useState<cnst.EraseTask | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = fetch.subscribeEraseFeedback((task) => {
      if (!task.feedback) return;
      setVerdict(task);
      navigator.vibrate?.(vibrationOf[task.feedback]);
      speak(phrases[task.feedback], lang);
      clearTimeout(timer);
      timer = setTimeout(() => setVerdict(null), 2_500);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [lang]);
  const unlockVoice = (phrase: string) => speak(phrase, lang);
  return { verdict, unlockVoice };
};
