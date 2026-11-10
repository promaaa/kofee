import { surfaceRecipe } from "@apps/nunchi/ui";
import { page, usePage } from "akanjs/client";
import { Link, System } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();
  const roles = [
    { href: "/monitor", title: l("board.openMonitor"), desc: l("board.openMonitorDesc") },
    { href: "/eraser", title: l("board.openEraser"), desc: l("board.openEraserDesc") },
    { href: "/human", title: l("maintenance.humanTitle"), desc: l("maintenance.humanSubtitle") },
    { href: "/mock", title: l("vision.mockTitle"), desc: l("vision.mockSubtitle") },
  ];
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-5 py-8">
      <nav className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black text-3xl">{l("board.homeTitle")}</h1>
          <p className="text-muted-foreground text-sm">{l("board.homeSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <System.ThemeToggle themes={["light", "dark"]} />
          <System.SelectLanguage languages={["en", "ko"]} />
        </div>
      </nav>
      <div className="flex flex-col gap-3">
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            className={surfaceRecipe({}, "flex items-center justify-between gap-4 transition hover:border-primary")}
          >
            <div>
              <div className="font-bold text-lg">{role.title}</div>
              <div className="text-muted-foreground text-sm">{role.desc}</div>
            </div>
            <span className="text-muted-foreground text-xl">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
});
