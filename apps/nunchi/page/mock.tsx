import { Vision } from "@apps/nunchi/client";
import { page, usePage } from "akanjs/client";

export default page()
  .head(<title>Mock vision · NUNCHI</title>)
  .render(() => {
    const { l } = usePage();
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-5 py-8">
        <header>
          <h1 className="font-black text-3xl">{l("vision.mockTitle")}</h1>
          <p className="text-muted-foreground text-sm">{l("vision.mockSubtitle")}</p>
        </header>
        <Vision.Zone.MockPanel />
      </main>
    );
  });
