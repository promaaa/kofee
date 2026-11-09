import { Board, fetch } from "@apps/wtbd/client";
import { page, usePage } from "akanjs/client";
import { Load, System } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();
  const { boardInitInPublic } = fetch.initBoardInPublic();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-5 py-8 text-foreground">
      <nav className="flex items-center justify-between gap-4">
        <h1 className="font-black text-3xl tracking-tight">{l("board.homeTitle")}</h1>
        <div className="flex items-center gap-2">
          <System.ThemeToggle themes={["light", "dark"]} />
          <System.SelectLanguage languages={["en", "ko"]} />
        </div>
      </nav>
      <section className="flex flex-col gap-3">
        <Board.Zone.Card className="flex flex-col gap-3" init={boardInitInPublic} />
      </section>
      <section className="flex flex-col gap-3 rounded-box bg-card p-5">
        <h2 className="font-bold text-xl">{l("board.homeNewBoard")}</h2>
        <Load.Edit slice={fetch.slice.boardInPublic} edit={{}} type="form" onSubmit="/">
          <Board.Template.General />
        </Load.Edit>
      </section>
    </main>
  );
});
