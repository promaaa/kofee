import { adapt } from "akanjs/service";

import type { ModulesOptions } from "../lib/option";
import type { VisionInput, VisionRect, VisionResult } from "./visionResult";

interface AnalyzeResponse {
  corners?: [number, number][] | null;
  regions?: (VisionRect & { score?: number })[];
  unknown?: VisionRect[];
}

export class RemoteVisionApi extends adapt("remoteVisionApi" as const, ({ env }) => ({
  visionApiUrl: env(({ visionApiUrl }: ModulesOptions) => visionApiUrl ?? process.env.VISION_API_URL),
})) {
  static protocolVersion = "1";
  static boardId = "main";
  static timeoutMs = 3_000;
  static minScore = 0.5;

  override async onInit() {
    if (this.isEnabled()) void this.#checkHealth();
  }

  isEnabled() {
    return !!this.visionApiUrl;
  }

  async analyze({ frame, cols, rows }: VisionInput): Promise<VisionResult | null> {
    const query = new URLSearchParams({ boardId: RemoteVisionApi.boardId, cols: String(cols), rows: String(rows) });
    try {
      const response = await fetch(`${this.visionApiUrl}/analyze?${query}`, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg", "X-Protocol-Version": RemoteVisionApi.protocolVersion },
        body: frame,
        signal: AbortSignal.timeout(RemoteVisionApi.timeoutMs),
      });
      if (!response.ok) {
        this.logger.error(`Vision server answered ${response.status}`);
        return null;
      }
      const body = (await response.json()) as AnalyzeResponse;
      return {
        corners: (body.corners ?? []).map(([x, y]) => ({ x, y })),
        regions: (body.regions ?? [])
          .filter((region) => (region.score ?? 1) >= RemoteVisionApi.minScore)
          .map(({ x, y, w, h }) => ({ x, y, w, h })),
        unknown: (body.unknown ?? []).map(({ x, y, w, h }) => ({ x, y, w, h })),
      };
    } catch (error) {
      this.logger.error(`Vision server unreachable: ${String(error)}`);
      return null;
    }
  }

  async algorithmView(): Promise<Uint8Array<ArrayBuffer> | null> {
    try {
      const response = await fetch(`${this.visionApiUrl}/debug/board.jpg`, {
        signal: AbortSignal.timeout(RemoteVisionApi.timeoutMs),
      });
      return response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
    } catch {
      return null;
    }
  }

  async #checkHealth() {
    try {
      const response = await fetch(`${this.visionApiUrl}/health`, {
        signal: AbortSignal.timeout(RemoteVisionApi.timeoutMs),
      });
      if (response.ok) this.logger.info(`Vision server healthy at ${this.visionApiUrl}`);
      else this.logger.warn(`Vision server health check answered ${response.status}; frames will scan as unusable`);
    } catch (error) {
      this.logger.warn(`Vision server unreachable at startup; frames will scan as unusable: ${String(error)}`);
    }
  }
}
