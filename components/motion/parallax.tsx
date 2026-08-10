"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { gsap, useGsapScope } from "@/components/motion/use-gsap";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /**
   * Total jarak geser dalam piksel sepanjang elemen melintasi layar.
   *
   * Positif  = tertinggal dari scroll, terbaca lebih jauh (latar).
   * Negatif  = mendahului scroll, terbaca lebih dekat (depan).
   *
   * Angka kecil saja. Di atas ~80px gerakannya berhenti terbaca sebagai
   * kedalaman dan mulai terbaca sebagai elemen yang melorot.
   */
  distance?: number;
};

/**
 * Kedalaman lewat beda laju: elemen bergerak sedikit lebih lambat atau lebih
 * cepat daripada halaman yang menggulung.
 *
 * Hanya transform yang dianimasikan, tidak pernah top/margin/height, jadi tidak
 * ada layout yang dihitung ulang saat scroll dan tidak ada pergeseran tata letak.
 *
 * Rentangnya sengaja diikat pada perjalanan elemen itu sendiri, dari saat
 * puncaknya menyentuh dasar layar sampai dasarnya melewati puncak layar. Dengan
 * begitu tiap elemen menyelesaikan geserannya tepat selama ia terlihat, berapa
 * pun panjang halamannya.
 */
export function Parallax({ children, className, distance = 48 }: ParallaxProps) {
  const ref = useGsapScope<HTMLDivElement>(
    ({ root, reduced }) => {
      // Paralaks adalah gerakan yang terikat scroll, jenis yang paling memicu
      // rasa mual. Saat pengguna minta gerakan dikurangi, elemen diam di tempat.
      if (reduced) return;

      gsap.fromTo(
        root,
        { y: -distance / 2 },
        {
          y: distance / 2,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    [distance],
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
