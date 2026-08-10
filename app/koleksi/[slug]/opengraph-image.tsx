import { notFound } from "next/navigation";

import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { OG_CONTENT_TYPE, OG_SIZE, productOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Kartu varian parfum The Bold";

export async function generateStaticParams() {
  return (await getCatalog()).map((product) => ({ slug: product.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return productOgImage({
    product,
    eyebrow: product.category === "pria" ? "For Him" : "For Her",
    kicker: `${product.family}  ·  ${product.longevity[0]}-${product.longevity[1]} jam  ·  30 & 50 ml`,
  });
}
