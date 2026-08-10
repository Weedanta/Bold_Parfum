"use client";

import { useMemo, useState } from "react";

import { cn, formatDuration } from "@/lib/utils";
import {
  LAYER_CAPTIONS,
  LAYER_LABELS,
  type Layer,
  type Note,
  type Product,
} from "@/lib/products";
import {
  LAYERS,
  areaPath,
  layerCurves,
  linePath,
  noteIntensity,
  shortDuration,
  singleNoteCurve,
  tickLabel,
  timeToUnit,
  timeTicks,
  type Box,
} from "@/lib/sillage";
import { gsap, useGsapScope } from "@/components/motion/use-gsap";

const BOX: Box = { width: 720, height: 240, padTop: 14, padBottom: 26 };

/**
 * Tiap lapisan diberi tint sendiri, bukan sekadar opasitas berbeda. Dengan warna
 * yang nyaris sama, ketiga kurva tidak bisa dibedakan dan grafiknya berhenti
 * menyampaikan apa pun.
 */
const LAYER_STYLE = {
  top: { fill: 0.26, stroke: 1, mix: "62%, #ffffff" },
  heart: { fill: 0.2, stroke: 0.75, mix: "100%, #ffffff" },
  base: { fill: 0.14, stroke: 0.5, mix: "78%, #2b2f3a" },
} as const;

function layerColor(juice: string, layer: Layer) {
  return `color-mix(in oklab, ${juice} ${LAYER_STYLE[layer].mix})`;
}

type Props = {
  product: Pick<Product, "name" | "notes" | "juice">;
  className?: string;
};

/**
 * Kurva Sillage: bagaimana aroma berubah sepanjang hari.
 *
 * Menggantikan piramida aroma konvensional. Alasannya ada di PRD sendiri: PRD
 * mendefinisikan ketiga lapisan lewat waktu dan menjanjikan longevity 8-12 jam,
 * dan durasi persis itulah informasi yang hilang saat orang belanja parfum online.
 */
export function ScentTimeline({ product, className }: Props) {
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  /** Posisi kursor pada sumbu waktu, 0 sampai 1. Null berarti tidak sedang dibaca. */
  const [scrub, setScrub] = useState<number | null>(null);

  const { curves, max, ticks } = useMemo(() => {
    const result = layerCurves(product.notes);
    return {
      curves: result.curves,
      max: result.maxMinutes,
      ticks: timeTicks(result.maxMinutes),
    };
  }, [product.notes]);

  /** Titik tertinggi tiap lapisan, tempat labelnya dipasang. */
  const markers = useMemo(
    () =>
      LAYERS.map((layer) => {
        const points = curves.get(layer)!;
        const peak = points.reduce(
          (best, point) => (point.value > best.value ? point : best),
          points[0],
        );
        const usable = BOX.height - BOX.padTop - BOX.padBottom;
        const y = BOX.padTop + usable * (1 - peak.value);
        return { layer, left: peak.unit * 100, top: (y / BOX.height) * 100 };
      }),
    [curves],
  );

  /**
   * Membaca kurva pada posisi kursor. Titik sampel berjarak sama pada sumbu
   * terkompresi, jadi indeksnya bisa dihitung langsung tanpa pencarian.
   */
  const reading = useMemo(() => {
    if (scrub === null) return null;
    const sample = curves.get("top")!;
    const index = Math.min(
      sample.length - 1,
      Math.round(scrub * (sample.length - 1)),
    );
    const time = sample[index].t;
    return {
      time,
      layerValues: LAYERS.map((layer) => curves.get(layer)![index].value),
      active: new Set(
        product.notes
          .filter((note) => noteIntensity(note, time) > 0.05)
          .map((note) => note.name),
      ),
    };
  }, [scrub, curves, product.notes]);

  function readCurve(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const raw = (event.clientX - bounds.left) / bounds.width;
    // Dibulatkan ke 200 langkah supaya gerakan kecil tidak memicu render beruntun.
    const stepped = Math.round(Math.min(1, Math.max(0, raw)) * 200) / 200;
    setScrub((current) => (current === stepped ? current : stepped));
  }

  const highlight = useMemo(
    () => (activeNote ? linePath(singleNoteCurve(activeNote, max), BOX) : null),
    [activeNote, max],
  );

  const ref = useGsapScope<HTMLDivElement>(
    ({ root, reduced }) => {
      const strokes = root.querySelectorAll<SVGPathElement>(
        "[data-curve-stroke]",
      );
      const fills = root.querySelectorAll<SVGPathElement>("[data-curve-fill]");
      if (reduced || strokes.length === 0) return;

      gsap.set(fills, { opacity: 0 });
      strokes.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });

      gsap
        .timeline({
          scrollTrigger: { trigger: root, start: "top 80%", once: true },
        })
        .to(strokes, {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: "power2.inOut",
          stagger: 0.14,
        })
        .to(
          fills,
          { opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1 },
          "-=1.1",
        );
    },
    [product.notes],
  );

  const description = `Grafik intensitas aroma ${product.name} dari menit pertama sampai jam ke-${Math.round(max / 60)}.`;

  return (
    <figure className={className}>
      <div
        ref={ref}
        className="relative touch-pan-y"
        onPointerMove={readCurve}
        onPointerLeave={() => setScrub(null)}
      >
        <svg
          viewBox={`0 0 ${BOX.width} ${BOX.height}`}
          className="h-auto w-full"
          role="img"
          aria-label={description}
        >
          {ticks.map((tick) => {
            const x = timeToUnit(tick, max) * BOX.width;
            return (
              <line
                key={tick}
                x1={x}
                x2={x}
                y1={0}
                y2={BOX.height - BOX.padBottom}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
            );
          })}

          <line
            x1={0}
            x2={BOX.width}
            y1={BOX.height - BOX.padBottom}
            y2={BOX.height - BOX.padBottom}
            stroke="var(--color-line)"
            strokeWidth={1}
          />

          {/* base digambar dulu supaya lapisan awal menimpa, bukan tertimpa */}
          {[...LAYERS].reverse().map((layer) => {
            const points = curves.get(layer)!;
            const style = LAYER_STYLE[layer];
            return (
              <g key={layer}>
                <path
                  data-curve-fill
                  d={areaPath(points, BOX)}
                  fill={layerColor(product.juice, layer)}
                  fillOpacity={style.fill}
                />
                <path
                  data-curve-stroke
                  d={linePath(points, BOX)}
                  fill="none"
                  stroke={layerColor(product.juice, layer)}
                  strokeOpacity={style.stroke}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {highlight ? (
            <path
              d={highlight}
              fill="none"
              stroke="var(--color-gold-bright)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ) : null}
        </svg>

        {reading ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-10 w-px"
            style={{ left: `${scrub! * 100}%`, backgroundColor: product.juice }}
          >
            {reading.layerValues.map((value, index) => (
              <span
                key={LAYERS[index]}
                className="absolute -ml-[3px] size-1.5 rounded-full"
                style={{
                  top: `${((BOX.padTop + (BOX.height - BOX.padTop - BOX.padBottom) * (1 - value)) / BOX.height) * 100}%`,
                  backgroundColor: product.juice,
                }}
              />
            ))}
            <span
              className="absolute top-0 left-2 font-mono text-[10px] tracking-widest whitespace-nowrap"
              style={{ color: product.juice }}
            >
              {shortDuration(reading.time)}
            </span>
          </div>
        ) : null}

        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          {markers.map((marker) => (
            <span
              key={marker.layer}
              className="absolute -translate-x-1/2 -translate-y-[150%] font-mono text-[10px] tracking-label whitespace-nowrap uppercase"
              style={{
                left: `${marker.left}%`,
                top: `${marker.top}%`,
                color: layerColor(product.juice, marker.layer),
              }}
            >
              {LAYER_LABELS[marker.layer]}
            </span>
          ))}
        </div>

        <div className="relative mt-1 h-4" aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute -translate-x-1/2 font-mono text-[10px] tracking-widest text-muted"
              style={{ left: `${timeToUnit(tick, max) * 100}%` }}
            >
              {tickLabel(tick)}
            </span>
          ))}
        </div>
      </div>

      <figcaption className="mt-8">
        <p className="text-sm text-muted" aria-live="polite">
          {reading
            ? `Setelah ${formatDuration(Math.round(reading.time))}, yang masih terasa:`
            : "Arahkan kursor ke grafik untuk membaca aroma pada waktu tertentu."}
        </p>

        <div className="mt-7 grid gap-6 sm:grid-cols-3">
          {LAYERS.map((layer) => (
            <div key={layer}>
              <p className="font-mono text-label tracking-label text-gold uppercase">
                {LAYER_LABELS[layer]}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {LAYER_CAPTIONS[layer]}
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {product.notes
                  .filter((note) => note.layer === layer)
                  .map((note) => {
                    const isActive = activeNote?.name === note.name;
                    const inReading = reading?.active.has(note.name) ?? true;
                    return (
                      <li key={note.name}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveNote(note)}
                          onMouseLeave={() => setActiveNote(null)}
                          onFocus={() => setActiveNote(note)}
                          onBlur={() => setActiveNote(null)}
                          onClick={() => setActiveNote(isActive ? null : note)}
                          aria-pressed={isActive}
                          style={
                            !isActive && reading && inReading
                              ? {
                                  borderColor: product.juice,
                                  color: "var(--color-ink)",
                                }
                              : undefined
                          }
                          className={cn(
                            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-[color,border-color,opacity] duration-200",
                            isActive
                              ? "border-gold-bright bg-gold-bright/10 text-ink"
                              : "border-line text-muted hover:border-gold hover:text-ink",
                            reading && !inReading && "opacity-30",
                          )}
                        >
                          {note.name}
                          <span className="font-mono text-[10px] text-gold">
                            {shortDuration(note.onset)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </figcaption>

      {/*
        Data lengkap untuk pembaca layar. Grafik saja tidak cukup.
        sr-only dipasang di pembungkus, bukan di <table>: table layout melebar
        mengikuti isinya dan menembus lebar 1px, sehingga menimbulkan scroll
        horizontal di layar kecil.
      */}
      <div className="sr-only">
        <table>
          <caption>{description}</caption>
          <thead>
            <tr>
              <th scope="col">Note</th>
              <th scope="col">Lapisan</th>
              <th scope="col">Mulai terasa</th>
              <th scope="col">Bertahan sampai</th>
            </tr>
          </thead>
          <tbody>
            {product.notes.map((note) => (
              <tr key={`${note.layer}-${note.name}`}>
                <th scope="row">{note.name}</th>
                <td>{LAYER_LABELS[note.layer]}</td>
                <td>
                  {note.onset === 0 ? "langsung" : formatDuration(note.onset)}
                </td>
                <td>{formatDuration(note.fade)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
