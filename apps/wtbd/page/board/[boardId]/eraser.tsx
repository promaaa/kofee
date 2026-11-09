import { EraseTask, fetch } from "@apps/wtbd/client";
import { page } from "akanjs/client";

export default page()
  .param("boardId", String)
  .render(({ boardId }) => {
    const { boardView } = fetch.viewBoard(boardId);
    const { eraseTaskInitInBoard } = fetch.initEraseTaskInBoard(boardId);
    return <EraseTask.Zone.Eraser boardView={boardView} init={eraseTaskInitInBoard} />;
  });
