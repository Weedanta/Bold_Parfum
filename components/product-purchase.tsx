"use client";

import { useState } from "react";
import { MessageCircle, ShoppingBag } from "lucide-react";

import { cn, formatIDR } from "@/lib/utils";
import type { Product, Size } from "@/lib/products";
import { whatsappProductLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";

type Props = {
  product: Product;
  /** Menandai pesanan berasal dari hasil kuis supaya pesan WhatsApp menyebutkannya. */
  fromQuiz?: boolean;
};

export function ProductPurchase({ product, fromQuiz }: Props) {
  const cart = useCart();
  const [size, setSize] = useState<Size>(product.sizes[product.sizes.length - 1].ml);

  const selected = product.sizes.find((s) => s.ml === size)!;

  return (
    <div>
      <fieldset>
        <legend className="font-mono text-label tracking-label text-muted uppercase">
          Ukuran
        </legend>
        <div className="mt-4 flex gap-3">
          {product.sizes.map((option) => {
            const isActive = option.ml === size;
            return (
              <button
                key={option.ml}
                type="button"
                onClick={() => setSize(option.ml)}
                aria-pressed={isActive}
                className={cn(
                  "flex-1 border px-4 py-4 text-left transition-colors duration-300",
                  isActive
                    ? "border-gold bg-gold/10"
                    : "border-line hover:border-gold/50",
                )}
              >
                <span className="block font-display text-xl">{option.ml} ml</span>
                <span className="mt-1 block font-mono text-xs text-gold">
                  {formatIDR(option.price)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex flex-col gap-3">
        <Button asChild size="lg">
          <a
            href={whatsappProductLink(product, size, { fromQuiz })}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            Beli via WhatsApp &middot; {formatIDR(selected.price)}
          </a>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => cart.add(product.slug, size)}
        >
          <ShoppingBag />
          Tambah ke keranjang
        </Button>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Garansi kepuasan: segel belum dibuka bisa ditukar varian lain dalam 7 hari setelah
        barang diterima.
      </p>
    </div>
  );
}
