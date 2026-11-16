import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Huruf biasa, bukan mono kapital: badge memberi keterangan, bukan papan nama. */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border text-caption whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-line bg-surface/70 text-muted",
        gold: "border-gold/35 bg-gold/8 text-gold-bright",
        solid: "border-transparent bg-gold-bright text-obsidian",
      },
      size: {
        sm: "h-6 px-2.5 text-xs",
        md: "h-8 px-3.5",
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
