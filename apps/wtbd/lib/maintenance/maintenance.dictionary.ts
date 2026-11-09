import { modelDictionary } from "akanjs/dictionary";

import type {
  Consumable,
  Maintenance,
  MaintenanceCause,
  MaintenanceInsight,
  MaintenanceStatus,
} from "./maintenance.constant";
import type { MaintenanceFilter } from "./maintenance.document";
import type { MaintenanceEndpoint, MaintenanceSlice } from "./maintenance.signal";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Maintenance", "유지보수"]).desc(["A consumable a human must replace", "사람이 교체해야 하는 소모품"]))
  .model<Maintenance>((t) => ({
    consumable: t(["Consumable", "소모품"]).desc(["What to replace", "교체할 소모품"]),
    cause: t(["Cause", "원인"]).desc(["Why a replacement was asked for", "교체를 요청한 이유"]),
    percent: t(["Left", "잔량"]).desc(["Percent of its life left when asked for", "요청 시점의 남은 수명 비율"]),
    status: t(["Status", "상태"]).desc(["Whether a human has replaced it", "사람이 교체했는지 여부"]),
    doneAt: t(["Replaced At", "교체 시각"]).desc(["When a human replaced it", "사람이 교체한 시각"]),
  }))
  .insight<MaintenanceInsight>((t) => ({}))
  .query<MaintenanceFilter>((fn) => ({
    openOf: fn(["Open Of", "진행 중 요청"]).arg((t) => ({
      consumable: t(["Consumable", "소모품"]),
    })),
    doneOf: fn(["Done Of", "완료된 요청"]).arg((t) => ({
      consumable: t(["Consumable", "소모품"]),
    })),
  }))
  .sort<MaintenanceFilter>((t) => ({
    newest: t(["Newest First", "최신순"]),
    latestDone: t(["Latest Replacement First", "최근 교체순"]),
  }))
  .enum<Consumable>("consumable", (t) => ({
    marker: t(["Marker", "마커"]).desc(["The whiteboard marker", "화이트보드 마커"]),
    eraser: t(["Eraser Pad", "지우개 패드"]).desc(["The eraser's felt pad", "지우개의 펠트 패드"]),
  }))
  .enum<MaintenanceCause>("maintenanceCause", (t) => ({
    usage: t(["Running Low", "잔량 부족"]).desc([
      "Its level fell to the request threshold",
      "잔량이 요청 기준까지 떨어졌습니다",
    ]),
    stillDirty: t(["Not Cleaning", "지워지지 않음"]).desc([
      "The camera saw a cell stay dirty after every attempt",
      "카메라가 모든 시도 후에도 칸이 더러운 것을 확인했습니다",
    ]),
    reported: t(["Reported", "신고됨"]).desc(["A person reported it", "사람이 신고했습니다"]),
  }))
  .enum<MaintenanceStatus>("maintenanceStatus", (t) => ({
    open: t(["Needs Replacing", "교체 필요"]).desc(["Waiting for a human", "사람을 기다리는 중"]),
    done: t(["Replaced", "교체됨"]).desc(["A human replaced it", "사람이 교체했습니다"]),
  }))
  .slice<MaintenanceSlice>((fn) => ({
    inPublic: fn(["Maintenance Log", "유지보수 기록"]).desc([
      "Every replacement request, kept live",
      "모든 교체 요청 (실시간 갱신)",
    ]),
  }))
  .endpoint<MaintenanceEndpoint>((fn) => ({
    consumableLevels: fn(["Consumable Levels", "소모품 잔량"]).desc([
      "How much of the marker and the eraser pad is left",
      "마커와 지우개 패드의 남은 양",
    ]),
    requestMaintenance: fn(["Report Consumable", "소모품 신고"])
      .desc(["Ask a human to replace a consumable", "사람에게 소모품 교체를 요청합니다"])
      .arg((t) => ({
        consumable: t(["Consumable", "소모품"]).desc(["What needs replacing", "교체가 필요한 소모품"]),
      })),
    completeMaintenance: fn(["Mark Replaced", "교체 완료"])
      .desc(["A human replaced the consumable", "사람이 소모품을 교체했습니다"])
      .arg((t) => ({
        maintenanceId: t(["Request", "요청"]).desc(["The open request", "진행 중인 요청"]),
      })),
    consumableLevelsChanged: fn(["Consumable Levels Changed", "소모품 잔량 변경"]).desc([
      "The levels after each scan and each replacement",
      "스캔과 교체 후의 소모품 잔량",
    ]),
  }))
  .error({
    notOpen: ["This request is already done", "이미 완료된 요청입니다"],
  })
  .translate({
    humanTitle: ["Human", "사람"],
    humanSubtitle: ["Replace what the OS asks for", "OS가 요청하는 소모품을 교체하세요"],
    openRequests: ["Needs a human", "사람이 필요한 일"],
    noOpenRequests: ["Nothing to replace", "교체할 것이 없습니다"],
    history: ["Replaced", "교체 기록"],
    report: ["Report", "신고"],
    reportMarker: ["Marker is dry", "마커가 말랐어요"],
    reportEraser: ["Eraser is worn", "지우개가 닳았어요"],
    markReplaced: ["Replaced", "교체 완료"],
    levels: ["Supplies", "소모품"],
    percentLeft: ["left", "남음"],
    usedMarker: ["cells written", "칸 작성"],
    usedEraser: ["erase passes", "회 지움"],
    requestAt: ["A human is asked at", "교체 요청 기준"],
    eraserBlocked: ["Eraser pad needs replacing", "지우개 패드 교체 필요"],
    eraserBlockedHint: ["A human has been asked to swap it", "사람에게 교체를 요청했습니다"],
  });
