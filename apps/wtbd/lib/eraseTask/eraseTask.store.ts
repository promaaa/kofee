import { store } from "akanjs/store";

import { fetch, sig } from "../useClient";

export class EraseTaskStore extends store(sig.eraseTask, () => ({})) {
  async reportErased(eraseTaskId: string) {
    await fetch.reportErased(eraseTaskId);
  }

  async giveUpEraseTask(eraseTaskId: string) {
    await fetch.giveUpEraseTask(eraseTaskId);
  }
}
