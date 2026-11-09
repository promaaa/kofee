import { serviceDictionary } from "akanjs/dictionary";

import type { VisionEndpoint } from "../sig";

export const dictionary = serviceDictionary(["en", "ko"])
  .endpoint<VisionEndpoint>((fn) => ({}))
  .error({})
  .translate({});
