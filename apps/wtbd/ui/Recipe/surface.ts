import { recipe, tv } from "akanjs/ui";

export const surfaceRecipe = recipe(
  tv({
    base: "rounded-box border border-border bg-card text-card-foreground",
    variants: {
      padding: { none: "", sm: "p-3", md: "p-5", lg: "p-6" },
    },
    defaultVariants: { padding: "md" },
  }),
);
export type SurfaceVariants = NonNullable<Parameters<typeof surfaceRecipe>[0]>;
