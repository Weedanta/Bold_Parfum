import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { site } from "@/lib/site";
import { faq } from "@/lib/faq";
import { getCatalog } from "@/lib/catalog";
import { whatsappGeneralLink } from "@/lib/whatsapp";
import { Reveal } from "@/components/motion/reveal";
import { HeadingReveal } from "@/components/motion/heading-reveal";
import { IgniteText } from "@/components/motion/ignite-text";
import { DrawFrame } from "@/components/motion/draw-frame";
import { Parallax } from "@/components/motion/parallax";
import { Magnetic } from "@/components/motion/magnetic";
import { FaqAccordion } from "@/components/faq-accordion";

export const metadata: Metadata = {
  title: "Tentang The Bold",
  description:
    "Cerita di balik nama The Bold: meracik parfum kualitas dunia dengan karakter yang disesuaikan untuk individu yang berani tampil beda.",
  alternates: { canonical: "/tentang" },
  openGraph: {
    title: `Tentang | ${site.name}`,
    description:
      "Cerita di balik nama The Bold dan komitmen kami pada kualitas setara parfum kelas dunia.",
    url: "/tentang",
  },
};

/**
 * Tiga kurva tipis yang naik, memuncak, dan turun bergantian: top, heart, base.
 * Bukan grafik data, hanya gambaran bentuk yang dijelaskan paragraf di
 * sebelahnya, jadi cukup digambar statis dan dibiarkan hanyut pelan.
 */
function CurveSketch() {
  return (
    <svg viewBox="0 0 400 220" className="w-full" aria-hidden="true" fill="none">
      <path d="M0 210 C 40 30, 90 20, 150 200 S 260 215, 400 212" stroke="var(--color-gold-bright)" strokeOpacity="0.7" strokeWidth="1" />
      <path d="M0 212 C 70 190, 110 50, 200 60 S 300 190, 400 205" stroke="var(--color-gold)" strokeOpacity="0.45" strokeWidth="1" />
      <path d="M0 214 C 120 210, 190 120, 280 100 S 370 120, 400 130" stroke="var(--color-muted)" strokeOpacity="0.35" strokeWidth="1" />
      <line x1="0" y1="215" x2="400" y2="215" stroke="var(--color-line)" strokeWidth="1" />
    </svg>
  );
}

export default async function AboutPage() {
  const variantCount = (await getCatalog()).length;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      {/* Pembuka. Judul selebar mungkin tanpa label di atasnya; kalimat
          pengantarnya menyusul di kolom kanan, jauh di bawah garis judul. */}
      <header className="shell pt-16 md:pt-28">
        <HeadingReveal
          as="h1"
          className="max-w-[16ch] font-display text-statement font-light text-balance"
          delay={0.1}
        >
          Nama ini bukan tentang aromanya. Ini tentang <em className="italic">orang</em> yang memakainya.
        </HeadingReveal>
        <Reveal delay={0.35} className="mt-12 grid md:mt-20 lg:grid-cols-12">
          <p className="max-w-md text-base leading-relaxed text-muted lg:col-span-5 lg:col-start-8">
            The Bold lahir dari satu pengamatan sederhana tentang cara orang
            memilih parfum, dan dari keinginan untuk memperbaikinya.
          </p>
        </Reveal>
      </header>

      {/*
        Momen besar halaman ini, satu-satunya IgniteText. Pengamatan yang
        melahirkan The Bold ditulis besar dan kata-katanya menyala mengikuti
        scroll, jadi pembaca benar-benar berhenti di kalimat ini.

        Opasitas awalnya dibuat cukup tinggi supaya pembaca yang berhenti di
        tengah scroll tetap bisa membacanya.
      */}
      <section className="shell pt-28 md:pt-44">
        <IgniteText
          from={0.22}
          spread={0.35}
          start="top 82%"
          end="bottom 45%"
          className="max-w-5xl font-display text-[clamp(1.6rem,1rem+2.4vw,3rem)] leading-[1.15] font-light text-balance"
        >
          Kebanyakan orang memakai parfum yang dipilihkan iklan, bukan yang
          benar-benar menggambarkan dirinya. Wangi pasaran memang aman, tapi
          tidak meninggalkan kesan apa pun.
        </IgniteText>
      </section>

      {/* Angka besar melawan teks kecil. Iramanya sengaja lebih rapat dari
          section di atasnya. */}
      <section className="shell pt-20 md:pt-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-4 lg:col-start-2">
            <p className="font-display text-[clamp(6rem,3rem+10vw,12rem)] leading-[0.85] font-light tracking-[-0.05em] text-gold-bright">
              {variantCount}
            </p>
            <p className="mt-4 text-caption text-muted">
              varian, masing-masing dengan karakter yang tegas
            </p>
          </Reveal>
          <Reveal stagger={0.12} className="space-y-6 self-end text-base leading-relaxed text-muted lg:col-span-5 lg:col-start-7">
            <p>
              Kami meracik {variantCount} varian dengan bahan kualitas dunia.
              Tujuannya bukan supaya semua orang suka, tapi supaya satu di
              antaranya benar-benar terasa milik Anda.
            </p>
            <p>
              Botol 30 ml dan 50 ml dirancang untuk dibawa, bukan dipajang.
              Cukup ringkas untuk masuk tas kerja, cukup tahan lama untuk
              menemani dari rapat pagi sampai acara malam.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Alasan di balik kurva sillage. Judulnya sekarang judul sungguhan,
          dengan sketsa kurva yang hanyut lebih lambat dari teksnya. */}
      <section className="shell pt-32 md:pt-48">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <HeadingReveal
              as="h2"
              className="font-display text-display font-light text-balance"
            >
              Kenapa kami menggambar aroma
            </HeadingReveal>
            <Parallax distance={40} className="mt-14 max-w-md">
              <CurveSketch />
            </Parallax>
          </div>
          <Reveal stagger={0.12} className="space-y-6 text-base leading-relaxed text-muted lg:col-span-5 lg:col-start-8 lg:pt-24">
            <p>
              Masalah terbesar belanja parfum online bukan harga, tapi
              ketidaktahuan. Anda tidak bisa mencium lewat layar, dan daftar
              note seperti bergamot atau tonka bean tidak memberi tahu apa pun
              tentang rasanya nanti di kulit Anda.
            </p>
            <p>
              Karena itu setiap varian kami sajikan sebagai kurva waktu: kapan
              tiap note muncul, memuncak, dan menghilang. Informasi inilah yang
              selama ini hilang saat orang membeli parfum tanpa mencoba.
            </p>
            <p className="text-ink">
              <Link href="/koleksi" className="link-sweep pb-0.5">
                Lihat kurvanya di koleksi
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* Garansi. Pita sempit dan padat dengan bingkai yang menggambar
          dirinya sendiri, jedanya pendek setelah section yang lapang. */}
      <section className="shell pt-24 md:pt-32">
        <DrawFrame
          id="pengembalian"
          className="grid scroll-mt-28 gap-6 bg-surface px-6 py-10 sm:px-10 md:grid-cols-12 md:gap-10 md:py-12"
        >
          <h2 className="font-display text-title font-light md:col-span-4">
            Garansi kepuasan
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted md:col-span-7 md:col-start-6 md:text-base">
            Segel botol belum dibuka dan baru diterima kurang dari 7 hari?
            Varian bisa ditukar dengan yang lain. Botol yang sudah dibuka tidak
            bisa ditukar karena alasan higienitas.
          </p>
        </DrawFrame>
      </section>

      <section
        id="faq"
        aria-labelledby="faq-judul"
        className="shell scroll-mt-28 pt-32 md:pt-44"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <HeadingReveal
                as="h2"
                id="faq-judul"
                className="font-display text-display font-light"
              >
                Pertanyaan umum
              </HeadingReveal>
              <Reveal delay={0.15}>
                <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
                  Pertanyaan Anda tidak ada di sini?{" "}
                  <a
                    href={whatsappGeneralLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-sweep pb-0.5 text-ink"
                  >
                    Tanya langsung lewat WhatsApp
                  </a>
                  .
                </p>
              </Reveal>
            </div>
          </div>
          <div className="lg:col-span-8">
            <FaqAccordion items={faq} />
          </div>
        </div>
      </section>

      {/*
        Penutup. Berbeda dari kotak ajakan di beranda: tidak ada bingkai dan
        tidak ada kolom sempit di tengah. Kalimatnya besar di kiri, ajakannya
        sebuah lingkaran di kanan yang ikut tertarik ke kursor.
      */}
      <section className="shell pt-32 md:pt-48">
        <div className="hairline flex flex-col gap-12 pt-12 md:flex-row md:items-center md:justify-between md:pt-16">
          <div className="max-w-2xl">
            <HeadingReveal
              as="h2"
              className="font-display text-statement font-light text-balance"
            >
              Belum tahu mau yang mana?
            </HeadingReveal>
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
                Empat pertanyaan sudah cukup untuk mempersempit {variantCount}{" "}
                varian jadi satu.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.25} className="self-start md:self-auto">
            <Magnetic strength={0.35}>
              <Link
                href="/kuis"
                className="group relative isolate flex size-36 flex-col items-center justify-center gap-2 overflow-hidden rounded-full border border-ink/25 text-center text-sm text-ink transition-colors duration-500 ease-[var(--ease-out-soft)] hover:border-gold-bright hover:text-obsidian focus-visible:text-obsidian md:size-44"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 scale-0 rounded-full bg-gold-bright transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-100 group-focus-visible:scale-100"
                />
                <ArrowUpRight className="size-5 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:rotate-45" />
                Mulai kuis
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </section>
    </>
  );
}
