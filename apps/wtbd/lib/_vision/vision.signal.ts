import { LocalOrSignedIn } from "@apps/wtbd/srvkit";
import { Int } from "akanjs/base";
import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class VisionInternal extends internal(srv.vision, () => ({})) {}

export class VisionEndpoint extends endpoint(srv.vision, ({ mutation }) => ({
  setMockDirt: mutation(Boolean, { guards: [LocalOrSignedIn] })
    .param("boardId", String)
    .body("cell", Int)
    .body("dirty", Boolean)
    .exec(function (boardId, cell, dirty) {
      return this.visionService.setMockDirt(boardId, cell, dirty);
    }),
})) {}
