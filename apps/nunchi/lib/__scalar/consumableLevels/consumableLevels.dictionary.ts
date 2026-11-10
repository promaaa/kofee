import { scalarDictionary } from "akanjs/dictionary";

import type { ConsumableLevels } from "./consumableLevels.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) =>
    t(["Consumable Levels", "소모품 잔량"]).desc([
      "How much of the marker and the eraser pad is left",
      "마커와 지우개 패드가 얼마나 남았는지",
    ]),
  )
  .model<ConsumableLevels>((t) => ({
    markerUsed: t(["Marker Used", "마커 사용량"]).desc([
      "Cells of ink written since the last marker swap",
      "마지막 마커 교체 이후 작성된 칸 수",
    ]),
    markerPercent: t(["Marker Left", "마커 잔량"]).desc(["Percent of the marker's life left", "마커 수명의 남은 비율"]),
    eraserUsed: t(["Eraser Used", "지우개 사용량"]).desc([
      "Erase passes, retries included, since the last pad swap",
      "마지막 패드 교체 이후 지운 횟수 (재시도 포함)",
    ]),
    eraserPercent: t(["Eraser Left", "지우개 잔량"]).desc([
      "Percent of the eraser pad's life left",
      "지우개 패드 수명의 남은 비율",
    ]),
  }));
