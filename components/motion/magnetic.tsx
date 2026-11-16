"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { gsap, useGsapScope } from "@/components/motion/use-gsap";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** Seberapa jauh elemen ikut tertarik, sebagai pecahan jarak kursor dari pusatnya. */
  strength?: number;
};

/**
 * Elemen sedikit tertarik ke arah kursor selama kursor berada di atasnya, lalu
 * kembali dengan pantulan pelan saat ditinggal.
 *
 * Dipakai untuk CTA utama saja. Kalau semua tombol menempel ke kursor, tidak
 * ada lagi yang terasa istimewa. Perangkat sentuh dilewati.
 */
export function Magnetic({ children, className, strength = 0.28 }: MagneticProps) {
  const ref = useGsapScope<HTMLSpanElement>(
    ({ root, reduced }) => {
      if (reduced || !window.matchMedia("(hover: hover)").matches) return;

      const moveX = gsap.quickTo(root, "x", { duration: 0.6, ease: "power3" });
      const moveY = gsap.quickTo(root, "y", { duration: 0.6, ease: "power3" });

      function onMove(event: PointerEvent) {
        const bounds = root.getBoundingClientRect();
        moveX((event.clientX - bounds.left - bounds.width / 2) * strength);
        moveY((event.clientY - bounds.top - bounds.height / 2) * strength);
      }
      function onLeave() {
        gsap.to(root, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
      }

      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerleave", onLeave);
      return () => {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", onLeave);
      };
    },
    [strength],
  );

  return (
    <span ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </span>
  );
}
