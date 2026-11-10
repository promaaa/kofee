import { scalarDictionary } from "akanjs/dictionary";

import type { BoardPoint } from "./boardPoint.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Frame Point", "프레임 좌표"]).desc(["A point in a camera frame", "카메라 프레임 위의 점"]))
  .model<BoardPoint>((t) => ({
    x: t(["X", "X"]).desc(["Horizontal position as a fraction of the frame width", "프레임 너비 대비 가로 위치 비율"]),
    y: t(["Y", "Y"]).desc(["Vertical position as a fraction of the frame height", "프레임 높이 대비 세로 위치 비율"]),
  }));
