import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { site } from "@/lib/site";
import type { Product } from "@/lib/products";
import { areaPath, layerCurves, linePath, type Box } from "@/lib/sillage";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const CURVE_BOX: Box = { width: 1200, height: 190, padTop: 8, padBottom: 0 };

/**
 * Satori tidak bisa memproses variable font Fraunces, jadi assets/fonts berisi
 * instance statis yang dipotong pada setelan sumbu yang sama dengan situs
 * (wght 300, opsz 144, SOFT 24, WONK 1). Cara membuat ulang ada di
 * scripts/build-og-fonts.py.
 */
async function loadFonts() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  const [display, mono] = await Promise.all([
    readFile(path.join(dir, "Fraunces-Display.ttf")),
    readFile(path.join(dir, "IBMPlexMono-Regular.ttf")),
  ]);
  return [
    { name: "Fraunces", data: display, style: "normal" as const, weight: 400 as const },
    { name: "PlexMono", data: mono, style: "normal" as const, weight: 400 as const },
  ];
}

/**
 * Kartu OG bersama untuk halaman produk dan halaman hasil kuis.
 *
 * Kurva sillage ikut digambar supaya tautan yang dibagikan ke WhatsApp atau
 * Instagram langsung terbaca sebagai The Bold, bukan kartu teks generik.
 */
export async function productOgImage({
  product,
  eyebrow,
  kicker,
}: {
  product: Product;
  eyebrow: string;
  kicker: string;
}) {
  const fonts = await loadFonts();
  const { curves } = layerCurves(product.notes, 90);
  const layers = (["base", "heart", "top"] as const).map((layer, index) => ({
    layer,
    area: areaPath(curves.get(layer)!, CURVE_BOX),
    line: linePath(curves.get(layer)!, CURVE_BOX),
    fillOpacity: 0.16 + index * 0.08,
    strokeOpacity: 0.45 + index * 0.2,
  }));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0B0C10",
          backgroundImage: `radial-gradient(900px 520px at 88% 6%, ${product.atmosphere.from}44, transparent 68%)`,
          padding: "64px 72px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "PlexMono",
              fontSize: 22,
              letterSpacing: 6,
              color: "#C5A880",
              textTransform: "uppercase",
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "PlexMono",
              fontSize: 20,
              letterSpacing: 5,
              color: "#A0AAB2",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 132,
              lineHeight: 1,
              color: "#FFFFFF",
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontFamily: "Fraunces",
              fontSize: 40,
              color: product.juice,
            }}
          >
            {product.subtitle}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontFamily: "PlexMono",
              fontSize: 22,
              letterSpacing: 3,
              color: "#A0AAB2",
            }}
          >
            {kicker}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            height: 190,
          }}
        >
          <svg width={CURVE_BOX.width} height={CURVE_BOX.height}>
            {layers.map((item) => (
              <g key={item.layer}>
                <path d={item.area} fill={product.juice} fillOpacity={item.fillOpacity} />
                <path
                  d={item.line}
                  fill="none"
                  stroke={product.juice}
                  strokeOpacity={item.strokeOpacity}
                  strokeWidth={2.5}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
