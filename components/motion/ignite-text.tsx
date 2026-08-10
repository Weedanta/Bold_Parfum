"use client";

import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { gsap, SplitText, useGsapScope } from "@/components/motion/use-gsap";

type IgniteTextProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
  /** Opasitas kata yang belum terbaca. */
  from?: number;
  /** Jarak antar kata pada timeline. Makin kecil, makin banyak kata menyala bersamaan. */
  spread?: number;
  start?: string;
  end?: string;
};

/**
 * Kata mendapat tintanya satu per satu, mengikuti posisi scroll.
 *
 * Diadaptasi dari teknik Text Scroll Read milik youcefbnm di 21st.dev. Versi
 * aslinya memakai `background-clip: text` dengan gradien dua stop yang digeser
 * lewat motion/react. Dua hal diubah di sini:
 *
 *  1. Digerakkan GSAP ScrollTrigger, bukan motion/react, supaya bundel tetap
 *     punya satu pustaka animasi saja (alasan yang sama dengan Spotlight).
 *  2. Per kata, bukan satu gradien untuk seluruh blok. Gradien horizontal
 *     menyapu semua baris sekaligus, jadi pada paragraf yang membungkus, baris
 *     ketiga sudah menyala sebelum baris pertama selesai. Memecah per kata
 *     membuat urutan menyala sama dengan urutan membaca.
 *
 * Dipakai hemat: satu blok per halaman. Kalau semua teks menyala, tidak ada
 * yang terasa istimewa.
 */
export function IgniteText({
  children,
  className,
  as: Tag = "p",
  id,
  from = 0.16,
  spread = 0.55,
  start = "top 85%",
  end = "bottom 50%",
}: IgniteTextProps) {
  const ref = useGsapScope<HTMLParagraphElement>(
    ({ root, reduced }) => {
      // Tanpa scrub, teks tampil penuh apa adanya. Gerakan yang terikat scroll
      // justru yang paling mengganggu saat pengguna minta gerakan dikurangi.
      if (reduced) return;

      SplitText.create(root, {
        type: "words",
        aria: "auto",
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.words,
            { opacity: from },
            {
              opacity: 1,
              duration: 1,
              stagger: spread,
              // Linear: posisi scroll yang menentukan iramanya, bukan easing.
              ease: "none",
              scrollTrigger: { trigger: root, start, end, scrub: true },
            },
          ),
      });
    },
    [from, spread, start, end],
  );

  return (
    <Tag ref={ref} id={id} className={cn(className)}>
      {children}
    </Tag>
  );
}
