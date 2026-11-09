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

export const useEraseVerdict = (boardId: string, phrases: { [key in Feedback]: string }) => {
  const [verdict, setVerdict] = useState<cnst.EraseTask | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = fetch.subscribeEraseFeedback(boardId, (task) => {
      if (!task.feedback) return;
      setVerdict(task);
      navigator.vibrate?.(vibrationOf[task.feedback]);
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(phrases[task.feedback]));
      clearTimeout(timer);
      timer = setTimeout(() => setVerdict(null), 2_500);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [boardId]);
  const unlockVoice = (phrase: string) => {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(phrase));
  };
  return { verdict, unlockVoice };
};
