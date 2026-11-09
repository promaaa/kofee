import { dayjs, enumOf, Int } from "akanjs/base";
import { via } from "akanjs/constant";

import { BoardPoint } from "../boardPoint/boardPoint.constant";
import { BoardRect } from "../boardRect/boardRect.constant";

export class VisionSource extends enumOf("visionSource", ["mock", "remote"] as const) {}

export class BoardScan extends via((field) => ({
  source: field(VisionSource, { default: "mock" }),
  corners: field([BoardPoint]),
  regions: field([BoardRect]),
  dirtyCells: field([Int]),
  latencyMs: field(Int, { default: 0 }),
  capturedAt: field(Date, { default: () => dayjs() }),
})) {
  isUsable() {
    return this.corners.length === 4;
  }
}
