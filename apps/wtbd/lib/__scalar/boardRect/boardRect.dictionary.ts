import { scalarDictionary } from "akanjs/dictionary";

import type { BoardRect } from "./boardRect.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Board Area", "보드 영역"]).desc(["A rectangle on the whiteboard", "화이트보드 위의 사각형 영역"]))
  .model<BoardRect>((t) => ({
    x: t(["Left", "왼쪽"]).desc(["Left edge as a fraction of the board width", "보드 너비 대비 왼쪽 경계 비율"]),
    y: t(["Top", "위쪽"]).desc(["Top edge as a fraction of the board height", "보드 높이 대비 위쪽 경계 비율"]),
    w: t(["Width", "너비"]).desc(["Width as a fraction of the board width", "보드 너비 대비 너비 비율"]),
    h: t(["Height", "높이"]).desc(["Height as a fraction of the board height", "보드 높이 대비 높이 비율"]),
  }));
