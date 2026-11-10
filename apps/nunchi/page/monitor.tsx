import { Board, fetch, Maintenance } from "@apps/nunchi/client";
import { page } from "akanjs/client";

export default page()
  .head(<title>Monitor · NUNCHI</title>)
  .render(() => {
    const { eraseTaskInitInPublic } = fetch.initEraseTaskInPublic();
    return (
      <Board.Zone.Monitor init={eraseTaskInitInPublic}>
        <Maintenance.Zone.Levels />
      </Board.Zone.Monitor>
    );
  });
