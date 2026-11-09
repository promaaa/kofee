import { modelDictionary } from "akanjs/dictionary";

import type { Board, BoardInsight } from "./board.constant";
import type { BoardFilter } from "./board.document";
import type { BoardEndpoint, BoardSlice } from "./board.signal";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Board", "Board"]).desc(["Enter board.", "Board 값을 입력합니다."]))
  .model<Board>((t) => ({
    name: t(["Name", "이름"]).desc(["Name", "이름"]),
  }))
  .insight<BoardInsight>((t) => ({}))
  .query<BoardFilter>((fn) => ({}))
  .sort<BoardFilter>((t) => ({}))
  .slice<BoardSlice>((fn) => ({
    inPublic: fn(["Board In Public", "Board 공개"]).arg((t) => ({})),
  }))
  .endpoint<BoardEndpoint>((fn) => ({}))
  .error({})
  .translate({});
