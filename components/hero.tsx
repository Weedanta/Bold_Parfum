"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { HeroAtmosphere } from "@/components/hero-atmosphere";
import { gsap, useGsapScope } from "@/components/motion/use-gsap";
import {
  areaPath,
  layerCurves,
  linePath,
  shortDuration,
  tickLabel,
  timeToUnit,
  timeTicks,
  type Box,
  type CurvePoint,
} from "@/lib/sillage";
import type { Product } from "@/lib/products";

/** Semua varian digambar pada sumbu 12 jam yang sama supaya bisa dibandingkan. */
const SHARED_MAX = 720;
const SAMPLES = 96;
const BOX: Box = { width: 1200, height: 250, padTop: 14, padBottom: 0 };

const LAYER_ORDER = ["base", "heart", "top"] as const;
const FILL_OPACITY = [0.1, 0.14, 0.19];
const STROKE_OPACITY = [0.35, 0.6, 0.95];

/** Sumbu mendatar hero, sebagai pecahan tinggi bidang. */
const INTENSITY_LINES = [0.24, 0.48, 0.72];

const HOLD_SECONDS = 3.4;
const MORPH_SECONDS = 1.5;

type HeroProduct = Pick<
  Product,
  "slug" | "name" | "family" | "juice" | "longevity" | "sillage" | "category"
> & { notes: Product["notes"] };

/**
 * Hero: indeks aroma yang hidup.
 *
 * Alih-alih satu gambar diam, hero menampilkan kurva sillage seluruh koleksi
 * yang saling berganti bentuk di atas sumbu waktu 12 jam yang sama. Sejak layar
 * pertama pengunjung melihat klaim utama The Bold sekaligus melihat bahwa tiap
 * varian punya perjalanan waktu yang berbeda, bukan sekadar nama yang berbeda.
 *
 * Path digambar sekali di server lalu diambil alih GSAP lewat setAttribute.
 * Karena prop `d` tidak pernah berubah, React tidak menimpa hasil animasi, dan
 * tanpa JavaScript kurva varian pertama tetap tampil utuh.
 */
export function Hero({ products }: { products: HeroProduct[] }) {
  const [active, setActive] = useState(0);

  const frames = useMemo(
    () =>
      products.map((product) => {
        const { curves } = layerCurves(product.notes, SAMPLES, SHARED_MAX);
        return {
          product,
          layers: LAYER_ORDER.map((layer) => curves.get(layer)!),
        };
      }),
    [products],
  );

  const ticks = useMemo(() => timeTicks(SHARED_MAX), []);

  const staticPaths = useMemo(
    () =>
      frames[0].layers.map((points) => ({
        area: areaPath(points, BOX),
        line: linePath(points, BOX),
      })),
    [frames],
  );

  const areaRefs = useRef<(SVGPathElement | null)[]>([]);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const readoutRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const playLabelRef = useRef<HTMLSpanElement>(null);

  /**
   * Menggerakkan penunjuk waktu mengikuti kursor. Ditulis langsung ke DOM, bukan
   * lewat state, supaya tidak memicu render pada tiap gerakan pointer.
   */
  function movePlayhead(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const unit = Math.min(
      1,
      Math.max(0, (event.clientX - bounds.left) / bounds.width),
    );
    const minutes = Math.pow(unit, 1 / 0.45) * SHARED_MAX;

    if (playheadRef.current) {
      playheadRef.current.style.left = `${unit * 100}%`;
      playheadRef.current.style.opacity = "1";
    }
    if (playLabelRef.current) {
      playLabelRef.current.textContent = shortDuration(minutes);
    }
  }

  function hidePlayhead() {
    if (playheadRef.current) playheadRef.current.style.opacity = "0";
  }

  const rootRef = useGsapScope<HTMLElement>(
    ({ root, reduced }) => {
      // Titik sampel identik di semua varian, jadi hanya nilainya yang dianimasikan.
      const scratch: CurvePoint[][] = frames[0].layers.map((points) =>
        points.map((point) => ({ ...point })),
      );

      function paint(fromIndex: number, toIndex: number, progress: number) {
        const from = frames[fromIndex];
        const to = frames[toIndex];
        const color = gsap.utils.interpolate(
          from.product.juice,
          to.product.juice,
          progress,
        ) as string;

        for (let layer = 0; layer < LAYER_ORDER.length; layer += 1) {
          const points = scratch[layer];
          const a = from.layers[layer];
          const b = to.layers[layer];
          for (let i = 0; i < points.length; i += 1) {
            points[i].value = a[i].value + (b[i].value - a[i].value) * progress;
          }

          const area = areaRefs.current[layer];
          const line = lineRefs.current[layer];
          if (area) {
            area.setAttribute("d", areaPath(points, BOX));
            area.setAttribute("fill", color);
          }
          if (line) {
            line.setAttribute("d", linePath(points, BOX));
            line.setAttribute("stroke", color);
          }
        }

        root.style.setProperty("--hero-juice", color);
      }

      paint(0, 0, 0);

      const heading = root.querySelectorAll<HTMLElement>("[data-hero-line]");
      const fades = root.querySelectorAll<HTMLElement>("[data-hero-fade]");
      const grid = root.querySelectorAll<SVGLineElement>("[data-hero-grid]");
      const stage = root.querySelector<HTMLElement>("[data-hero-stage]");

      if (reduced) return;

      /*
       * Perpisahan hero.
       *
       * Bidang ukur di belakang halaman dipasang fixed, jadi ia sama sekali
       * tidak ikut menggulung. Kalau isi hero bergerak persis seiring scroll,
       * keduanya terbaca menempel pada satu bidang yang sama. Menggeser isi hero
       * sedikit lebih cepat memberi jarak di antara keduanya, sehingga keluar
       * dari hero terasa seperti kamera yang bergerak, bukan potongan.
       *
       * `y` dikenakan pada wadahnya, bukan pada baris judul atau elemen fade,
       * karena keduanya sudah dianimasikan timeline muat di bawah ini. Dua
       * sumber yang menulis transform yang sama akan saling menimpa.
       */
      if (stage) {
        gsap.to(stage, {
          y: -72,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      gsap.set(heading, { yPercent: 115 });
      gsap.set(fades, { opacity: 0, y: 16 });
      gsap.set(grid, { opacity: 0 });
      lineRefs.current.forEach((path) => {
        if (!path) return;
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.set(areaRefs.current.filter(Boolean), { opacity: 0 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(grid, { opacity: 1, duration: 1.2, stagger: 0.04 }, 0)
        .to(heading, { yPercent: 0, duration: 1.15, stagger: 0.09 }, 0.15)
        .to(fades, { opacity: 1, y: 0, duration: 0.85, stagger: 0.1 }, 0.55)
        .to(
          lineRefs.current.filter(Boolean),
          {
            strokeDashoffset: 0,
            duration: 2.2,
            ease: "power2.inOut",
            stagger: 0.16,
          },
          0.2,
        )
        .to(areaRefs.current.filter(Boolean), { opacity: 1, duration: 1 }, 1.2)
        .add(cycle, ">-0.4");

      let current = 0;

      function cycle() {
        const from = current;
        const to = (current + 1) % frames.length;
        const proxy = { progress: 0 };

        timelineRef.current = gsap
          .timeline({ delay: HOLD_SECONDS, onComplete: cycle })
          .to(proxy, {
            progress: 1,
            duration: MORPH_SECONDS,
            ease: "power2.inOut",
            onStart: () => {
              current = to;
              setActive(to);
              if (readoutRef.current) {
                gsap.fromTo(
                  readoutRef.current,
                  { opacity: 0, y: 10 },
                  { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
                );
              }
            },
            onUpdate: () => paint(from, to, proxy.progress),
          });
      }
    },
    [frames],
  );

  const shown = frames[active].product;

  return (
    <section
      ref={rootRef}
      /*
       * Hero ditarik ke belakang header, bukan dimulai di bawahnya.
       *
       * Header etalase transparan selama halaman masih di puncak. Kalau hero
       * baru mulai di bawahnya, jalur setinggi header itu tidak kebagian kabut
       * dan terbaca sebagai bar hitam yang menempel sendiri di atas layar,
       * persis yang ingin dihindari header transparan. Margin negatif menaikkan
       * hero sampai ke tepi atas viewport, padding dengan besar yang sama
       * mengembalikan ruang isinya, jadi kabut dan sumbu waktu mengalir utuh di
       * balik header tanpa satu baris pun tata letak yang bergeser.
       */
      className="relative -mt-16 flex min-h-svh flex-col overflow-hidden pt-16 md:-mt-20 md:pt-20"
      onPointerMove={movePlayhead}
      onPointerLeave={() => {
        hidePlayhead();
        timelineRef.current?.resume();
      }}
      onPointerEnter={() => timelineRef.current?.pause()}
      style={{ ["--hero-juice" as string]: frames[0].product.juice }}
    >
      <HeroAtmosphere />

      {/* Garis waktu membentang setinggi hero, jadi seluruh layar terbaca
          sebagai bidang grafik, bukan latar dekoratif. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 1200 1000"
      >
        {ticks.map((tick) => {
          const x = timeToUnit(tick, SHARED_MAX) * 1200;
          return (
            <line
              key={tick}
              data-hero-grid
              x1={x}
              x2={x}
              y1={0}
              y2={1000}
              stroke="var(--color-line)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Sumbu intensitas. Tiga garis saja: cukup untuk menutup bidang ukur
            menjadi kertas grafik, belum cukup untuk bersaing dengan judul. */}
        {INTENSITY_LINES.map((unit) => (
          <line
            key={unit}
            data-hero-grid
            x1={0}
            x2={1200}
            y1={unit * 1000}
            y2={unit * 1000}
            stroke="var(--color-line)"
            strokeOpacity={0.5}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Penunjuk waktu. Menggeser kursor di mana pun pada hero akan membaca
          posisi waktu yang sama dengan yang dipakai kurva di bawahnya. */}
      <div
        ref={playheadRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-10 w-px opacity-0 transition-opacity duration-300"
        style={{ backgroundColor: "var(--hero-juice)" }}
      >
        <span
          ref={playLabelRef}
          className="absolute top-4 left-2 font-mono text-[10px] tracking-widest whitespace-nowrap"
          style={{ color: "var(--hero-juice)" }}
        />
      </div>

      {/* Tinggi layar ponsel berkisar 640 sampai 950 px. Jarak tetap yang pas di
          satu perangkat akan memotong pita grafik di perangkat lain, padahal
          justru grafik itu isi janji hero-nya. Karena itu ritme vertikal di
          layar kecil ikut svh, sama seperti skala tipografi situs ini; mulai
          sm: ukuran kembali tetap karena ruangnya sudah pasti cukup. */}
      <div
        data-hero-stage
        className="shell relative flex flex-1 flex-col justify-center py-[max(0.875rem,2.2svh)] sm:py-10 md:py-12"
      >
        <h1 className="mt-[1.2svh] font-display text-hero font-light sm:mt-6 md:mt-8">
          <span className="block overflow-hidden">
            <span data-hero-line className="block">
              Define
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block italic">
              Your Presence
            </span>
          </span>
        </h1>

        <p
          data-hero-fade
          className="mt-[max(0.875rem,2.6svh)] max-w-xl text-base leading-relaxed text-muted sm:mt-8 sm:text-lg md:mt-10"
        >
          Aroma berubah sepanjang hari, dan itulah yang tidak bisa Anda cium
          lewat layar. Kami menggambarkannya untuk Anda, dari semprotan pertama
          sampai jam ke-12.
        </p>

        <div
          data-hero-fade
          className="mt-[max(1rem,3svh)] flex flex-col gap-[max(1rem,2.8svh)] sm:mt-10 sm:flex-row sm:items-end sm:justify-between sm:gap-10 md:mt-12"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/kuis">Temukan Aroma Anda</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/koleksi">Lihat koleksi</Link>
            </Button>
          </div>

          {/* Pembacaan langsung dari kurva yang sedang tampil. Ini yang membuat
              hero terbaca sebagai instrumen, bukan slideshow. */}
          <div ref={readoutRef} className="sm:text-right">
            <p className="font-mono text-label tracking-label text-muted uppercase">
              Indeks aroma {String(active + 1).padStart(2, "0")} /{" "}
              {frames.length}
            </p>
            <p className="mt-2.5 font-display text-2xl leading-none sm:mt-3">
              <Link
                href={`/koleksi/${shown.slug}`}
                className="transition-colors"
                style={{ color: "var(--hero-juice)" }}
              >
                {shown.name}
              </Link>
            </p>
            <p className="mt-2.5 font-mono text-[11px] tracking-wider text-muted uppercase sm:mt-3">
              {shown.family} &middot; {shown.longevity[0]}-{shown.longevity[1]}{" "}
              jam &middot; sillage {shown.sillage}
            </p>
          </div>
        </div>
      </div>

      {/* Pita grafik. Label sumbu, garis dasar, dan kurva berbagi satu ruang
          koordinat full-bleed, jadi tiap label benar-benar menandai garis grid
          di belakangnya. */}
      <div className="relative">
        <div className="h-px w-full bg-line" />

        <div className="relative h-6" aria-hidden="true">
          {ticks.map((tick) => {
            const unit = timeToUnit(tick, SHARED_MAX);
            const edge =
              unit === 0
                ? "translate-x-2"
                : unit === 1
                  ? "-translate-x-[calc(100%+0.5rem)]"
                  : "-translate-x-1/2";
            return (
              <span
                key={tick}
                className={`absolute top-2 font-mono text-[10px] tracking-widest text-muted ${edge} ${
                  tick === 15 ? "hidden sm:inline" : ""
                }`}
                style={{ left: `${unit * 100}%` }}
              >
                {tickLabel(tick)}
              </span>
            );
          })}
        </div>

        <div aria-hidden="true" className="h-[max(4.5rem,13svh)] sm:h-[160px] md:h-[200px]">
          <svg
            viewBox={`0 0 ${BOX.width} ${BOX.height}`}
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            {LAYER_ORDER.map((layer, index) => (
              <g key={layer}>
                <path
                  ref={(node) => {
                    areaRefs.current[index] = node;
                  }}
                  d={staticPaths[index].area}
                  fill={frames[0].product.juice}
                  fillOpacity={FILL_OPACITY[index]}
                />
                <path
                  ref={(node) => {
                    lineRefs.current[index] = node;
                  }}
                  d={staticPaths[index].line}
                  fill="none"
                  stroke={frames[0].product.juice}
                  strokeOpacity={STROKE_OPACITY[index]}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
