import { type cnst, usePage } from "@apps/wtbd/client";
import type { ModelProps } from "akanjs/client";
import { Link } from "akanjs/ui";

export const Card = ({ board, href }: ModelProps<"board", cnst.LightBoard>) => {
  const { l } = usePage();
  return (
    <Link href={href} className="flex w-full items-center justify-between rounded-box bg-card p-4">
      <span className="font-bold text-lg">{board.name}</span>
      <span className="text-foreground/60 text-sm">
        {board.cols}×{board.rows} · {board.widthCm}×{board.heightCm} cm · {l("board.openEraser")} →
      </span>
    </Link>
  );
};
