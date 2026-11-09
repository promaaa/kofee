import { serviceDictionary } from "akanjs/dictionary";

import type { VisionEndpoint } from "../sig";

export const dictionary = serviceDictionary(["en", "ko"])
  .endpoint<VisionEndpoint>((fn) => ({
    algorithmView: fn(["Algorithm View", "알고리즘 화면"]).desc([
      "The latest top-down board as the algorithm server read it, empty in mock mode",
      "알고리즘 서버가 읽은 최신 보드 정면 화면 (모의 모드에서는 비어 있음)",
    ]),
    setMockDirt: fn(["Set Mock Dirt", "모의 오염 설정"])
      .desc(["Mark a cell dirty or clean in the mock algorithm", "모의 알고리즘에서 칸을 더럽거나 깨끗하게 표시합니다"])
      .arg((t) => ({
        cell: t(["Cell", "칸"]).desc(["Grid cell index", "그리드 칸 번호"]),
        dirty: t(["Dirty", "오염"]).desc(["Whether the cell should read dirty", "칸을 더러움으로 표시할지 여부"]),
      })),
    setMockGlare: fn(["Set Mock Glare", "모의 반사광 설정"])
      .desc(["Mark a cell unreadable in the mock algorithm", "모의 알고리즘에서 칸을 판별 불가로 표시합니다"])
      .arg((t) => ({
        cell: t(["Cell", "칸"]).desc(["Grid cell index", "그리드 칸 번호"]),
        glare: t(["Glare", "반사광"]).desc(["Whether the cell should read unknown", "칸을 판별 불가로 표시할지 여부"]),
      })),
  }))
  .error({})
  .translate({
    mockTitle: ["Mock vision", "모의 비전"],
    mockSubtitle: [
      "Mark where ink is until the algorithm server is connected",
      "알고리즘 서버를 연결하기 전까지 잉크 위치를 표시하세요",
    ],
    mockInk: ["Ink", "잉크"],
    mockGlare: ["Glare", "반사광"],
    mockHint: [
      "Tap a cell to mark it. The eraser's Done never cleans a cell here: tap it again once it is really clean.",
      "칸을 눌러 표시하세요. 지우개의 완료는 칸을 지우지 않습니다. 실제로 깨끗해지면 다시 누르세요.",
    ],
    mockReset: ["Reset board", "보드 초기화"],
  });
