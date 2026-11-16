import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";

import { site } from "@/lib/site";
import { CATEGORY_LABELS, VIBE_LABELS } from "@/lib/products";
import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottleImage } from "@/components/bottle-image";
import { ProductPurchase } from "@/components/product-purchase";
import { ScentTimeline } from "@/components/scent-timeline";
import { ShareResult } from "@/components/share-result";
import { Reveal } from "@/components/motion/reveal";
import { CharReveal } from "@/components/motion/char-reveal";
import { HeadingReveal } from "@/components/motion/heading-reveal";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { Parallax } from "@/components/motion/parallax";
import { Magnetic } from "@/components/motion/magnetic";

export async function generateStaticParams() {
  return (await getCatalog()).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = `Aroma signature kamu: ${product.name}`;
  const description = `${product.story} Lihat kurva sillage ${product.name} dan klaim botolmu.`;

  return {
    title,
    description,
    alternates: { canonical: `/hasil/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${title} | ${site.name}`,
      description,
      url: `/hasil/${product.slug}`,
    },
  };
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <>
      {/*
        Pembukaan hasil. Seluruh ruangan diwarnai cairan varian pemenang,
        melanjutkan cahaya yang tumbuh di layar racikan kuis, lalu namanya
        muncul huruf demi huruf. Ini satu-satunya CharReveal di halaman ini:
        nama varian adalah jawabannya, jadi dialah yang mendapat panggung.

        Bidang warna naik ke balik header (margin negatif), sama seperti hero
        beranda, supaya tidak ada pita hitam di atas atmosfernya.
      */}
      <section className="relative -mt-16 overflow-hidden pt-16 md:-mt-20 md:pt-20">
        <Parallax distance={70} className="pointer-events-none absolute inset-x-0 -top-12 -bottom-12">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: [
                `radial-gradient(60% 55% at 78% 22%, ${product.juice}38, transparent 72%)`,
                `radial-gradient(55% 50% at 8% 88%, ${product.atmosphere.from}26, transparent 70%)`,
              ].join(", "),
            }}
          />
        </Parallax>

        <div className="shell relative grid gap-12 pt-12 pb-20 md:pt-20 md:pb-28 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <h1 className="font-display font-light">
              <span className="block text-lg text-muted sm:text-xl">
                Aroma signature kamu adalah
              </span>
              <CharReveal
                as="span"
                trigger="load"
                delay={0.15}
                className="mt-3 block text-hero"
              >
                {product.name}
              </CharReveal>
            </h1>

            <Reveal delay={0.55}>
              <p className="mt-8 max-w-md font-display text-title font-light text-ink/85 italic">
                {product.subtitle}
              </p>
              <ul className="mt-8 flex flex-wrap gap-1.5">
                <li>
                  <Badge variant="gold" size="md">
                    {CATEGORY_LABELS[product.category]}
                  </Badge>
                </li>
                <li>
                  <Badge size="md">{product.family}</Badge>
                </li>
                {product.vibes.map((vibe) => (
                  <li key={vibe}>
                    <Badge size="md">{VIBE_LABELS[vibe]}</Badge>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Botol di kolom sempit dan sedikit menjorok ke bawah dari baris
              judul, jadi komposisinya miring, bukan dua blok sama berat. */}
          <div className="lg:col-span-5 lg:translate-y-16">
            <ScrollScale from={0.9} dimOnExit={false} className="aspect-4/5 max-h-[64svh] w-full border border-line/70 lg:max-h-none">
              <BottleImage
                product={product}
                sizes="(min-width: 1024px) 38vw, 100vw"
                priority
                parallax={24}
                className="size-full"
              />
            </ScrollScale>
          </div>
        </div>
      </section>

      {/*
        Cerita dan pembelian. Bagian ini sengaja rapat: setelah pembukaan yang
        lapang, pembaca yang sudah yakin langsung menemukan ukuran, harga, dan
        tombol beli tanpa harus menggulung jauh.
      */}
      <section className="shell grid gap-14 pt-16 md:pt-24 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <Reveal>
            <p className="font-display text-[clamp(1.6rem,1.1rem+1.9vw,2.6rem)] leading-[1.18] font-light text-balance">
              {product.story}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Button asChild variant="link">
              <Link href={`/koleksi/${product.slug}`}>
                Halaman lengkap {product.name}
                <ArrowRight />
              </Link>
            </Button>
            <Link
              href="/kuis"
              className="group inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors duration-300 hover:text-ink"
            >
              <RotateCcw className="size-4 transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:-rotate-180" />
              Ulangi tes
            </Link>
          </Reveal>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Reveal className="lg:sticky lg:top-28">
            <ProductPurchase product={product} fromQuiz />
            <div className="mt-8 border-t border-line pt-7">
              <p className="text-caption text-muted">
                Kirim hasilnya ke teman, atau simpan tautannya untuk nanti.
              </p>
              <div className="mt-4">
                <ShareResult
                  productName={product.name}
                  url={`${site.url}/hasil/${product.slug}`}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="kurva-hasil" className="shell pt-32 md:pt-44">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <HeadingReveal
            as="h2"
            id="kurva-hasil"
            className="font-display text-display font-light text-balance md:text-statement lg:col-span-8"
          >
            Begini {product.name} bekerja sepanjang hari
          </HeadingReveal>
          <Reveal delay={0.15} className="lg:col-span-4">
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Geser di atas kurva untuk melihat note mana yang paling terasa di
              tiap jam, dari semprotan pertama sampai sisa di kulit.
            </p>
          </Reveal>
        </div>
        <Reveal className="mt-14">
          <ScentTimeline product={product} />
        </Reveal>
      </section>

      {/*
        Penutup. Bukan kotak ajakan di tengah: satu kalimat besar di kiri dan
        dua jalan keluar di kanan, dipisah hairline, seperti halaman akhir buku.
      */}
      <section className="shell pt-32 md:pt-40">
        <div className="hairline grid gap-10 pt-12 md:pt-16 lg:grid-cols-12 lg:gap-10">
          <HeadingReveal
            as="h2"
            className="font-display text-display font-light text-balance lg:col-span-6"
          >
            Masih ingin <em className="italic">membandingkan</em>?
          </HeadingReveal>
          <Reveal className="flex flex-col gap-8 lg:col-span-5 lg:col-start-8">
            <p className="text-base leading-relaxed text-muted">
              {product.name} paling cocok dengan jawabanmu, tapi bukan
              satu-satunya. Ada {catalog.length - 1} varian lain yang bisa dicium lewat
              kurvanya masing-masing.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Magnetic>
                <Button asChild size="lg">
                  <Link href={`/koleksi?kategori=${product.category}`}>
                    Varian {product.category} lainnya
                    <ArrowRight />
                  </Link>
                </Button>
              </Magnetic>
              <Button asChild variant="link">
                <Link href="/koleksi">Semua {catalog.length} varian</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
