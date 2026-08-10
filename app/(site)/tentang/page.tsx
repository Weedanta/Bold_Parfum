import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/lib/site";
import { faq } from "@/lib/faq";
import { getCatalog } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { HeadingReveal } from "@/components/motion/heading-reveal";
import { IgniteText } from "@/components/motion/ignite-text";
import { DrawFrame } from "@/components/motion/draw-frame";
import { Parallax } from "@/components/motion/parallax";
import { FaqAccordion } from "@/components/faq-accordion";

export const metadata: Metadata = {
  title: "Tentang The Bold",
  description:
    "Cerita di balik nama The Bold: meracik parfum kualitas dunia dengan karakter yang disesuaikan untuk individu yang berani tampil beda.",
  alternates: { canonical: "/tentang" },
  openGraph: {
    title: `Tentang · ${site.name}`,
    description:
      "Cerita di balik nama The Bold dan komitmen kami pada kualitas setara parfum kelas dunia.",
    url: "/tentang",
  },
};

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
    <div className="shell pt-16 md:pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <header className="max-w-3xl">
        <Reveal>
          <p className="font-mono text-label tracking-label text-gold uppercase">
            Tentang kami
          </p>
        </Reveal>
        <HeadingReveal
          as="h1"
          className="mt-6 font-display text-display font-light text-balance"
          delay={0.1}
        >
          Nama ini bukan tentang aromanya. Ini tentang orang yang memakainya.
        </HeadingReveal>
      </header>

      <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
        {/*
          Momen besar halaman ini. Kolom naratif inilah yang paling terasa
          sebagai dinding teks, jadi tiap paragraf mendapat tintanya mengikuti
          scroll: urutan kata menyala sama dengan urutan membaca, dan halaman
          punya laju, bukan sekadar blok abu-abu yang muncul sekaligus.

          Opasitas awalnya lebih tinggi daripada pernyataan filosofi di beranda.
          Ini teks isi ukuran normal; kalau terlalu redup, pembaca yang berhenti
          di tengah scroll benar-benar tidak bisa membacanya.
        */}
        <div className="space-y-6 text-base leading-relaxed text-muted">
          <IgniteText from={0.3} spread={0.3} start="top 88%" end="bottom 55%">
            The Bold lahir dari satu pengamatan sederhana: kebanyakan orang
            memakai parfum yang dipilihkan iklan, bukan yang benar-benar
            menggambarkan dirinya. Wangi pasaran memang aman, tapi tidak
            meninggalkan kesan apa pun.
          </IgniteText>
          <IgniteText from={0.3} spread={0.3} start="top 88%" end="bottom 55%">
            Kami meracik {variantCount} varian dengan bahan kualitas dunia,
            masing-masing dengan karakter yang tegas. Bukan supaya semua orang
            suka, tapi supaya satu di antaranya benar-benar terasa milik Anda.
          </IgniteText>
          <IgniteText from={0.3} spread={0.3} start="top 88%" end="bottom 55%">
            Botol 30 ml dan 50 ml dirancang untuk dibawa, bukan dipajang. Cukup
            ringkas untuk masuk tas kerja, cukup tahan lama untuk menemani dari
            rapat pagi sampai acara malam.
          </IgniteText>
        </div>

        {/* Kolom kanan tertinggal sedikit dari kolom kiri. Kiri sudah punya
            iramanya sendiri lewat tinta yang menyala mengikuti scroll; memberi
            kanan laju yang berbeda membuat dua kolom ini terbaca sebagai dua
            suara, bukan satu blok teks yang dibelah dua. */}
        <Parallax distance={26}>
          <Reveal className="space-y-10">
            <div>
              <h2 className="font-mono text-label tracking-label text-gold uppercase">
                Kenapa kami menggambar aroma
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted">
                Masalah terbesar belanja parfum online bukan harga, tapi
                ketidaktahuan. Anda tidak bisa mencium lewat layar, dan daftar
                note seperti bergamot atau tonka bean tidak memberi tahu apa pun
                tentang rasanya nanti di kulit Anda.
              </p>
              <p className="mt-5 text-base leading-relaxed text-muted">
                Karena itu setiap varian kami sajikan sebagai kurva waktu: kapan
                tiap note muncul, memuncak, dan menghilang. Ini bukan hiasan;
                ini informasi yang selama ini hilang saat orang membeli parfum
                tanpa mencoba.
              </p>
            </div>

            <DrawFrame
              id="pengembalian"
              className="scroll-mt-28 bg-surface p-8"
            >
              <h2 className="font-display text-title font-light">
                Garansi kepuasan
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Segel botol belum dibuka dan baru diterima kurang dari 7 hari?
                Varian bisa ditukar dengan yang lain. Botol yang sudah dibuka
                tidak bisa ditukar karena alasan higienitas.
              </p>
            </DrawFrame>
          </Reveal>
        </Parallax>
      </div>

      <section
        id="faq"
        aria-labelledby="faq-judul"
        className="mt-32 scroll-mt-28 md:mt-40"
      >
        <HeadingReveal
          as="h2"
          id="faq-judul"
          className="font-display text-display font-light"
        >
          Pertanyaan umum
        </HeadingReveal>

        <FaqAccordion items={faq} />
      </section>

      <section className="mt-28 md:mt-36">
        <DrawFrame className="bg-surface px-8 py-16 text-center md:px-16">
          <HeadingReveal
            as="h2"
            className="mx-auto max-w-xl font-display text-display font-light text-balance"
          >
            Belum tahu mau yang mana?
          </HeadingReveal>
          <Reveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted">
              Empat pertanyaan sudah cukup untuk mempersempit {variantCount}{" "}
              varian jadi satu.
            </p>
            <Button asChild size="lg" className="mt-10">
              <Link href="/kuis">Mulai Scent Profiler</Link>
            </Button>
          </Reveal>
        </DrawFrame>
      </section>
    </div>
  );
}
