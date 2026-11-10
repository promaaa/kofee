import { type cnst, usePage } from "@apps/nunchi/client";
import type { ModelProps } from "akanjs/client";
import { Link } from "akanjs/ui";

export const Card = ({ eraseTask, href }: ModelProps<"eraseTask", cnst.LightEraseTask>) => {
  const { l } = usePage();
  return (
    <Link href={href} className="w-full">
      <div>
        {l("eraseTask.cell")}: {eraseTask.cell} · {l(`eraseTaskStatus.${eraseTask.status}`)}
      </div>
    </Link>
  );
};
