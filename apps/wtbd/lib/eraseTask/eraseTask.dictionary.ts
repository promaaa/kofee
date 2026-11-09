import { modelDictionary } from "akanjs/dictionary";

import type { EraseTask, EraseTaskInsight } from "./eraseTask.constant";
import type { EraseTaskFilter } from "./eraseTask.document";
import type { EraseTaskEndpoint, EraseTaskSlice } from "./eraseTask.signal";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Erase Task", "Erase Task"]).desc(["Enter erase task.", "Erase Task 값을 입력합니다."]))
  .model<EraseTask>((t) => ({
    name: t(["Name", "이름"]).desc(["Name", "이름"]),
  }))
  .insight<EraseTaskInsight>((t) => ({}))
  .query<EraseTaskFilter>((fn) => ({}))
  .sort<EraseTaskFilter>((t) => ({}))
  .slice<EraseTaskSlice>((fn) => ({
    inPublic: fn(["EraseTask In Public", "EraseTask 공개"]).arg((t) => ({})),
  }))
  .endpoint<EraseTaskEndpoint>((fn) => ({}))
  .error({})
  .translate({});
