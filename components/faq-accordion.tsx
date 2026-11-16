"use client";

import * as Accordion from "@radix-ui/react-accordion";

export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * Daftar FAQ di atas Radix Accordion, jadi keyboard (panah, Home, End),
 * aria-expanded, dan aria-controls diurus pustaka yang sudah teruji.
 *
 * Panel dipasang permanen (forceMount) supaya bisa dianimasikan buka dan
 * tutup. Tanpa itu Radix mencabut isinya seketika saat ditutup, dan satu-satunya
 * cara menunda pencabutan adalah keyframes CSS global. Tingginya berpindah
 * lewat trik grid 0fr ke 1fr, lalu panel yang tertutup dibuat `invisible`
 * sehingga tetap keluar dari urutan tab dan pohon aksesibilitas. Visibility
 * ikut ditransisikan, jadi saat menutup ia baru berganti setelah panel selesai
 * mengecil.
 */
export function FaqAccordion({ items }: { items: readonly FaqItem[] | FaqItem[] }) {
  return (
    <Accordion.Root
      type="multiple"
      // Item pertama terbuka seperti spec/mockup awal.
      defaultValue={["faq-0"]}
      className="border-t border-line"
    >
      {items.map((item, index) => (
        <Accordion.Item
          key={item.question}
          value={`faq-${index}`}
          className="group/item relative border-b border-line"
        >
          {/* Garis champagne yang tumbuh dari kiri di bawah item yang terbuka. */}
          <span
            aria-hidden="true"
            className="absolute right-0 -bottom-px left-0 h-px origin-left scale-x-0 bg-gold/70 transition-transform duration-1000 ease-[var(--ease-out-soft)] group-data-[state=open]/item:scale-x-100"
          />

          <Accordion.Header asChild>
            <h3>
              <Accordion.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-6 py-7 text-left">
                <span className="font-display text-xl leading-snug font-light text-ink/85 transition-[color,transform] duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-1 group-hover:text-ink group-data-[state=open]:text-ink sm:text-2xl">
                  {item.question}
                </span>

                {/* Tanda tambah yang garis tegaknya rebah jadi tanda kurang. */}
                <span
                  aria-hidden="true"
                  className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-line transition-colors duration-500 group-hover:border-gold/60 group-data-[state=open]:border-gold/60"
                >
                  <span className="absolute h-px w-3.5 bg-ink" />
                  <span className="absolute h-3.5 w-px bg-ink transition-transform duration-500 ease-[var(--ease-in-out-silk)] group-data-[state=open]:rotate-90" />
                </span>
              </Accordion.Trigger>
            </h3>
          </Accordion.Header>

          <Accordion.Content
            forceMount
            className="grid transition-[grid-template-rows,visibility] duration-700 ease-[var(--ease-out-soft)] data-[state=closed]:invisible data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]"
          >
            <div className="overflow-hidden">
              <p className="max-w-2xl pb-8 text-sm leading-relaxed text-muted transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)] group-data-[state=closed]/item:-translate-y-2 group-data-[state=closed]/item:opacity-0 sm:text-base">
                {item.answer}
              </p>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
