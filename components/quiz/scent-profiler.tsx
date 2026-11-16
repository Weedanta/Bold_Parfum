"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
  type QuizQuestion,
} from "@/lib/quiz";
import { gsap, prefersReducedMotion, SplitText, useGsapScope } from "@/components/motion/use-gsap";
import { BLEND_DURATION_MS, Blending } from "@/components/quiz/blending";

const EMPTY: Answers = {};
const FALLBACK_JUICE = "#c9b28a";

// Progres disimpan di sessionStorage: cukup untuk bertahan dari refresh, dan
// hilang saat tab ditutup supaya kuis berikutnya mulai bersih.
const answersStore = createBrowserStore<Answers>({
  key: "thebold.quiz.v1",
  area: "session",
  parse: parseAnswers,
  empty: EMPTY,
});

/**
 * Posisi cahaya latar untuk tiap pertanyaan. Cahayanya berpindah pelan dari
 * satu sudut ke sudut lain, jadi tiap pertanyaan terasa seperti ruangan baru
 * walau tata letaknya sama. Nilainya persen dari lebar dan tinggi panggung.
 */
const GLOW_POSITIONS: [number, number][] = [
  [72, 18],
  [18, 30],
  [80, 70],
  [30, 82],
];

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
  const stageRef = useRef<HTMLDivElement>(null);
  // Mengunci klik selama pertanyaan lama sedang keluar, supaya ketukan ganda
  // tidak melompati satu pertanyaan.
  const leavingRef = useRef(false);

  const step = stepOverride ?? firstUnansweredStep(answers);
  const question = questions[step];
  const progress = (step + (answers[question.id] ? 1 : 0)) / TOTAL_STEPS;
  // Transisi CSS pada transform sudah cukup untuk pergeseran cahaya ini, dan
  // aturan reduced motion global otomatis mematikannya.
  const [glowX, glowY] = GLOW_POSITIONS[step % GLOW_POSITIONS.length];

  /**
   * Pertanyaan lama keluar dulu, baru state berganti. Jawaban meluncur ke arah
   * yang sama dengan langkahnya (maju ke kiri, mundur ke kanan), judul memudar
   * naik. Tanpa animasi, langsung lanjut.
   */
  const leave = useCallback((direction: 1 | -1, then: () => void) => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) {
      then();
      return;
    }
    leavingRef.current = true;
    const timeline = gsap.timeline({
      onComplete: () => {
        leavingRef.current = false;
        then();
      },
    });
    timeline.to(
      stage.querySelectorAll("[data-option]"),
      {
        x: -36 * direction,
        opacity: 0,
        duration: 0.42,
        stagger: 0.04,
        ease: "power2.in",
      },
      0.18,
    );
    timeline.to(
      stage.querySelectorAll("[data-prompt], [data-step-caption]"),
      { y: -18, opacity: 0, duration: 0.45, ease: "power2.in" },
      0.22,
    );
  }, []);

  function choose(optionId: OptionId) {
    if (leavingRef.current) return;
    const next = { ...answers, [question.id]: optionId };
    // Langkah dikunci di posisi sekarang dulu: tanpa ini, menyimpan jawaban
    // langsung memindahkan step turunan ke pertanyaan berikutnya sebelum
    // animasi keluar sempat berjalan.
    setStepOverride(step);
    answersStore.set(next);

    if (step < questions.length - 1) {
      leave(1, () => setStepOverride(step + 1));
      return;
    }

    const slug = matchProduct(next, catalog);
    if (!slug) return;
    leave(1, () => {
      setBlending(true);
      window.setTimeout(() => router.push(`/hasil/${slug}`), BLEND_DURATION_MS);
    });
  }

  function back() {
    if (leavingRef.current || step === 0) return;
    leave(-1, () => setStepOverride(step - 1));
  }

  if (blending) {
    const preview = matchProduct(answers, catalog);
    const juice = (preview && findInCatalog(catalog, preview)?.juice) || FALLBACK_JUICE;
    return (
      <div className="relative -mt-16 flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center md:-mt-20 md:pt-20">
        <Blending juice={juice} />
      </div>
    );
  }

  return (
    <div className="relative -mt-16 flex min-h-svh flex-col overflow-hidden pt-16 md:-mt-20 md:pt-20">
      {/* Cahaya ruangan. Satu bidang lembut yang berpindah per pertanyaan,
          bukan gradien hiasan: tugasnya memberi kedalaman pada panggung yang
          sebagian besar memang kosong. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 size-[70vmax] rounded-full opacity-[0.13] blur-3xl transition-transform duration-[2400ms] ease-[var(--ease-in-out-silk)]"
          style={{
            transform: `translate(-50%, -50%) translate(${glowX - 50}vw, ${glowY - 50}vh)`,
            backgroundImage:
              "radial-gradient(closest-side, var(--color-gold), transparent)",
          }}
        />
      </div>

      {/* Garis progres setipis rambut di tepi atas panggung. */}
      <div
        className="relative h-px w-full bg-line/70"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label="Kemajuan kuis"
      >
        <div
          className="h-px bg-gold-bright transition-[width] duration-1000 ease-[var(--ease-out-soft)]"
          style={{ width: `${Math.max(progress, 0.02) * 100}%` }}
        />
      </div>

      <div className="shell relative flex flex-1 flex-col py-10 md:py-14">
        <div className="flex min-h-11 items-center justify-between gap-6">
          <p className="text-caption text-muted" aria-live="polite">
            Pertanyaan {step + 1} dari {TOTAL_STEPS}
          </p>
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="group inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors duration-300 hover:text-ink"
            >
              <ArrowLeft className="size-4 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-x-1" />
              Pertanyaan sebelumnya
            </button>
          ) : null}
        </div>

        <div ref={stageRef} className="flex flex-1 flex-col justify-center">
          <QuestionStage
            key={step}
            question={question}
            chosen={answers[question.id]}
            isFirst={step === 0}
            onChoose={choose}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Satu pertanyaan sebagai satu panggung. Di-key per langkah oleh induknya,
 * jadi tiap pertanyaan baru adalah mount baru: judulnya naik baris demi baris
 * dari balik mask, lalu jawaban menyusul. Memecah teks hanya saat mount juga
 * menghindari SplitText mengubah DOM yang sedang dirender ulang React.
 */
function QuestionStage({
  question,
  chosen,
  isFirst,
  onChoose,
}: {
  question: QuizQuestion;
  chosen: OptionId | undefined;
  isFirst: boolean;
  onChoose: (id: OptionId) => void;
}) {
  const ref = useGsapScope<HTMLDivElement>(({ root, reduced }) => {
    if (reduced) return;

    const prompt = root.querySelector<HTMLElement>("[data-prompt]");
    const options = root.querySelectorAll("[data-option]");
    const caption = root.querySelector("[data-step-caption]");

    if (caption) gsap.from(caption, { opacity: 0, y: 10, duration: 0.8, ease: "power3.out" });

    if (prompt) {
      SplitText.create(prompt, {
        type: "lines",
        mask: "lines",
        aria: "auto",
        autoSplit: true,
        onSplit: (self) => {
          // Ruang untuk descender Fraunces, sama seperti HeadingReveal.
          gsap.set(self.lines, { paddingBottom: "0.16em" });
          gsap.set(self.masks, { marginBottom: "-0.16em" });
          return gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.1,
            stagger: 0.09,
            ease: "expo.out",
          });
        },
      });
    }

    gsap.from(options, {
      opacity: 0,
      y: 26,
      duration: 0.9,
      delay: 0.32,
      stagger: 0.07,
      ease: "power3.out",
    });
  }, []);

  return (
    <div ref={ref} className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
      <div className="lg:col-span-7">
        <p data-step-caption className="max-w-md text-sm leading-relaxed text-muted">
          {isFirst
            ? "Cuma empat pertanyaan singkat. Nggak perlu hafal istilah parfum, jawab saja sesuai keseharianmu."
            : "Pilih yang paling menggambarkan dirimu sehari-hari."}
        </p>
        <h1
          data-prompt
          className="mt-6 max-w-[18ch] font-display text-display font-light text-balance sm:max-w-[20ch] lg:text-[clamp(2.4rem,1rem+2.6vw,4rem)] lg:leading-[1.02]"
        >
          {question.prompt}
        </h1>
      </div>

      <ul className="border-t border-line lg:col-span-5">
        {question.options.map((option) => {
          const isChosen = chosen === option.id;
          return (
            <li key={option.id} data-option className="border-b border-line">
              <button
                type="button"
                onClick={() => onChoose(option.id)}
                aria-pressed={isChosen}
                className="group relative isolate flex w-full items-center gap-5 overflow-hidden py-6 pr-2 text-left sm:py-7"
              >
                {/* Lapisan sorot yang menyapu dari kiri. Hanya transform yang
                    bergerak, jadi hover tetap ringan di daftar panjang. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 -z-10 origin-left bg-linear-to-r from-gold/[0.09] to-transparent transition-transform duration-700 ease-[var(--ease-out-soft)]",
                    isChosen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100",
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative flex size-3 shrink-0 items-center justify-center rounded-full border transition-colors duration-500",
                    isChosen ? "border-gold-bright" : "border-faint group-hover:border-gold",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full bg-gold-bright transition-transform duration-500 ease-[var(--ease-out-soft)]",
                      isChosen ? "scale-100" : "scale-0",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "flex-1 text-base leading-snug transition-[color,transform] duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5 sm:text-lg",
                    isChosen ? "text-ink" : "text-ink/75 group-hover:text-ink",
                  )}
                >
                  {option.label}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className={cn(
                    "size-4 shrink-0 text-gold-bright transition-[opacity,transform] duration-500 ease-[var(--ease-out-soft)]",
                    isChosen
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
