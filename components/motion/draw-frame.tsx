"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { gsap, useGsapScope } from "@/components/motion/use-gsap";

type DrawFrameProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Empat sisi bingkai, digambar berurutan searah jarum jam dari sudut kiri atas.
 *
 * Tiap sisi adalah garis setebal 1px yang diskalakan dari 0 ke 1 pada sumbunya
 * sendiri, dengan titik tumpu diatur supaya ujung sisi sebelumnya menjadi
 * pangkal sisi berikutnya. Hasilnya satu garis yang seolah berjalan mengelilingi
 * kotak, bukan empat garis yang tumbuh sendiri-sendiri.
 *
 * Kenapa bukan <rect> SVG dengan strokeDasharray seperti Kurva Sillage: kotak
 * ini lebarnya mengikuti kontainer, jadi SVG-nya perlu preserveAspectRatio
 * "none". Dengan begitu stroke yang persis berada di tepi viewBox terpotong
 * separuh oleh batas SVG-nya sendiri dan garisnya praktis hilang. Transform CSS
 * tidak punya masalah itu dan tetap tajam di semua lebar layar.
 */
const EDGES = [
  { key: "top", className: "top-0 right-0 left-0 h-px", axis: "scaleX", origin: "left center" },
  { key: "right", className: "top-0 right-0 bottom-0 w-px", axis: "scaleY", origin: "center top" },
  { key: "bottom", className: "right-0 bottom-0 left-0 h-px", axis: "scaleX", origin: "right center" },
  { key: "left", className: "top-0 bottom-0 left-0 w-px", axis: "scaleY", origin: "center bottom" },
] as const;

export function DrawFrame({ children, className, id }: DrawFrameProps) {
  const ref = useGsapScope<HTMLDivElement>(({ root, reduced }) => {
    const edges = root.querySelectorAll<HTMLElement>("[data-edge]");
    if (edges.length === 0) return;

    // Tanpa animasi, bingkai tetap utuh. Kotaknya tidak boleh hilang hanya
    // karena pengguna meminta gerakan dikurangi.
    if (reduced) return;

    const timeline = gsap.timeline({
      defaults: { duration: 0.42, ease: "power2.inOut" },
      scrollTrigger: { trigger: root, start: "top 82%", once: true },
    });

    EDGES.forEach((edge, index) => {
      timeline.fromTo(
        edges[index],
        { [edge.axis]: 0 },
        { [edge.axis]: 1 },
        // Sedikit bertumpuk supaya sudutnya terasa berbelok, bukan berhenti.
        index === 0 ? 0 : "-=0.08",
      );
    });
  }, []);

  return (
    <div ref={ref} id={id} className={cn("relative", className)}>
      {EDGES.map((edge) => (
        <span
          key={edge.key}
          data-edge
          aria-hidden="true"
          className={cn("pointer-events-none absolute bg-line", edge.className)}
          style={{ transformOrigin: edge.origin }}
        />
      ))}
      {children}
    </div>
  );
}
