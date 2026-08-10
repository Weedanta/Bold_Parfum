"use client";

import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { gsap, SplitText, useGsapScope } from "@/components/motion/use-gsap";

type HeadingRevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
  /** Jeda sebelum baris pertama naik, dalam detik. */
  delay?: number;
};

/**
 * Judul naik dari balik tepi mask, satu baris demi satu baris.
 *
 * Ini tata bahasa kedatangan yang sama dengan hero (`data-hero-line`), hanya
 * digeneralisasi: hero memotong barisnya lewat markup untuk dua baris tetap,
 * sedangkan di sini SplitText yang memecah baris, sehingga judul yang jumlah
 * barisnya berubah mengikuti lebar layar tetap terpotong pada tempat yang benar.
 *
 * Kenapa satu tata bahasa untuk semua judul: gerakan yang berbeda-beda di tiap
 * section terbaca sebagai efek yang ditempel, sedangkan satu pola yang konsisten
 * terbaca sebagai keputusan.
 */
export function HeadingReveal({
  children,
  className,
  as: Tag = "h2",
  id,
  delay = 0,
}: HeadingRevealProps) {
  const ref = useGsapScope<HTMLHeadingElement>(
    ({ root, reduced }) => {
      if (reduced) return;

      SplitText.create(root, {
        type: "lines",
        // Membungkus tiap baris dengan elemen ber-overflow-hidden, jadi baris
        // benar-benar muncul dari balik tepi, bukan sekadar bergeser naik.
        mask: "lines",
        // Teks asli dipasang sebagai nama aksesibel, jadi pembaca layar tidak
        // ikut membaca pecahan per baris.
        aria: "auto",
        // Memecah ulang saat font selesai dimuat atau lebar berubah. Tanpa ini
        // baris dihitung memakai font fallback lalu salah posisi.
        autoSplit: true,
        onSplit: (self) => {
          // Fraunces punya descender panjang (g, y, j). Mask setinggi kotak baris
          // akan memotongnya, jadi tiap baris diberi ruang bawah lalu masknya
          // ditarik kembali supaya jarak antar baris tidak ikut berubah.
          gsap.set(self.lines, { paddingBottom: "0.16em" });
          gsap.set(self.masks, { marginBottom: "-0.16em" });

          // Dikembalikan supaya GSAP membatalkan tween ini sendiri saat
          // autoSplit memecah ulang barisnya.
          return gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.15,
            delay,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: { trigger: root, start: "top 88%", once: true },
          });
        },
      });
    },
    [delay],
  );

  return (
    <Tag ref={ref} id={id} className={cn(className)}>
      {children}
    </Tag>
  );
}
