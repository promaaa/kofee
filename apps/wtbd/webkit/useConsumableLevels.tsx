"use client";
import { useEffect, useState } from "react";

import type * as cnst from "../lib/cnst";
import { fetch } from "../lib/useClient";

export const useConsumableLevels = () => {
  const [levels, setLevels] = useState<cnst.ConsumableLevels | null>(null);
  useEffect(() => {
    void fetch.consumableLevels().then(setLevels);
    return fetch.subscribeConsumableLevelsChanged(setLevels);
  }, []);
  return levels;
};
