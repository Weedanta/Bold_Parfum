"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic";

/**
 * Tiga parfum terfavorit untuk sampul. Sengaja ditulis tetap di sini, bukan
 * diambil dari katalog, supaya hero tidak bergantung pada Supabase.
 */
const SLIDES = [
  {
    slug: "crown",
    name: "Crown",
    note: "Calabrian bergamot, Sichuan pepper, ambroxan",
    image: "/hero/crown.webp",
    alt: "Botol parfum Crown di atas riak air biru tua",
    position: "50% 42%",
  },
  {
    slug: "midnight-tide",
    name: "Midnight Tide",
    note: "Sea notes, rosemary, sage, incense",
    image: "/hero/midnight-tide.webp",
    alt: "Botol parfum Midnight Tide di atas karang di tengah ombak malam",
    position: "50% 55%",
  },
  {
    slug: "midnight-siren",
    name: "Midnight Siren",
    note: "Almond, kopi hitam, tuberose, tonka bean",
    image: "/hero/midnight-siren.webp",
    alt: "Botol parfum Midnight Siren di antara kelopak mawar gelap",
    position: "50% 55%",
  },
] as const;

const SLIDE_SECONDS = 5.5;

/**
 * Hero: sampul layar penuh dengan slider otomatis tiga parfum terfavorit.
 *
 * Foto saling melebur (crossfade) sambil perlahan mengecil dari zoom, lalu
 * berganti sendiri tiap beberapa detik. Slider berhenti saat kursor berada di
 * atas hero atau fokus ada di dalamnya, dan tidak berjalan sendiri bagi
 * pengunjung yang memilih mengurangi gerak.
 */
export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const running = !paused && !reduced;

  // `active` ada di dependensi supaya timer dimulai ulang tiap pindah slide,
  // baik otomatis maupun lewat klik penunjuk, dan batang progres selalu sinkron.
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(
      () => setActive((index) => (index + 1) % SLIDES.length),
      SLIDE_SECONDS * 1000,
    );
    return () => window.clearTimeout(id);
  }, [active, running]);

  const shown = SLIDES[active];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Parfum terfavorit"
      /*
       * Hero ditarik ke belakang header transparan: margin negatif menaikkan foto
       * sampai tepi atas viewport, padding dengan besar yang sama mengembalikan
       * ruang isinya, sehingga tidak ada bar hitam di atas foto.
       */
      className="relative -mt-16 flex min-h-svh flex-col overflow-hidden bg-black pt-16 md:-mt-20 md:pt-20"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setPaused(true);
      }}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {SLIDES.map((slide, index) => {
        const isActive = index === active;
        return (
          <div
            key={slide.slug}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="100vw"
              priority={index === 0}
              quality={85}
              className={`object-cover ${
                reduced
                  ? ""
                  : "transition-transform ease-out [transition-duration:7500ms]"
              } ${isActive || reduced ? "scale-100" : "scale-110"}`}
              style={{ objectPosition: slide.position }}
            />
          </div>
        );
      })}

      {/* Bayangan bawah dan atas menjaga teks dan header tetap terbaca di atas
          foto apa pun tanpa meredupkan botol di tengah. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.82)_0%,rgb(0_0_0/0.35)_38%,transparent_62%),linear-gradient(to_bottom,rgb(0_0_0/0.55)_0%,transparent_22%)]"
      />

      <div className="shell relative flex flex-1 flex-col justify-end pb-10 md:pb-14">
        <p
          key={shown.slug}
          className="hero-fade-up mb-4 text-caption text-white/80"
          aria-live={running ? "off" : "polite"}
        >
          <Link
            href={`/koleksi/${shown.slug}`}
            className="link-sweep font-display text-2xl font-light text-white italic md:text-3xl"
          >
            {shown.name}
          </Link>
          <span className="mt-1 block">{shown.note}</span>
        </p>

        <h1 className="font-display text-hero font-light text-white">
          <span className="block">Define</span>
          <span className="block italic sm:pl-[0.9em]">Your Presence</span>
        </h1>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Magnetic>
              <Button asChild size="lg">
                <Link href="/kuis">Temukan aroma Anda</Link>
              </Button>
            </Magnetic>
            <Button asChild variant="outline" size="lg">
              <Link href="/koleksi">Lihat koleksi</Link>
            </Button>
          </div>

          {/* Penunjuk slide. Tiap batang adalah tombol, dan batang aktif terisi
              sesuai sisa waktu sebelum slide berganti. */}
          <div className="flex items-center gap-3" role="group" aria-label="Pilih slide">
            {SLIDES.map((slide, index) => {
              const isActive = index === active;
              return (
                <button
                  key={slide.slug}
                  type="button"
                  aria-label={`Tampilkan ${slide.name}`}
                  aria-current={isActive}
                  onClick={() => setActive(index)}
                  className="group flex w-16 flex-col gap-2 text-left sm:w-24"
                >
                  <span className="relative block h-0.5 w-full overflow-hidden bg-white/30">
                    <span
                      key={isActive ? `on-${active}-${running}` : "off"}
                      className="absolute inset-y-0 left-0 block bg-white"
                      style={{
                        width: isActive && !running ? "100%" : "0%",
                        animation:
                          isActive && running
                            ? `hero-progress ${SLIDE_SECONDS}s linear both`
                            : undefined,
                      }}
                    />
                  </span>
                  <span
                    className={`font-mono text-[10px] tracking-widest uppercase transition-colors ${
                      isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
