"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { gsap } from "@/components/motion/use-gsap";

/**
 * Sorot lembut yang mengikuti kursor.
 *
 * Diadaptasi dari komponen Spotlight milik ibelick di 21st.dev, dengan tiga
 * perubahan:
 *  1. Pegasnya memakai gsap.quickTo, bukan framer-motion, supaya tidak menambah
 *     dependensi animasi kedua ke bundel.
 *  2. Versi aslinya melepas listener dengan fungsi arrow baru, sehingga listener
 *     tidak pernah benar-benar dilepas. Di sini tiap handler disimpan.
 *  3. Warnanya mengambil warna cairan varian, bukan abu-abu tetap, jadi tiap
 *     kartu menyala dengan warnanya sendiri.
 *
 * Induk elemen harus sudah `relative` dan `overflow-hidden`.
 */
export function Spotlight({
  className,
  size = 260,
  color,
}: {
  className?: string;
  size?: number;
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    const host = node?.parentElement;
    if (!node || !host) return;

    // Perangkat sentuh tidak punya kursor yang melayang; sorot dilewati saja.
    if (!window.matchMedia("(hover: hover)").matches) return;

    const moveX = gsap.quickTo(node, "x", { duration: 0.5, ease: "power3" });
    const moveY = gsap.quickTo(node, "y", { duration: 0.5, ease: "power3" });

    function onMove(event: PointerEvent) {
      const bounds = host!.getBoundingClientRect();
      moveX(event.clientX - bounds.left - size / 2);
      moveY(event.clientY - bounds.top - size / 2);
    }
    function onEnter() {
      gsap.to(node, { opacity: 1, duration: 0.4, ease: "power2.out" });
    }
    function onLeave() {
      gsap.to(node, { opacity: 0, duration: 0.5, ease: "power2.out" });
    }

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(node);
    };
  }, [size]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-0 rounded-full opacity-0 blur-3xl",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at center, ${color}, transparent 68%)`,
      }}
    />
  );
}
