/**
 * Matematika Kurva Sillage.
 *
 * PRD mendefinisikan top/heart/base lewat waktu: "15 menit pertama", "setelah
 * 30 menit", "setelah 2 jam", dan menjanjikan longevity 8-12 jam. Piramida tiga
 * tingkat tidak bisa menunjukkan durasi, sumbu waktu bisa. Modul ini mengubah
 * data note menjadi geometri kurva itu.
 *
 * Murni fungsi, tanpa DOM, supaya bisa dipakai komponen klien maupun generator
 * OG image di server.
 */

import type { Layer, Note } from "@/lib/products";

export const LAYERS: Layer[] = ["top", "heart", "base"];

/** Interpolasi halus, turunan nol di kedua ujung. */
function smoothstep(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** Intensitas satu note pada menit ke-t, dalam rentang 0 sampai 1. */
export function noteIntensity(note: Note, t: number) {
  if (t <= note.onset || t >= note.fade) return 0;
  if (t < note.peak) {
    return smoothstep((t - note.onset) / Math.max(1, note.peak - note.onset));
  }
  return smoothstep(1 - (t - note.peak) / Math.max(1, note.fade - note.peak));
}

/**
 * Sumbu waktu dimampatkan dengan pangkat 0,45 supaya menit-menit awal, bagian
 * yang paling menentukan kesan pertama, mendapat ruang layar yang sepadan.
 * Tanpa ini, 15 menit pertama hanya jadi 2% lebar grafik.
 */
export function timeToUnit(t: number, maxMinutes: number) {
  if (maxMinutes <= 0) return 0;
  return Math.pow(Math.min(1, Math.max(0, t / maxMinutes)), 0.45);
}

export function maxMinutes(notes: Note[]) {
  return notes.reduce((max, note) => Math.max(max, note.fade), 0);
}

export type CurvePoint = { t: number; unit: number; value: number };

/**
 * Kurva agregat satu lapisan. Nilai dinormalkan terhadap puncak tertinggi di
 * antara ketiga lapisan, jadi tinggi relatif antar lapisan tetap bermakna.
 */
export function layerCurves(notes: Note[], samples = 140, forcedMax?: number) {
  const max = forcedMax ?? maxMinutes(notes);
  const times = Array.from({ length: samples }, (_, i) => {
    // Sampel diambil merata pada sumbu terkompresi, bukan pada waktu asli,
    // supaya lonjakan top note tidak terlewat.
    const unit = i / (samples - 1);
    return Math.pow(unit, 1 / 0.45) * max;
  });

  const raw = new Map<Layer, number[]>();
  for (const layer of LAYERS) {
    const layerNotes = notes.filter((n) => n.layer === layer);
    raw.set(
      layer,
      times.map((t) => layerNotes.reduce((sum, note) => sum + noteIntensity(note, t), 0)),
    );
  }

  let peak = 0;
  for (const values of raw.values()) {
    for (const value of values) peak = Math.max(peak, value);
  }
  const divisor = peak || 1;

  const curves = new Map<Layer, CurvePoint[]>();
  for (const layer of LAYERS) {
    curves.set(
      layer,
      times.map((t, i) => ({
        t,
        unit: i / (samples - 1),
        value: (raw.get(layer)![i] ?? 0) / divisor,
      })),
    );
  }

  return { curves, maxMinutes: max };
}

/** Kurva satu note tunggal, dipakai saat pengguna menyoroti sebuah note. */
export function singleNoteCurve(note: Note, max: number, samples = 140): CurvePoint[] {
  return Array.from({ length: samples }, (_, i) => {
    const unit = i / (samples - 1);
    const t = Math.pow(unit, 1 / 0.45) * max;
    return { t, unit, value: noteIntensity(note, t) };
  });
}

export type Box = { width: number; height: number; padTop: number; padBottom: number };

function project(point: CurvePoint, box: Box) {
  const usable = box.height - box.padTop - box.padBottom;
  return {
    x: point.unit * box.width,
    y: box.padTop + usable * (1 - point.value),
  };
}

export function linePath(points: CurvePoint[], box: Box) {
  return points
    .map((point, i) => {
      const { x, y } = project(point, box);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function areaPath(points: CurvePoint[], box: Box) {
  const floor = (box.height - box.padBottom).toFixed(2);
  return `${linePath(points, box)} L${box.width.toFixed(2)} ${floor} L0 ${floor} Z`;
}

/** Tanda waktu yang ditampilkan di sumbu, disaring ke yang muat pada varian ini. */
export function timeTicks(max: number) {
  const candidates = [0, 15, 30, 60, 120, 240, 480, 720];
  return candidates.filter((t) => t <= max);
}

/** Label sumbu waktu. Hanya dipakai untuk nilai tick yang habis dibagi 60. */
export function tickLabel(minutes: number) {
  if (minutes === 0) return "0";
  if (minutes < 60) return `${minutes}m`;
  return `${minutes / 60}j`;
}

/** Label ringkas untuk waktu sembarang: 0m, 45m, 1j40m, 2j. */
export function shortDuration(minutes: number) {
  const total = Math.round(minutes);
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours}j` : `${hours}j${rest}m`;
}
