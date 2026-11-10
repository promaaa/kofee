import { serviceDictionary } from "akanjs/dictionary";

import type { NunchiEndpoint } from "./nunchi.signal";

export const dictionary = serviceDictionary(["en", "ko"])
  .endpoint<NunchiEndpoint>((fn) => ({}))
  .translate({});
