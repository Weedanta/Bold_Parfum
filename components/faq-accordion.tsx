"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: readonly FaqItem[] | FaqItem[] }) {
  // Buka item pertama secara default seperti spec/mockup awal
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  function toggle(index: number) {
    setOpenIndexes((current) =>
      current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index],
    );
  }

  return (
    <div className="mt-12 border-t border-line">
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-btn-${index}`;

        return (
          <div key={item.question} className="border-b border-line">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left transition-colors hover:text-gold"
              >
                <span className="font-display text-lg leading-snug transition-colors sm:text-xl">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border border-line/60 font-mono text-gold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-gold/50 group-hover:bg-gold/10",
                    isOpen && "rotate-45 border-gold/40 bg-gold/10 text-gold-bright",
                  )}
                >
                  <Plus className="size-4 transition-transform duration-300" />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-3xl pb-7 text-sm leading-relaxed text-muted transition-transform duration-300 ease-out sm:text-base">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
