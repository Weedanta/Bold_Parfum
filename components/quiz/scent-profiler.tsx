"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { findInCatalog } from "@/lib/products";
import { useCatalog } from "@/components/catalog-provider";
import { createBrowserStore } from "@/lib/browser-store";
import {
  TOTAL_STEPS,
  firstUnansweredStep,
  matchProduct,
  parseAnswers,
  questions,
  type Answers,
  type OptionId,
} from "@/lib/quiz";
import { gsap, prefersReducedMotion } from "@/components/motion/use-gsap";
import { BLEND_DURATION_MS, Blending } from "@/components/quiz/blending";

const EMPTY: Answers = {};
const FALLBACK_JUICE = "#c5a880";

// Progres disimpan di sessionStorage: cukup untuk bertahan dari refresh, dan
// hilang saat tab ditutup supaya kuis berikutnya mulai bersih.
const answersStore = createBrowserStore<Answers>({
  key: "thebold.quiz.v1",
  area: "session",
  parse: parseAnswers,
  empty: EMPTY,
});

export function ScentProfiler() {
  const router = useRouter();
  const catalog = useCatalog();
  const answers = useSyncExternalStore(
    answersStore.subscribe,
    answersStore.getSnapshot,
    answersStore.getServerSnapshot,
  );

  // Null berarti "ikuti progres tersimpan"; angka berarti pengguna menavigasi sendiri.
  const [stepOverride, setStepOverride] = useState<number | null>(null);
  const [blending, setBlending] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = stepOverride ?? firstUnansweredStep(answers);
  const question = questions[step];
  const progress = (step + (answers[question.id] ? 1 : 0)) / TOTAL_STEPS;

  const animateCard = useCallback((direction: 1 | -1) => {
    const card = cardRef.current;
    if (!card || prefersReducedMotion()) return;
    gsap.fromTo(
      card,
      { opacity: 0, y: 26 * direction },
      { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
    );
  }, []);

  useEffect(() => {
    animateCard(1);
  }, [step, animateCard]);

  function choose(optionId: OptionId) {
    const next = { ...answers, [question.id]: optionId };
    answersStore.set(next);

    if (step < questions.length - 1) {
      setStepOverride(step + 1);
      return;
    }

    const slug = matchProduct(next, catalog);
    if (!slug) return;
    setBlending(true);
    window.setTimeout(() => router.push(`/hasil/${slug}`), BLEND_DURATION_MS);
  }

  if (blending) {
    const preview = matchProduct(answers, catalog);
    const juice = (preview && findInCatalog(catalog, preview)?.juice) || FALLBACK_JUICE;
    return (
      <div className="flex min-h-[70svh] flex-col items-center justify-center px-6 text-center">
        <Blending juice={juice} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70svh] w-full max-w-2xl flex-col justify-center px-6 py-16">
      <div className="flex items-center gap-5">
        <span className="font-mono text-label tracking-label text-muted uppercase">
          Langkah {step + 1} dari {TOTAL_STEPS}
        </span>
        <div
          className="h-px flex-1 bg-line"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label="Kemajuan kuis"
        >
          <div
            className="h-px bg-gold transition-[width] duration-700 ease-[var(--ease-out-soft)]"
            style={{ width: `${Math.max(progress, 0.02) * 100}%` }}
          />
        </div>
      </div>

      <div ref={cardRef} className="mt-14">
        <p className="font-mono text-label tracking-label text-gold uppercase">
          {question.eyebrow}
        </p>
        <h1 className="mt-6 font-display text-title font-light text-balance">
          {question.prompt}
        </h1>

        <ul className="mt-10 space-y-3">
          {question.options.map((option) => {
            const isChosen = answers[question.id] === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => choose(option.id)}
                  className={cn(
                    "flex w-full items-start gap-4 border px-5 py-5 text-left transition-colors duration-300",
                    isChosen
                      ? "border-gold bg-gold/10"
                      : "border-line hover:border-gold/60 hover:bg-surface",
                  )}
                >
                  <span className="mt-0.5 font-mono text-xs text-gold uppercase">
                    {option.id}
                  </span>
                  <span className="text-sm leading-relaxed sm:text-base">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {step > 0 ? (
        <button
          type="button"
          onClick={() => {
            setStepOverride(step - 1);
            animateCard(-1);
          }}
          className="mt-10 inline-flex items-center gap-2 self-start text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </button>
      ) : null}
    </div>
  );
}
