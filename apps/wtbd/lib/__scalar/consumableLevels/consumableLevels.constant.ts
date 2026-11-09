import { Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class ConsumableLevels extends via((field) => ({
  markerUsed: field(Int, { default: 0 }), // cells of ink written since the marker was last replaced
  markerPercent: field(Int, { default: 100 }), // share of the marker's life left
  eraserUsed: field(Int, { default: 0 }), // erase passes, retries included, since the pad was last replaced
  eraserPercent: field(Int, { default: 100 }), // share of the pad's life left
})) {
  static markerLife = 30;
  static eraserLife = 20;
  static requestAtPercent = 10;

  static of(markerUsed: number, eraserUsed: number) {
    return new ConsumableLevels().set({
      markerUsed,
      markerPercent: ConsumableLevels.percentLeft(markerUsed, ConsumableLevels.markerLife),
      eraserUsed,
      eraserPercent: ConsumableLevels.percentLeft(eraserUsed, ConsumableLevels.eraserLife),
    });
  }

  static percentLeft(used: number, life: number) {
    return Math.max(0, Math.round(100 - (100 * used) / life));
  }
}
