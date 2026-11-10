import { type Dayjs, dayjs } from "akanjs/base";
import { by, from, into } from "akanjs/document";

import * as cnst from "../cnst";
import { Err } from "../dict";

export class EraseTaskFilter extends from(cnst.EraseTask, (filter) => ({
  query: {
    open: filter().query((q) => ({ status: q.oneOf(cnst.EraseTask.openStatuses) })),
    failedSince: filter()
      .arg("since", Date)
      .query((since, q) => ({ status: "failed", resolvedAt: q.gte(since) })),
    createdSince: filter()
      .arg("since", Date)
      .query((since, q) => ({ createdAt: q.gte(since) })),
    dispatchedSince: filter()
      .arg("since", Date)
      .query((since, q) => ({ dispatchedAt: q.gte(since) })),
    stillDirtySince: filter()
      .arg("since", Date)
      .query((since, q) => ({ status: "failed", failReason: "stillDirty", resolvedAt: q.gte(since) })),
    dispatchedBefore: filter()
      .arg("before", Date)
      .query((before, q) => ({ status: "dispatched", dispatchedAt: q.lte(before) })),
  },
  sort: {
    oldest: { createdAt: 1 },
    newest: { createdAt: -1 },
  },
})) {}

export class EraseTask extends by(cnst.EraseTask) {
  isActive() {
    return this.status === "dispatched" || this.status === "verifying";
  }

  isOpen() {
    return this.status === "pending" || this.isActive();
  }

  canBeJudgedWith(capturedAt: Dayjs) {
    return (
      this.status === "verifying" && !!this.reportedAt && capturedAt.diff(this.reportedAt) >= cnst.EraseTask.settleMs
    );
  }

  // pending -> dispatched
  dispatch() {
    if (this.status !== "pending") throw new Err("eraseTask.error.notPending");
    this.status = "dispatched";
    this.attempt += 1;
    this.dispatchedAt = dayjs();
    return this;
  }

  // dispatched -> verifying
  reportErased() {
    if (this.status !== "dispatched") throw new Err("eraseTask.error.notDispatched");
    this.status = "verifying";
    this.reportedAt = dayjs();
    return this;
  }

  // verifying -> succeeded | dispatched (retry) | failed
  judge(stillDirty: boolean, capturedAt: Dayjs) {
    if (!this.canBeJudgedWith(capturedAt)) throw new Err("eraseTask.error.notVerifiable");
    if (!stillDirty) {
      this.status = "succeeded";
      this.feedback = "success";
      this.resolvedAt = dayjs();
    } else if (this.attempt < this.maxAttempts) {
      this.status = "dispatched";
      this.feedback = "retry";
      this.attempt += 1;
      this.dispatchedAt = dayjs();
    } else {
      this.status = "failed";
      this.feedback = "failed";
      this.failReason = "stillDirty";
      this.resolvedAt = dayjs();
    }
    return this;
  }

  // dispatched -> failed
  giveUp(reason: "unreachable" | "timeout") {
    if (this.status !== "dispatched") throw new Err("eraseTask.error.notDispatched");
    this.status = "failed";
    this.feedback = "failed";
    this.failReason = reason;
    this.resolvedAt = dayjs();
    return this;
  }

  // pending | dispatched | verifying -> canceled
  cancel() {
    if (!this.isOpen()) throw new Err("eraseTask.error.notOpen");
    this.status = "canceled";
    this.resolvedAt = dayjs();
    return this;
  }
}

export class EraseTaskModel extends into(EraseTask, EraseTaskFilter, cnst.eraseTask, () => ({})) {}
