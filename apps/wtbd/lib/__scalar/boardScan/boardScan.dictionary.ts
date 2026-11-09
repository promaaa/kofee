import { scalarDictionary } from "akanjs/dictionary";

import type { BoardScan } from "./boardScan.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["BoardScan", "BoardScan"]).desc(["BoardScan description", "BoardScan 설명"]))
  .model<BoardScan>((t) => ({
    field: t(["Field", "필드"]).desc(["Field Description", "필드 설명"]),
  }));
