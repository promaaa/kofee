import { LocalOrSignedIn } from "@apps/wtbd/srvkit";
import { Binary, Int } from "akanjs/base";
import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class VisionInternal extends internal(srv.vision, () => ({})) {}

export class VisionEndpoint extends endpoint(srv.vision, ({ query, mutation }) => ({
  algorithmView: query(Binary, { guards: [LocalOrSignedIn], mcp: false }).exec(async function () {
    return await this.visionService.algorithmView();
  }),

  setMockDirt: mutation(Boolean, { guards: [LocalOrSignedIn] })
    .body("cell", Int)
    .body("dirty", Boolean)
    .exec(function (cell, dirty) {
      return this.visionService.setMockDirt(cell, dirty);
    }),
  setMockGlare: mutation(Boolean, { guards: [LocalOrSignedIn] })
    .body("cell", Int)
    .body("glare", Boolean)
    .exec(function (cell, glare) {
      return this.visionService.setMockGlare(cell, glare);
    }),
})) {}
