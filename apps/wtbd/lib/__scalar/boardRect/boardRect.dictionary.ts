import { scalarDictionary } from "akanjs/dictionary";

import type { BoardRect } from "./boardRect.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["BoardRect", "BoardRect"]).desc(["BoardRect description", "BoardRect 설명"]))
  .model<BoardRect>((t) => ({
    field: t(["Field", "필드"]).desc(["Field Description", "필드 설명"]),
  }));
