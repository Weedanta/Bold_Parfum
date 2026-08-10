"use client";

import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { gsap, useGsapScope } from "@/components/motion/use-gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Jeda antar anak langsung, dalam detik. 0 berarti seluruh blok bergerak bersama. */
  stagger?: number;
  delay?: number;
};

/**
 * Menaikkan konten saat masuk viewport. Dipakai untuk section biasa. Momen
 * besar (hero, racikan kuis, kurva sillage) punya timeline sendiri.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  stagger = 0,
  delay = 0,
}: RevealProps) {
  const ref = useGsapScope<HTMLDivElement>(({ root, reduced }) => {
    if (reduced) return;

    const targets = stagger > 0 ? Array.from(root.children) : [root];
    if (targets.length === 0) return;

    gsap.set(targets, { opacity: 0, y: 24 });
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      delay,
      stagger,
      ease: "power3.out",
      scrollTrigger: { trigger: root, start: "top 85%", once: true },
    });
  }, [stagger, delay]);

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
