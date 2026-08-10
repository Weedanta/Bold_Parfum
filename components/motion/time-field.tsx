import { timeToUnit, timeTicks } from "@/lib/sillage";

/** Sumbu yang sama dengan hero: 12 jam penuh. */
const SPAN_MINUTES = 720;

/**
 * Bidang ukur yang menopang seluruh halaman.
 *
 * Hero sudah menggambar sumbu waktunya sendiri, tapi sumbu itu berhenti di
 * lipatan pertama. Di bawahnya tinggal hitam kosong, dan jarak antar section
 * yang lebar jadi terbaca sebagai ketiadaan, bukan sebagai ruang.
 *
 * Komponen ini memanjangkan sumbu hero ke seluruh situs: satu bidang tetap
 * (fixed) yang tidak ikut menggulung, sehingga konten terbaca bergerak melewati
 * permukaan ukur, bukan mengambang di kehampaan.
 *
 * Yang membuatnya bukan sekadar latar bergaris: jarak antar garisnya tidak
 * seragam. Posisinya diambil dari `timeToUnit`, fungsi yang sama yang dipakai
 * Kurva Sillage, jadi sumbu dimampatkan dengan pangkat 0,45 dan menit-menit
 * awal mendapat ruang lebih lebar. Jarak antar garis di sini adalah informasi:
 * 15 menit pertama memang bagian yang paling menentukan kesan sebuah parfum.
 *
 * Statis dan tanpa JavaScript. Bidang ukur yang ikut bernapas malah menarik
 * perhatian ke dirinya sendiri, padahal tugasnya menopang yang lain.
 */
export function TimeField() {
  const ticks = timeTicks(SPAN_MINUTES);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        // Memudar di kedua ujung supaya garis tidak beradu dengan tepi header
        // dan footer, yang sama-sama sudah punya hairline sendiri.
        maskImage:
          "linear-gradient(to bottom, transparent 0, black 9rem, black 76%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0, black 9rem, black 76%, transparent 100%)",
      }}
    >
      <svg
        className="h-full w-full opacity-50"
        preserveAspectRatio="none"
        viewBox="0 0 1000 100"
      >
        {ticks.map((tick) => {
          const x = timeToUnit(tick, SPAN_MINUTES) * 1000;
          return (
            <line
              key={tick}
              x1={x}
              x2={x}
              y1={0}
              y2={100}
              stroke="var(--color-line)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
}
