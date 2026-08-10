import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCatalog, getFeaturedProducts } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/hero";
import { FeaturedCard } from "@/components/featured-card";
import { ScentTimeline } from "@/components/scent-timeline";
import { VariantMarquee } from "@/components/variant-marquee";
import { Reveal } from "@/components/motion/reveal";
import { HeadingReveal } from "@/components/motion/heading-reveal";
import { IgniteText } from "@/components/motion/ignite-text";
import { DrawFrame } from "@/components/motion/draw-frame";
import { Parallax } from "@/components/motion/parallax";

export default async function HomePage() {
  const [products, featuredProducts] = await Promise.all([
    getCatalog(),
    getFeaturedProducts(),
  ]);

  // Hero memakai varian unggulan pertama. Kalau klien belum menandai satu pun di
  // dashboard, varian pertama katalog tetap membuat halaman utuh.
  const heroProduct = featuredProducts[0] ?? products[0];

  if (!heroProduct) {
    throw new Error(
      "Katalog Supabase kosong. Jalankan supabase/seed.sql, atau pastikan ada varian dengan is_published = true.",
    );
  }

  return (
    <>
      <Hero products={products} />

      {/* Featured Scent of the Month, PRD 5.1 */}
      <section
        aria-labelledby="featured"
        className="shell hairline pt-20 md:pt-28"
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <p className="font-mono text-label tracking-label text-gold uppercase">
                Pilihan bulan ini
              </p>
            </Reveal>
            <HeadingReveal
              as="h2"
              id="featured"
              className="mt-5 font-display text-display font-light"
            >
              Dua yang paling sering diklaim
            </HeadingReveal>
          </div>
          <Reveal delay={0.3}>
            <Button asChild variant="link">
              <Link href="/koleksi">
                Semua koleksi <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>

        <Reveal stagger={0.12} className="mt-14 grid gap-6 lg:grid-cols-2">
          {featuredProducts.map((product) => (
            <FeaturedCard key={product.slug} product={product} />
          ))}
        </Reveal>
      </section>

      {/* Tesis situs: aroma bisa dilihat sebelum dicium */}
      <section aria-labelledby="sillage" className="shell pt-28 md:pt-40">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
          <div>
            <Reveal>
              <p className="font-mono text-label tracking-label text-gold uppercase">
                Kurva sillage
              </p>
            </Reveal>
            <HeadingReveal
              as="h2"
              id="sillage"
              className="mt-5 font-display text-display font-light"
            >
              Lihat dulu, baru cium
            </HeadingReveal>
            <Reveal delay={0.12}>
              <p className="mt-7 text-base leading-relaxed text-muted">
                Masalah belanja parfum online bukan pilihannya terlalu sedikit,
                tapi Anda tidak tahu aromanya akan jadi seperti apa tiga jam
                setelah disemprot.
              </p>
              <p className="mt-5 text-base leading-relaxed text-muted">
                Setiap varian kami gambarkan sebagai kurva: kapan tiap note
                muncul, kapan memuncak, dan kapan hilang. Ini {heroProduct.name}
                . Sentuh nama note mana pun untuk melihat jejaknya sendiri.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <Button asChild variant="outline" className="mt-9">
                <Link href={`/koleksi/${heroProduct.slug}`}>
                  Lihat {heroProduct.name}
                </Link>
              </Button>
            </Reveal>
          </div>

          {/* Grafik hanyut sedikit terhadap kolom teks di sebelahnya. Keduanya
              masuk bersamaan, lalu perlahan tidak lagi sejajar, jadi baris teks
              dan grafik tidak terbaca terkunci pada satu papan yang kaku. */}
          <Parallax className="min-w-0" distance={-30}>
            <Reveal>
              <ScentTimeline product={heroProduct} />
            </Reveal>
          </Parallax>
        </div>
      </section>

      <section aria-label="Semua varian" className="mt-28 md:mt-40">
        <VariantMarquee products={products} />
      </section>

      {/* The Bold Philosophy, PRD 5.1 */}
      <section aria-labelledby="filosofi" className="shell pt-28 md:pt-40">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="font-mono text-label tracking-label text-gold uppercase">
              The Bold Philosophy
            </p>
          </Reveal>

          {/* Momen besar halaman ini. Kalimatnya mendapat tinta kata demi kata
              mengikuti scroll, jadi pernyataan yang tadinya mengambang sendirian
              di tengah ruang hitam kini punya laju baca sendiri. */}
          <IgniteText
            id="filosofi"
            className="mt-8 font-display text-title leading-snug font-light text-balance"
            start="top 78%"
            end="bottom 42%"
          >
            Lebih dari sekadar aroma, kami meracik identitas. Hadir dalam botol
            30 ml dan 50 ml yang dirancang untuk menemani setiap langkah berani
            Anda.
          </IgniteText>

          <Reveal>
            <p className="mt-8 text-base leading-relaxed text-muted">
              Racikan kualitas dunia, karakter yang disesuaikan untuk individu
              yang berani tampil beda.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Ajakan ke Scent Profiler */}
      <section className="shell pt-28 md:pt-40">
        <DrawFrame className="bg-surface px-8 py-16 text-center md:px-16 md:py-24">
          <Reveal>
            <p className="font-mono text-label tracking-label text-gold uppercase">
              Scent Profiler
            </p>
          </Reveal>
          <HeadingReveal
            as="h2"
            className="mx-auto mt-7 max-w-2xl font-display text-display font-light text-balance"
          >
            Empat pertanyaan, satu aroma yang benar-benar Anda
          </HeadingReveal>
          <Reveal delay={0.15}>
            <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted">
              Jawab tentang cara Anda hadir di ruangan, bukan tentang bergamot
              dan oud. Kami yang menerjemahkannya ke {products.length} varian.
            </p>
            <Button asChild size="lg" className="mt-10">
              <Link href="/kuis">Mulai kuis</Link>
            </Button>
          </Reveal>
        </DrawFrame>
      </section>
    </>
  );
}
