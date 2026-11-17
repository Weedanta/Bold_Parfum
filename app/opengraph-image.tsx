import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { site } from "@/lib/site";
import { BRAND } from "@/lib/icon";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${site.name}, ${site.tagline}`;

/** Kartu bagikan default (beranda dan halaman tanpa kartu sendiri). */
export default async function Image() {
  const font = await readFile(
    path.join(process.cwd(), "assets", "fonts", "Fraunces-Display.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.bg,
          color: BRAND.gold,
          fontFamily: "Fraunces",
        }}
      >
        <div style={{ fontSize: 150, lineHeight: 1 }}>{site.name}</div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            letterSpacing: 8,
            color: "#a39b8f",
            textTransform: "uppercase",
          }}
        >
          {site.tagline}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Fraunces", data: font, style: "normal", weight: 400 }],
    },
  );
}
