import { serviceDictionary } from "akanjs/dictionary";

import type { VisionEndpoint } from "../sig";

export const dictionary = serviceDictionary(["en", "ko"])
  .endpoint<VisionEndpoint>((fn) => ({
    setMockDirt: fn(["Set Mock Dirt", "모의 오염 설정"])
      .desc(["Mark a cell dirty or clean in the mock algorithm", "모의 알고리즘에서 칸을 더럽거나 깨끗하게 표시합니다"])
      .arg((t) => ({
        boardId: t(["Board", "보드"]).desc(["The board to change", "바꿀 보드"]),
        cell: t(["Cell", "칸"]).desc(["Grid cell index", "그리드 칸 번호"]),
        dirty: t(["Dirty", "오염"]).desc(["Whether the cell should read dirty", "칸을 더러움으로 표시할지 여부"]),
      })),
  }))
  .error({})
  .translate({});
