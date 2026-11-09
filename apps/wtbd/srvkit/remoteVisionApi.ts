import { adapt } from "akanjs/service";

import type { ModulesOptions } from "../lib/option";
import type { VisionInput, VisionResult } from "./visionResult";

interface AnalyzeResponse {
  corners?: [number, number][] | null;
  regions?: { x: number; y: number; w: number; h: number; score?: number }[];
}

export class RemoteVisionApi extends adapt("remoteVisionApi" as const, ({ env }) => ({
  visionApiUrl: env(({ visionApiUrl }: ModulesOptions) => visionApiUrl ?? process.env.VISION_API_URL),
})) {
  static timeoutMs = 3_000;
  static minScore = 0.5;

  isEnabled() {
    return !!this.visionApiUrl;
  }

  async analyze({ boardId, frame, cols, rows }: VisionInput): Promise<VisionResult | null> {
    const query = new URLSearchParams({ boardId, cols: String(cols), rows: String(rows) });
    try {
      const response = await fetch(`${this.visionApiUrl}/analyze?${query}`, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: frame,
        signal: AbortSignal.timeout(RemoteVisionApi.timeoutMs),
      });
      if (!response.ok) {
        this.logger.error(`Vision server answered ${response.status} for board ${boardId}`);
        return null;
      }
      const body = (await response.json()) as AnalyzeResponse;
      return {
        corners: (body.corners ?? []).map(([x, y]) => ({ x, y })),
        regions: (body.regions ?? [])
          .filter((region) => (region.score ?? 1) >= RemoteVisionApi.minScore)
          .map(({ x, y, w, h }) => ({ x, y, w, h })),
      };
    } catch (error) {
      this.logger.error(`Vision server unreachable for board ${boardId}: ${String(error)}`);
      return null;
    }
  }
}
