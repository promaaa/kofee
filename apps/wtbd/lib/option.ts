import { AkanOption } from "akanjs/server";

import type { LibOptions } from "./srv";

export type ModulesOptions = LibOptions & {
  visionApiUrl?: string;
};

export const option = new AkanOption<ModulesOptions>();
