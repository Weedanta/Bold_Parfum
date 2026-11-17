import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/** Palet situs, ditulis ulang karena Satori tidak membaca token CSS. */
export const BRAND = {
  bg: "#0c0b0a",
  gold: "#e3cfa6",
} as const;

/**
 * Lambang "B" emas di atas latar gelap, dipakai semua ikon (favicon PNG, apple
 * touch icon, ikon PWA). `maskable` memberi ruang aman di tiap sisi supaya
 * huruf tidak terpotong saat OS membulatkan atau menjepit ikon.
 */
export async function brandIcon(
  px: number,
  opts: { rounded?: boolean; maskable?: boolean } = {},
) {
  const font = await readFile(
    path.join(process.cwd(), "assets", "fonts", "Fraunces-Display.ttf"),
  );
  const glyph = Math.round(px * (opts.maskable ? 0.5 : 0.7));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.bg,
          color: BRAND.gold,
          fontFamily: "Fraunces",
          fontSize: glyph,
          lineHeight: 1,
          borderRadius: opts.rounded ? Math.round(px * 0.22) : 0,
        }}
      >
        B
      </div>
    ),
    {
      width: px,
      height: px,
      fonts: [{ name: "Fraunces", data: font, style: "normal", weight: 400 }],
    },
  );
}
