import { scalarDictionary } from "akanjs/dictionary";

import type { BoardPoint } from "./boardPoint.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["BoardPoint", "BoardPoint"]).desc(["BoardPoint description", "BoardPoint 설명"]))
  .model<BoardPoint>((t) => ({
    field: t(["Field", "필드"]).desc(["Field Description", "필드 설명"]),
  }));
