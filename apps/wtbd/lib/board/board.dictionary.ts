import { modelDictionary } from "akanjs/dictionary";

import type { Board, BoardInsight } from "./board.constant";
import type { BoardFilter } from "./board.document";
import type { BoardEndpoint, BoardSlice } from "./board.signal";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) =>
    t(["Whiteboard", "화이트보드"]).desc(["A watched whiteboard and its grid", "감시 중인 화이트보드와 그리드"]),
  )
  .model<Board>((t) => ({
    name: t(["Name", "이름"]).desc(["What the board is called", "보드 이름"]),
    widthCm: t(["Width (cm)", "너비(cm)"]).desc([
      "Distance between the inner elbows of the left and right L marks",
      "왼쪽과 오른쪽 L 마크 안쪽 꼭짓점 사이 거리",
    ]),
    heightCm: t(["Height (cm)", "높이(cm)"]).desc([
      "Distance between the inner elbows of the top and bottom L marks",
      "위쪽과 아래쪽 L 마크 안쪽 꼭짓점 사이 거리",
    ]),
    cols: t(["Columns", "열"]).desc(["Grid columns, about one eraser wide each", "그리드 열 수 (한 칸 ≈ 지우개 너비)"]),
    rows: t(["Rows", "행"]).desc(["Grid rows", "그리드 행 수"]),
    cellStreaks: t(["Cell Streaks", "칸 연속 기록"]).desc([
      "How many scans in a row each cell has read dirty (+) or clean (-)",
      "각 칸이 연속으로 더러움(+) 또는 깨끗함(-)으로 읽힌 스캔 수",
    ]),
    lastScanAt: t(["Last Scan", "마지막 스캔"]).desc([
      "When the last usable frame arrived",
      "마지막 유효 프레임 수신 시각",
    ]),
  }))
  .insight<BoardInsight>((t) => ({}))
  .query<BoardFilter>((fn) => ({}))
  .sort<BoardFilter>((t) => ({}))
  .slice<BoardSlice>((fn) => ({
    inPublic: fn(["All Boards", "전체 보드"])
      .desc(["Every whiteboard being watched", "감시 중인 모든 화이트보드"])
      .arg((t) => ({})),
  }))
  .endpoint<BoardEndpoint>((fn) => ({
    submitFrame: fn(["Submit Frame", "프레임 전송"])
      .desc(["Analyse one camera frame of the board", "보드 카메라 프레임 한 장을 분석합니다"])
      .arg((t) => ({
        boardId: t(["Board", "보드"]).desc(["The board in the frame", "프레임에 찍힌 보드"]),
        frame: t(["Frame", "프레임"]).desc(["JPEG bytes from the monitor camera", "모니터 카메라의 JPEG 바이트"]),
      })),
    boardFrame: fn(["Live Frame", "실시간 프레임"])
      .desc(["The latest camera frame of a board", "보드의 최신 카메라 프레임"])
      .arg((t) => ({
        boardId: t(["Board", "보드"]).desc(["The board to watch", "지켜볼 보드"]),
      })),
    boardScanned: fn(["Board Scanned", "보드 스캔됨"])
      .desc(["Each analysis result of a board", "보드의 분석 결과"])
      .arg((t) => ({
        boardId: t(["Board", "보드"]).desc(["The board to watch", "지켜볼 보드"]),
      })),
  }))
  .error({})
  .translate({
    homeTitle: ["Whiteboards", "화이트보드"],
    homeNewBoard: ["New board", "새 보드"],
    openEraser: ["Eraser", "지우개"],
  });
