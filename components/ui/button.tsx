import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xs font-medium whitespace-nowrap transition-[background-color,color,box-shadow,border-color] duration-300 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* CTA utama, glow emas saat hover, sesuai PRD bagian 6 */
        primary:
          "bg-gold-bright text-obsidian hover:bg-gold shadow-[0_0_0_0_rgba(212,175,55,0)] hover:shadow-[0_0_32px_-6px_rgba(212,175,55,0.55)]",
        outline:
          "border border-line bg-transparent text-ink hover:border-gold hover:text-gold",
        ghost: "bg-transparent text-muted hover:bg-surface hover:text-ink",
        link: "h-auto p-0 text-gold underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm [&_svg]:size-4",
        md: "h-11 px-6 text-sm [&_svg]:size-4",
        lg: "h-14 px-8 text-base [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
