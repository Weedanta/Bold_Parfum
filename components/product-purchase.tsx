"use client";

import { useState } from "react";
import { MessageCircle, ShoppingBag } from "lucide-react";

import { cn, formatIDR } from "@/lib/utils";
import { bisaDibeli, type Product, type Size } from "@/lib/products";
import { whatsappGeneralLink, whatsappProductLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/stock-badge";
import { Magnetic } from "@/components/motion/magnetic";
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
  const dijual = bisaDibeli(product.stock);

  return (
    <div>
      {product.stock === "tersedia" ? null : (
        <div className="mb-6">
          <StockBadge stock={product.stock} />
        </div>
      )}

      {/* Ukuran tetap bisa dipilih walau stoknya kosong: harganya masih informasi
          yang berguna bagi orang yang sedang menimbang untuk nanti. */}
      <fieldset>
        <legend className="text-caption text-muted">Pilih ukuran botol</legend>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {product.sizes.map((option) => {
            const isActive = option.ml === size;
            return (
              <button
                key={option.ml}
                type="button"
                onClick={() => setSize(option.ml)}
                aria-pressed={isActive}
                className={cn(
                  "group/size relative rounded-[3px] border px-5 py-4 text-left transition-[border-color,background-color] duration-500 ease-[var(--ease-out-soft)]",
                  isActive
                    ? "border-gold-bright/70 bg-raised"
                    : "border-line hover:border-ink/30",
                )}
              >
                {/* Titik kecil menandai pilihan selain warna bingkai, supaya
                    keadaan aktif tidak hanya bergantung pada beda warna. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-4 right-4 size-1.5 rounded-full bg-gold-bright transition-[opacity,scale] duration-500",
                    isActive ? "scale-100 opacity-100" : "scale-0 opacity-0",
                  )}
                />
                <span className="block font-display text-2xl font-light">{option.ml} ml</span>
                <span className="mt-1.5 block font-mono text-xs text-muted">
                  {formatIDR(option.price)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Stok kosong menutup dua-duanya sekaligus, tombol beli dan keranjang.
          Menutup satu saja hanya memindahkan kekecewaan ke langkah berikutnya. */}
      <div className="mt-8 flex flex-col gap-3">
        {dijual ? (
          <>
            {/* Satu-satunya tombol yang ikut tertarik ke kursor di halaman ini:
                tombol yang benar-benar menutup penjualan. */}
            <Magnetic className="block" strength={0.12}>
              <Button asChild size="lg" className="w-full">
                <a
                  href={whatsappProductLink(product, size, { fromQuiz })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle />
                  {product.stock === "preorder" ? "Preorder" : "Beli"} via WhatsApp{" "}
                  <span aria-hidden="true" className="h-4 w-px bg-current opacity-25" />
                  <span className="font-mono text-[0.8rem]">{formatIDR(selected.price)}</span>
                </a>
              </Button>
            </Magnetic>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => cart.add(product.slug, size)}
            >
              <ShoppingBag />
              Tambah ke keranjang
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="lg" disabled>
              <ShoppingBag />
              Stok kosong
            </Button>

            {/* Jalan keluarnya tetap dibuka, hanya percakapannya yang berbeda:
                bukan memesan, tapi menanyakan kapan varian ini kembali. */}
            <Button asChild variant="outline" size="lg">
              <a href={whatsappGeneralLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle />
                Tanya kapan tersedia
              </a>
            </Button>
          </>
        )}
      </div>

      {product.stock === "preorder" ? (
        <p className="mt-6 text-xs leading-relaxed text-muted">
          Preorder: pesanan diterima sekarang, pengiriman menyusul setelah stok masuk. Admin
          mengabari perkiraan waktunya lewat WhatsApp.
        </p>
      ) : null}

      {product.stock === "kosong" ? (
        <p className="mt-6 text-xs leading-relaxed text-muted">
          Varian ini sedang kosong. Tanyakan lewat WhatsApp kalau ingin dikabari saat stoknya
          kembali.
        </p>
      ) : null}

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Garansi kepuasan: segel belum dibuka bisa ditukar varian lain dalam 7 hari setelah
        barang diterima.
      </p>
    </div>
  );
}
