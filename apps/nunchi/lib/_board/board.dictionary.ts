import { serviceDictionary } from "akanjs/dictionary";

import type { BoardEndpoint } from "../sig";

export const dictionary = serviceDictionary(["en", "ko"])
  .endpoint<BoardEndpoint>((fn) => ({
    submitFrame: fn(["Submit Frame", "프레임 전송"])
      .desc(["Analyse one camera frame of the board", "보드 카메라 프레임 한 장을 분석합니다"])
      .arg((t) => ({
        frame: t(["Frame", "프레임"]).desc(["JPEG bytes from the monitor camera", "모니터 카메라의 JPEG 바이트"]),
      })),
    resetBoard: fn(["Reset Board", "보드 초기화"]).desc([
      "Forget cell readings and mock dirt, and cancel open tasks",
      "칸 판독 기록과 모의 오염을 지우고 진행 중인 작업을 취소합니다",
    ]),
    boardFrame: fn(["Live Frame", "실시간 프레임"]).desc([
      "The latest camera frame of the board",
      "보드의 최신 카메라 프레임",
    ]),
    boardScanned: fn(["Board Scanned", "보드 스캔됨"]).desc(["Each analysis result of the board", "보드의 분석 결과"]),
  }))
  .error({})
  .translate({
    homeTitle: ["NUNCHI", "눈치"],
    homeSubtitle: ["One whiteboard, one eraser", "화이트보드 하나, 지우개 하나"],
    openEraser: ["Eraser", "지우개"],
    openEraserDesc: ["The phone screen the eraser carries", "지우개 역할이 들고 다니는 휴대폰 화면"],
    openMonitor: ["Monitor", "모니터"],
    openMonitorDesc: ["The camera that watches the board", "보드를 지켜보는 카메라"],
    monitorTitle: ["Monitor", "모니터"],
    cameraStart: ["Start camera", "카메라 시작"],
    cameraStop: ["Stop camera", "카메라 중지"],
    cameraIdle: [
      "Point the camera at the board so all four L marks are in view",
      "네 개의 L 마크가 모두 보이도록 카메라를 보드에 맞추세요",
    ],
    cameraInsecure: [
      "The camera opens only over HTTPS or on localhost",
      "카메라는 HTTPS 또는 localhost에서만 열립니다",
    ],
    cameraDenied: ["Camera permission was denied", "카메라 권한이 거부되었습니다"],
    cameraUnavailable: ["No camera could be opened", "카메라를 열 수 없습니다"],
    waitingFrame: ["Waiting for the first scan…", "첫 스캔을 기다리는 중…"],
    boardFound: ["Board found", "보드 인식됨"],
    boardNotFound: ["Board not found", "보드를 찾지 못함"],
    visionMock: ["VISION: MOCK", "비전: 모의"],
    visionRemote: ["VISION: SERVER", "비전: 서버"],
    mockCornersHint: [
      "Mock vision: the dashed outline is a fixed rectangle, not a detection",
      "모의 비전: 점선 윤곽은 감지 결과가 아닌 고정된 사각형입니다",
    ],
    dirtyCount: ["dirty", "오염"],
    eraseNow: ["Eraser target", "지울 칸"],
    algorithmViewTitle: ["Algorithm view", "알고리즘 화면"],
    algorithmViewHint: [
      "The board straightened by the algorithm server: magenta is ink it found, orange cells are dirty",
      "알고리즘 서버가 펼친 보드: 자홍색은 찾은 잉크, 주황색 칸은 오염된 칸입니다",
    ],
    algorithmViewStale: ["Last view with the board in sight", "보드가 보였던 마지막 화면"],
  });
