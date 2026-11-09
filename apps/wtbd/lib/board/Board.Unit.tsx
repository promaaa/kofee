import { type cnst, usePage } from "@apps/wtbd/client";
import type { ModelProps } from "akanjs/client";
import { Link } from "akanjs/ui";

export const Card = ({ board, href }: ModelProps<"board", cnst.LightBoard>) => {
  const { l } = usePage();
  return (
    <Link href={href} className="w-full">
      <div>
        {l("board.name")}: {board.name}
      </div>
    </Link>
  );
};
