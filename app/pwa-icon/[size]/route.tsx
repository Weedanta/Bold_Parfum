import { notFound } from "next/navigation";

import { brandIcon } from "@/lib/icon";

const VARIANTS = {
  "192": { px: 192, maskable: false },
  "512": { px: 512, maskable: false },
  "maskable-512": { px: 512, maskable: true },
} as const;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((size) => ({ size }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const variant = VARIANTS[size as keyof typeof VARIANTS];
  if (!variant) notFound();

  const image = await brandIcon(variant.px, { maskable: variant.maskable });
  image.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return image;
}
