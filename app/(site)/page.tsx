import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCatalog, getFeaturedProducts } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/hero";
import { FeaturedStack } from "@/components/featured-card";
import { ScentTimeline } from "@/components/scent-timeline";
import { VariantMarquee } from "@/components/variant-marquee";
import { Reveal } from "@/components/motion/reveal";
import { HeadingReveal } from "@/components/motion/heading-reveal";
import { IgniteText } from "@/components/motion/ignite-text";
import { CharReveal } from "@/components/motion/char-reveal";
import { Magnetic } from "@/components/motion/magnetic";
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

  // Daya tahan terpanjang di koleksi, dipakai untuk menskalakan batang warna di
  // bab penutup supaya varian yang paling awet benar-benar paling tinggi.
  const longestWear = Math.max(...products.map((product) => product.longevity[1]));

  return (
    <>
      <Hero />

      {/* Featured Scent of the Month, PRD 5.1.
          Bab pertama setelah hero diberi udara paling lega di halaman: judulnya
          besar dan sendirian, lalu dua bentangan bertumpuk saat di-scroll. */}
      {featuredProducts.length > 0 ? (
        <section aria-labelledby="featured" className="shell pt-24 md:pt-40">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <HeadingReveal
              as="h2"
              id="featured"
              className="font-display text-statement font-light lg:col-span-8"
            >
              {/* Jumlah unggulan diatur klien dari dashboard, jadi "Dua" hanya
                  dipakai saat memang dua yang ditandai. */}
              {featuredProducts.length === 2 ? "Dua yang" : "Yang"} paling sering{" "}
              <span className="italic">diklaim</span>
            </HeadingReveal>
            <Reveal delay={0.2} className="lg:col-span-3 lg:col-start-10 lg:pb-3">
              <p className="text-base leading-relaxed text-muted">
                Pilihan kami bulan ini dari seluruh koleksi. Buka salah satunya
                untuk melihat kurva aroma dan ukuran botolnya.
              </p>
              <Button asChild variant="link" className="mt-4">
                <Link href="/koleksi">
                  Semua koleksi <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Reveal>
          </div>

          <div className="mt-14 md:mt-20">
            <FeaturedStack products={featuredProducts} />
          </div>
        </section>
      ) : null}

      {/* Pita nama varian memisahkan dua bab yang sama-sama padat, sekaligus
          menunjukkan bahwa dua varian tadi hanya sebagian kecil koleksi. */}
      <section aria-label="Semua varian" className="mt-24 md:mt-36">
        <VariantMarquee products={products} />
      </section>

      {/* Tesis situs: aroma bisa dilihat sebelum dicium.
          Kebalikan dari bab unggulan: grafik dibiarkan selebar mungkin, judul
          bergeser ke kanan, dan penjelasan menunggu di bawah grafik. Yang
          dibaca lebih dulu adalah bentuk kurvanya, baru kata-katanya. */}
      <section aria-labelledby="sillage" className="shell pt-20 md:pt-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <Reveal className="order-last lg:order-first lg:col-span-4 lg:pb-3">
            <p className="max-w-sm text-base leading-relaxed text-muted">
              Masalah belanja parfum online bukan pilihannya terlalu sedikit,
              tapi Anda tidak tahu aromanya akan jadi seperti apa tiga jam
              setelah disemprot.
            </p>
          </Reveal>
          <HeadingReveal
            as="h2"
            id="sillage"
            className="font-display text-statement font-light lg:col-span-7 lg:col-start-6 lg:text-right"
          >
            Lihat dulu, <span className="italic">baru cium</span>
          </HeadingReveal>
        </div>

        {/* Grafik hanyut sedikit terhadap judul di atasnya, jadi keduanya tidak
            terbaca terkunci pada satu papan yang kaku. */}
        <Parallax className="mt-12 min-w-0 md:mt-16" distance={-24}>
          <Reveal>
            <ScentTimeline product={heroProduct} />
          </Reveal>
        </Parallax>

        <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:items-start">
          <Reveal className="lg:col-span-6 lg:col-start-6">
            <p className="text-base leading-relaxed text-muted">
              Setiap varian kami gambarkan sebagai kurva: kapan tiap note
              muncul, kapan memuncak, dan kapan hilang. Yang Anda lihat ini{" "}
              <span className="text-ink">{heroProduct.name}</span>. Sentuh nama
              note mana pun untuk melihat jejaknya sendiri.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link href={`/koleksi/${heroProduct.slug}`}>
                Lihat {heroProduct.name} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* The Bold Philosophy, PRD 5.1.
          Satu-satunya bab tanpa tombol dan tanpa gambar. Kalimatnya mendapat
          tinta kata demi kata mengikuti scroll, jadi pernyataan ini punya laju
          baca sendiri, dan udaranya dibuat paling panjang supaya terasa jeda. */}
      <section aria-labelledby="filosofi" className="shell py-32 md:py-52">
        <IgniteText
          id="filosofi"
          className="max-w-5xl font-display text-display font-light text-balance"
          start="top 80%"
          end="bottom 45%"
        >
          Kami meracik identitas, lalu menuangkannya ke botol 30 ml dan 50 ml
          yang menemani setiap langkah berani Anda.
        </IgniteText>

        <Reveal className="mt-12 flex justify-end md:mt-16">
          <p className="max-w-xs text-base leading-relaxed text-muted">
            Racikan berkualitas dunia, dengan karakter yang disesuaikan untuk
            orang yang memang ingin tampil beda.
          </p>
        </Reveal>
      </section>

      {/* Penutup: dua jalan keluar dalam satu bidang. Kuis mendapat porsi besar
          dan satu-satunya tombol magnetik di layar ini; koleksi berdiri di
          sisi kanan sebagai jalan pintas bagi yang sudah tahu yang dicari. */}
      <section
        aria-labelledby="ajakan-kuis"
        className="border-t border-line bg-surface"
      >
        <div className="shell grid gap-16 py-20 md:py-28 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <CharReveal
              as="h2"
              id="ajakan-kuis"
              className="font-display text-statement font-light text-balance"
            >
              Empat pertanyaan, satu aroma yang benar-benar Anda
            </CharReveal>
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-lg text-base leading-relaxed text-muted md:text-lg">
                Jawab tentang cara Anda hadir di ruangan, bukan tentang bergamot
                dan oud. Kami yang menerjemahkannya ke {products.length} varian.
              </p>
              <Magnetic className="mt-10">
                <Button asChild size="lg">
                  <Link href="/kuis">Mulai kuis</Link>
                </Button>
              </Magnetic>
            </Reveal>
          </div>

          <div className="flex flex-col justify-end lg:col-span-4 lg:col-start-9">
            {/* Satu batang per varian, berwarna cairannya dan setinggi daya
                tahannya. Dekoratif bagi pembaca layar karena isinya sudah
                tersedia lengkap di halaman koleksi. */}
            <Reveal
              stagger={0.04}
              className="flex h-40 items-end gap-1.5 md:h-52"
            >
              {products.map((product) => (
                <span
                  key={product.slug}
                  aria-hidden="true"
                  className="flex-1 rounded-full"
                  style={{
                    backgroundColor: product.juice,
                    opacity: 0.75,
                    height: `${(product.longevity[1] / longestWear) * 100}%`,
                  }}
                />
              ))}
            </Reveal>
            <p className="mt-8 text-base leading-relaxed text-muted">
              Sudah tahu yang dicari? Semua varian ada di satu halaman, lengkap
              dengan harganya.
            </p>
            <Button asChild variant="outline" className="mt-6 self-start">
              <Link href="/koleksi">
                Lihat koleksi <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
