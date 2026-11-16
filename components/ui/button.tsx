import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Isi tombol naik dari bawah saat disorot, lewat pseudo-elemen `before`.
 *
 * Yang dianimasikan hanya transform dari satu lapisan, jadi warnanya berganti
 * seperti tirai yang ditarik, bukan memudar. Teks duduk di atas lapisan itu
 * karena tombolnya `isolate` dan lapisannya `-z-10`.
 */
const fill =
  "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:translate-y-[102%] before:transition-transform before:duration-700 before:ease-[var(--ease-out-soft)] hover:before:translate-y-0 focus-visible:before:translate-y-0";

const buttonVariants = cva(
  "relative isolate inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-medium tracking-[-0.005em] whitespace-nowrap transition-[color,border-color] duration-500 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-500 hover:[&_svg]:translate-x-0.5",
  {
    variants: {
      variant: {
        primary: cn("bg-gold-bright text-obsidian before:bg-ink", fill),
        outline: cn(
          "border border-ink/25 bg-transparent text-ink before:bg-ink hover:border-ink hover:text-obsidian",
          fill,
        ),
        ghost: "bg-transparent text-muted hover:bg-surface hover:text-ink",
        link: "link-sweep rounded-none pb-0.5 text-ink hover:text-gold-bright",
      },
      size: {
        sm: "h-9 px-4 text-sm [&_svg]:size-4",
        md: "h-11 px-6 text-sm [&_svg]:size-4",
        lg: "h-14 px-8 text-[0.95rem] [&_svg]:size-4",
      },
    },
    // Tautan teks tidak punya tinggi dan bantalan tombol, berapa pun ukurannya.
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
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
