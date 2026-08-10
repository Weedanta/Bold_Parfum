import { notFound } from "next/navigation";

import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { OG_CONTENT_TYPE, OG_SIZE, productOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Hasil Scent Profiler The Bold";

export async function generateStaticParams() {
  return (await getCatalog()).map((product) => ({ slug: product.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return productOgImage({
    product,
    eyebrow: "Hasil Scent Profiler",
    kicker: "Aroma signature kamu",
  });
}
