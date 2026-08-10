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
 */
export function Blending({ juice }: { juice: string }) {
  const ref = useGsapScope<HTMLDivElement>(({ root, reduced }) => {
    if (reduced) return;

    const droplets = root.querySelectorAll<SVGCircleElement>("[data-droplet]");
    const ring = root.querySelector<SVGCircleElement>("[data-ring]");
    const pool = root.querySelector<SVGCircleElement>("[data-pool]");
    if (!ring || !pool) return;

    const circumference = 2 * Math.PI * 54;
    gsap.set(ring, { strokeDasharray: circumference, strokeDashoffset: circumference });
    gsap.set(pool, { scale: 0, transformOrigin: "center" });

    const timeline = gsap.timeline();

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
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <svg viewBox="-70 -70 140 140" className="size-40" aria-hidden="true">
        <circle
          data-ring
          r="54"
          fill="none"
          stroke={juice}
          strokeOpacity="0.85"
          strokeWidth="1.5"
          transform="rotate(-90)"
        />
        <circle data-pool r="16" fill={juice} fillOpacity="0.35" />
        {Array.from({ length: DROPLETS }, (_, index) => (
          <circle key={index} data-droplet r="3" fill={juice} />
        ))}
      </svg>

      <p
        role="status"
        className="mt-10 font-display text-title font-light text-balance"
      >
        Sedang meracik profil aromamu&hellip;
      </p>
    </div>
  );
}
