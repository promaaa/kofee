import { modelDictionary } from "akanjs/dictionary";

import type {
  EraseFailReason,
  EraseFeedback,
  EraseTask,
  EraseTaskInsight,
  EraseTaskStatus,
} from "./eraseTask.constant";
import type { EraseTaskFilter } from "./eraseTask.document";
import type { EraseTaskEndpoint, EraseTaskSlice } from "./eraseTask.signal";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) =>
    t(["Erase Task", "지우기 작업"]).desc(["One grid cell the eraser must clean", "지우개가 지워야 할 그리드 한 칸"]),
  )
  .model<EraseTask>((t) => ({
    boardId: t(["Board", "보드"]).desc(["The board the cell is on", "칸이 속한 보드"]),
    cell: t(["Cell", "칸"]).desc(["Grid cell index, row * cols + col", "그리드 칸 번호 (행 * 열 수 + 열)"]),
    target: t(["Target", "목표 영역"]).desc(["The area to erase", "지울 영역"]),
    status: t(["Status", "상태"]).desc(["Where the task is in its lifecycle", "작업 진행 단계"]),
    feedback: t(["Feedback", "피드백"]).desc(["The last verdict sent to the eraser", "지우개에 보낸 마지막 판정"]),
    failReason: t(["Fail Reason", "실패 사유"]).desc(["Why the task failed", "작업이 실패한 이유"]),
    attempt: t(["Attempt", "시도"]).desc(["How many times the task was dispatched", "작업이 배정된 횟수"]),
    maxAttempts: t(["Max Attempts", "최대 시도"]).desc([
      "Dispatches allowed before failing",
      "실패 전 허용되는 배정 횟수",
    ]),
    dispatchedAt: t(["Dispatched At", "배정 시각"]).desc([
      "When the current attempt started",
      "현재 시도가 시작된 시각",
    ]),
    reportedAt: t(["Reported At", "완료 보고 시각"]).desc(["When the eraser tapped Done", "지우개가 완료를 누른 시각"]),
    resolvedAt: t(["Resolved At", "종료 시각"]).desc(["When the task ended", "작업이 끝난 시각"]),
  }))
  .insight<EraseTaskInsight>((t) => ({}))
  .query<EraseTaskFilter>((fn) => ({
    inBoard: fn(["In Board", "보드별"]).arg((t) => ({
      boardId: t(["Board", "보드"]),
    })),
    openInBoard: fn(["Open In Board", "보드의 진행 중 작업"]).arg((t) => ({
      boardId: t(["Board", "보드"]),
    })),
    failedInBoardSince: fn(["Failed In Board Since", "보드의 최근 실패 작업"]).arg((t) => ({
      boardId: t(["Board", "보드"]),
      since: t(["Since", "기준 시각"]),
    })),
    dispatchedBefore: fn(["Dispatched Before", "이전에 배정된 작업"]).arg((t) => ({
      before: t(["Before", "기준 시각"]),
    })),
  }))
  .sort<EraseTaskFilter>((t) => ({
    oldest: t(["Oldest First", "오래된 순"]),
    newest: t(["Newest First", "최신순"]),
  }))
  .enum<EraseTaskStatus>("eraseTaskStatus", (t) => ({
    pending: t(["Pending", "대기"]).desc(["Waiting for the eraser", "지우개를 기다리는 중"]),
    dispatched: t(["Dispatched", "배정됨"]).desc([
      "The eraser is on its way or erasing",
      "지우개가 이동 중이거나 지우는 중",
    ]),
    verifying: t(["Verifying", "확인 중"]).desc(["The camera is checking the cell", "카메라가 칸을 확인하는 중"]),
    succeeded: t(["Succeeded", "성공"]).desc(["The cell reads clean", "칸이 깨끗하게 확인됨"]),
    failed: t(["Failed", "실패"]).desc(["The eraser gave up or ran out of attempts", "포기했거나 시도 횟수를 모두 씀"]),
    canceled: t(["Canceled", "취소됨"]).desc(["The cell became clean on its own", "칸이 저절로 깨끗해짐"]),
  }))
  .enum<EraseFeedback>("eraseFeedback", (t) => ({
    success: t(["Success", "성공"]).desc(["The cell is clean", "칸이 깨끗합니다"]),
    retry: t(["Retry", "다시 시도"]).desc(["The cell is still dirty, erase again", "아직 더럽습니다. 다시 지우세요"]),
    failed: t(["Failed", "실패"]).desc(["Giving up on this cell", "이 칸은 포기합니다"]),
  }))
  .enum<EraseFailReason>("eraseFailReason", (t) => ({
    stillDirty: t(["Still Dirty", "여전히 더러움"]).desc(["Dirty after every attempt", "모든 시도 후에도 더러움"]),
    unreachable: t(["Unreachable", "도달 불가"]).desc([
      "The eraser could not reach the cell",
      "지우개가 칸에 닿지 못함",
    ]),
    timeout: t(["Timed Out", "시간 초과"]).desc(["No report within the time limit", "제한 시간 안에 보고 없음"]),
  }))
  .slice<EraseTaskSlice>((fn) => ({
    inBoard: fn(["Tasks In Board", "보드의 작업"])
      .desc(["Every erase task of a board, kept live", "보드의 모든 지우기 작업 (실시간 갱신)"])
      .arg((t) => ({
        boardId: t(["Board", "보드"]).desc(["The board to list tasks for", "작업을 볼 보드"]),
      })),
  }))
  .endpoint<EraseTaskEndpoint>((fn) => ({
    reportErased: fn(["Report Erased", "지우기 완료 보고"])
      .desc([
        "The eraser finished and stepped away; the camera checks next",
        "지우기를 마치고 비켜섰습니다. 카메라가 확인합니다",
      ])
      .arg((t) => ({
        eraseTaskId: t(["Erase Task", "지우기 작업"]).desc(["The dispatched task", "배정된 작업"]),
      })),
    giveUpEraseTask: fn(["Can't Reach", "도달 불가"])
      .desc(["The eraser cannot reach the cell", "지우개가 칸에 닿을 수 없습니다"])
      .arg((t) => ({
        eraseTaskId: t(["Erase Task", "지우기 작업"]).desc(["The dispatched task", "배정된 작업"]),
      })),
    eraseFeedback: fn(["Erase Feedback", "지우기 피드백"])
      .desc(["Each verdict sent to a board's eraser", "보드의 지우개에 보내는 판정"])
      .arg((t) => ({
        boardId: t(["Board", "보드"]).desc(["The board to listen to", "들을 보드"]),
      })),
  }))
  .error({
    notPending: ["Only a pending task can be dispatched or canceled", "대기 중인 작업만 배정하거나 취소할 수 있습니다"],
    notDispatched: ["This task is not waiting for the eraser", "이 작업은 지우개를 기다리는 중이 아닙니다"],
    notVerifiable: ["This task cannot be judged yet", "이 작업은 아직 판정할 수 없습니다"],
  })
  .translate({
    eraserStartShift: ["Start shift", "작업 시작"],
    eraserReady: ["Ready", "준비 완료"],
    eraserQueued: ["Queued", "대기"],
    eraserWaiting: ["Waiting for ink…", "지울 곳을 기다리는 중…"],
    eraserWaitingHint: [
      "Keep this screen open. A job appears here when the camera sees ink.",
      "화면을 켜 두세요. 카메라가 잉크를 발견하면 작업이 나타납니다.",
    ],
    eraserFromLeft: ["from left", "왼쪽에서"],
    eraserFromTop: ["from top", "위에서"],
    eraserEraseThenDone: ["Erase this cell, step away, then tap Done", "이 칸을 지우고 비켜선 뒤 완료를 누르세요"],
    eraserChecking: ["Checking with the camera…", "카메라로 확인하는 중…"],
    eraserDone: ["Done", "완료"],
    eraserCantReach: ["Can't reach", "닿을 수 없음"],
  });
