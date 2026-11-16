"use client";

import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { gsap, SplitText, useGsapScope } from "@/components/motion/use-gsap";

type CharRevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
  delay?: number;
  /** "load" berjalan sekali saat halaman terbuka, "scroll" saat masuk layar. */
  trigger?: "load" | "scroll";
};

/**
 * Huruf naik satu per satu dari balik garis dasar, sedikit miring lalu tegak.
 *
 * Lebih teatrikal dari HeadingReveal, jadi jatahnya satu atau dua kali per
 * halaman: judul pembuka dan pernyataan penutup. Judul section biasa tetap
 * memakai HeadingReveal yang naik per baris.
 */
export function CharReveal({
  children,
  className,
  as: Tag = "h2",
  id,
  delay = 0,
  trigger = "scroll",
}: CharRevealProps) {
  const ref = useGsapScope<HTMLHeadingElement>(
    ({ root, reduced }) => {
      if (reduced) return;

      SplitText.create(root, {
        type: "lines,words,chars",
        mask: "lines",
        aria: "auto",
        autoSplit: true,
        onSplit: (self) => {
          gsap.set(self.lines, { paddingBottom: "0.14em" });
          gsap.set(self.masks, { marginBottom: "-0.14em" });

          return gsap.from(self.chars, {
            yPercent: 120,
            rotate: 6,
            duration: 1.1,
            delay,
            stagger: 0.018,
            ease: "expo.out",
            scrollTrigger:
              trigger === "scroll" ? { trigger: root, start: "top 85%", once: true } : undefined,
          });
        },
      });
    },
    [delay, trigger],
  );

  return (
    <Tag ref={ref} id={id} className={cn(className)}>
      {children}
    </Tag>
  );
}
