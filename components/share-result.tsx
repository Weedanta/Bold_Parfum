"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";

type Props = { productName: string; url: string };

/**
 * NFR-3 PRD: hasil kuis harus bisa dibagikan. Karena /hasil/<slug> adalah rute
 * nyata yang dirender statis, tautan yang dibagikan membawa preview OG yang benar.
 */
export function ShareResult({ productName, url }: Props) {
  const [copied, setCopied] = useState(false);
  const text = `Aroma kepribadianku adalah ${productName} by ${site.name}.`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${productName} · ${site.name}`, text, url });
        return;
      } catch {
        // Pengguna membatalkan sheet berbagi; jatuh ke salin tautan.
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="outline" size="sm" onClick={share}>
        <Share2 />
        Bagikan hasil
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={copy}>
        {copied ? <Check /> : <Link2 />}
        {copied ? "Tautan disalin" : "Salin tautan"}
      </Button>
    </div>
  );
}
