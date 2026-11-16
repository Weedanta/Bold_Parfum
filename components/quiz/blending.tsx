"use client";

import { gsap, useGsapScope } from "@/components/motion/use-gsap";

/** Durasi racikan. PRD 5.2 meminta jeda 2 detik untuk memberi rasa eksklusif. */
export const BLEND_DURATION_MS = 2000;

const DROPLETS = 9;

/**
 * Animasi "Sedang meracik profil aromamu...".
 *
 * PRD mewajibkan jeda dua detik sebelum hasil muncul, jadi jeda itu harus punya
 * isi: tetesan note berjatuhan ke satu titik dan menyatu jadi satu aroma. Ini
 * momen motion utama situs, bukan spinner.
 *
 * Di belakangnya, cahaya berwarna cairan varian pemenang perlahan memenuhi
 * ruangan. Halaman hasil dibuka dengan atmosfer warna yang sama, jadi
 * perpindahan dari kuis ke hasil terasa seperti satu tarikan napas.
 */
export function Blending({ juice }: { juice: string }) {
  const ref = useGsapScope<HTMLDivElement>(({ root, reduced }) => {
    if (reduced) return;

    const droplets = root.querySelectorAll<SVGCircleElement>("[data-droplet]");
    const ring = root.querySelector<SVGCircleElement>("[data-ring]");
    const pool = root.querySelector<SVGCircleElement>("[data-pool]");
    const bloom = root.querySelector<HTMLElement>("[data-bloom]");
    const words = root.querySelectorAll<HTMLElement>("[data-word]");
    if (!ring || !pool) return;

    const circumference = 2 * Math.PI * 54;
    gsap.set(ring, { strokeDasharray: circumference, strokeDashoffset: circumference });
    gsap.set(pool, { scale: 0, transformOrigin: "center" });

    const timeline = gsap.timeline();

    if (bloom) {
      timeline.fromTo(
        bloom,
        { scale: 0.35, opacity: 0 },
        { scale: 1, opacity: 1, duration: 2, ease: "power2.out" },
        0,
      );
    }

    droplets.forEach((droplet, index) => {
      const angle = (index / DROPLETS) * Math.PI * 2;
      gsap.set(droplet, {
        x: Math.cos(angle) * 74,
        y: Math.sin(angle) * 74,
        opacity: 0,
      });
      timeline.to(
        droplet,
        { opacity: 1, duration: 0.18, ease: "none" },
        index * 0.055,
      );
      timeline.to(
        droplet,
        { x: 0, y: 0, opacity: 0, duration: 0.85, ease: "power2.in" },
        0.2 + index * 0.055,
      );
    });

    timeline.to(ring, { strokeDashoffset: 0, duration: 1.7, ease: "power1.inOut" }, 0.1);
    timeline.to(pool, { scale: 1, duration: 0.7, ease: "power2.out" }, 1.15);

    // Kalimatnya muncul kata demi kata dari balik garis, mengikuti tetesan.
    timeline.from(
      words,
      { yPercent: 110, duration: 0.9, stagger: 0.08, ease: "expo.out" },
      0.15,
    );
  }, []);

  const sentence = ["Sedang", "meracik", "profil", "aromamu…"];

  return (
    <div ref={ref} className="relative isolate flex flex-col items-center">
      <div
        aria-hidden="true"
        data-bloom
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[110vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          backgroundImage: `radial-gradient(closest-side, ${juice}30, ${juice}0d 55%, transparent)`,
        }}
      />

      <svg viewBox="-70 -70 140 140" className="size-40 sm:size-48" aria-hidden="true">
        <circle r="54" fill="none" stroke="var(--color-line)" strokeWidth="1" />
        <circle
          data-ring
          r="54"
          fill="none"
          stroke={juice}
          strokeOpacity="0.9"
          strokeWidth="1"
          strokeLinecap="round"
          transform="rotate(-90)"
        />
        <circle data-pool r="16" fill={juice} fillOpacity="0.4" />
        {Array.from({ length: DROPLETS }, (_, index) => (
          <circle key={index} data-droplet r="2.5" fill={juice} />
        ))}
      </svg>

      <p
        role="status"
        className="mt-12 font-display text-title font-light text-balance"
      >
        {sentence.map((word, index) => (
          <span key={word} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span data-word className={index === 2 ? "inline-block italic" : "inline-block"}>
              {word}
            </span>
            {index < sentence.length - 1 ? " " : null}
          </span>
        ))}
      </p>
    </div>
  );
}
