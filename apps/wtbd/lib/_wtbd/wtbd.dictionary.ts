import { serviceDictionary } from "akanjs/dictionary";

import type { WtbdEndpoint } from "./wtbd.signal";

export const dictionary = serviceDictionary(["en", "ko"])
  .endpoint<WtbdEndpoint>((fn) => ({}))
  .translate({});
