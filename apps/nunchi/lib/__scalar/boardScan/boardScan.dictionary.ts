import { scalarDictionary } from "akanjs/dictionary";

import type { BoardScan, VisionSource } from "./boardScan.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Board Scan", "보드 스캔"]).desc(["One analysed camera frame", "분석된 카메라 프레임 한 장"]))
  .model<BoardScan>((t) => ({
    source: t(["Source", "출처"]).desc(["Which vision backend analysed the frame", "프레임을 분석한 비전 백엔드"]),
    corners: t(["Corners", "모서리"]).desc(["Where the four L marks were found", "네 개의 L 마크가 발견된 위치"]),
    regions: t(["Dirty Regions", "오염 영역"]).desc(["Dirt the algorithm detected", "알고리즘이 감지한 오염 영역"]),
    dirtyCells: t(["Dirty Cells", "오염 칸"]).desc(["Grid cells the dirt covers", "오염 영역이 덮는 그리드 칸"]),
    unknownCells: t(["Unknown Cells", "판별 불가 칸"]).desc([
      "Grid cells the algorithm could not read, such as glare",
      "반사광 등으로 알고리즘이 읽지 못한 그리드 칸",
    ]),
    cellStreaks: t(["Cell Streaks", "칸 연속 판독"]).desc([
      "How many scans in a row each cell has read dirty (+) or clean (-)",
      "각 칸이 연속으로 더러움(+) 또는 깨끗함(-)으로 읽힌 횟수",
    ]),
    latencyMs: t(["Latency", "지연"]).desc(["Analysis time in milliseconds", "분석에 걸린 시간(밀리초)"]),
    capturedAt: t(["Captured At", "촬영 시각"]).desc([
      "When the server received the frame",
      "서버가 프레임을 받은 시각",
    ]),
  }))
  .enum<VisionSource>("visionSource", (t) => ({
    mock: t(["Mock", "모의"]).desc(["The in-process mock algorithm", "서버 내장 모의 알고리즘"]),
    remote: t(["Algorithm Server", "알고리즘 서버"]).desc(["The external algorithm server", "외부 알고리즘 서버"]),
  }));
