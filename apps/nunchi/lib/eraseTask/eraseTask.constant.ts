import { BoardGrid } from "@apps/nunchi/common";
import { enumOf, Int } from "akanjs/base";
import { via } from "akanjs/constant";

import { BoardRect } from "../__scalar/boardRect/boardRect.constant";

export class EraseTaskStatus extends enumOf("eraseTaskStatus", [
  "pending",
  "dispatched",
  "verifying",
  "succeeded",
  "failed",
  "canceled",
] as const) {}

export class EraseFeedback extends enumOf("eraseFeedback", ["success", "retry", "failed"] as const) {}

export class EraseFailReason extends enumOf("eraseFailReason", ["stillDirty", "unreachable", "timeout"] as const) {}

export class EraseTaskInput extends via((field) => ({
  cell: field(Int),
  target: field(BoardRect),
})) {}

export class EraseTaskObject extends via(EraseTaskInput, (field) => ({
  status: field(EraseTaskStatus, { default: "pending" }),
  feedback: field(EraseFeedback).optional(),
  failReason: field(EraseFailReason).optional(),
  attempt: field(Int, { default: 0 }),
  maxAttempts: field(Int, { default: 3 }),
  dispatchedAt: field(Date).optional(),
  reportedAt: field(Date).optional(),
  resolvedAt: field(Date).optional(),
})) {}

export class LightEraseTask extends via(
  EraseTaskObject,
  ["cell", "target", "status", "feedback", "attempt", "maxAttempts", "dispatchedAt", "resolvedAt"] as const,
  (resolve) => ({}),
) {
  isActive() {
    return this.status === "dispatched" || this.status === "verifying";
  }

  cellLabel() {
    return BoardGrid.cellLabel(this.cell);
  }
}

export class EraseTask extends via(EraseTaskObject, LightEraseTask, (resolve) => ({})) {
  static openStatuses = ["pending", "dispatched", "verifying"] as const;
  static settleMs = 1_500;
  static dispatchTimeoutMs = 120_000;
  static retaskCooldownMs = 60_000;
}

export class EraseTaskInsight extends via(EraseTask, (field) => ({
  attempts: field(Int, { default: 0, accumulate: { $sum: "attempt" } }),
})) {}
