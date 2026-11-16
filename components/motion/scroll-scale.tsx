"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { gsap, useGsapScope } from "@/components/motion/use-gsap";

type ScrollScaleProps = {
  children: ReactNode;
  className?: string;
  /** Seberapa sempit bukaan bingkai saat elemen baru masuk dari bawah layar. */
  from?: number;
  /** Redupkan elemen saat ia meninggalkan layar di atas. */
  dimOnExit?: boolean;
};

/**
 * Bingkai gambar yang membuka mengikuti scroll, lalu meredup saat ditinggal.
 *
 * Bingkainya dibuka lewat clip-path, sementara isinya turun skala dari sedikit
 * terlalu besar ke ukuran asli. Tepi bingkai tidak pernah keluar dari grid,
 * jadi tetangganya tidak tertabrak; yang terasa mendekat hanya gambarnya,
 * seperti lensa yang sedang mencari fokus.
 */
export function ScrollScale({
  children,
  className,
  from = 0.82,
  dimOnExit = true,
}: ScrollScaleProps) {
  const ref = useGsapScope<HTMLDivElement>(
    ({ root, reduced }) => {
      if (reduced) return;
      const inner = root.firstElementChild as HTMLElement | null;
      const inset = ((1 - from) / 2) * 100;

      gsap.fromTo(
        root,
        { clipPath: `inset(${inset}% ${inset}% ${inset}% ${inset}%)` },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "top 30%", scrub: true },
        },
      );

      if (inner) {
        gsap.fromTo(
          inner,
          { scale: 1.16 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }

      if (dimOnExit) {
        gsap.to(root, {
          opacity: 0.25,
          ease: "none",
          scrollTrigger: { trigger: root, start: "bottom 45%", end: "bottom top", scrub: true },
        });
      }
    },
    [from, dimOnExit],
  );

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}
