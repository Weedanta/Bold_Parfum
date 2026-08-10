import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-mono text-label tracking-label uppercase",
  {
    variants: {
      variant: {
        default: "border-line bg-surface/80 text-muted",
        gold: "border-gold/40 bg-gold/10 text-gold",
        solid: "border-transparent bg-gold-bright text-obsidian",
      },
      size: {
        sm: "h-6 px-2.5",
        md: "h-7 px-3",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
