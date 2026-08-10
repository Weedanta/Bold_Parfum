import assert from "node:assert/strict";
import { test } from "node:test";

import { matchProduct, questions, type Answers, type OptionId } from "@/lib/quiz";
import { seedProducts } from "@/lib/seed/products.seed";

/**
 * Katalog asli ada di Supabase, jadi uji ini memakai data seed sebagai fixture.
 * Skoringnya fungsi murni, dan data seed adalah 13 varian yang sama yang di-seed
 * ke database, jadi menguji tanpa jaringan tetap menguji perilaku yang nyata.
 */
const products = seedProducts;

function answer(target: OptionId, presence: OptionId, drive: OptionId, secret: OptionId): Answers {
  return { target, presence, drive, secret };
}

/**
 * Tiap kasus di bawah adalah kombinasi arketipe yang pemetaannya disebut
 * eksplisit di PRD 5.3. `expected` berisi semua varian yang PRD sebut sah untuk
 * kombinasi itu, PRD memang menyediakan dua pilihan pada sebagian cabang.
 */
const PRD_CASES: { name: string; answers: Answers; expected: string[] }[] = [
  {
    name: "Pria: elegan / ambisi / filosofis",
    answers: answer("a", "d", "b", "d"),
    expected: ["crown", "ether"],
  },
  {
    name: "Pria: fresh / kebebasan / santai",
    answers: answer("a", "b", "a", "a"),
    expected: ["azur", "visionary"],
  },
  {
    name: "Pria: bold / pesta / sisi liar",
    answers: answer("a", "c", "c", "b"),
    expected: ["ultra", "night-shift"],
  },
  {
    name: "Pria: misterius / tenang",
    answers: answer("a", "a", "a", "b"),
    expected: ["eclat", "midnight-tide"],
  },
  {
    name: "Wanita: fresh / playful / ceria",
    answers: answer("b", "b", "a", "a"),
    expected: ["twist"],
  },
  {
    name: "Wanita: anggun / mandiri / elegan",
    answers: answer("b", "d", "d", "d"),
    expected: ["reve"],
  },
  {
    name: "Wanita: bold / memikat / kuat",
    answers: answer("b", "c", "c", "c"),
    expected: ["lune", "midnight-siren"],
  },
  {
    name: "Wanita: misterius / adiktif / malam",
    answers: answer("b", "a", "c", "b"),
    expected: ["secret-potion"],
  },
];

for (const testCase of PRD_CASES) {
  test(`pemetaan PRD: ${testCase.name}`, () => {
    const result = matchProduct(testCase.answers, products);
    assert.ok(
      result && testCase.expected.includes(result),
      `dapat "${result}", PRD mengharapkan salah satu dari ${testCase.expected.join(" / ")}`,
    );
  });
}

test("setiap kombinasi jawaban menghasilkan varian yang ada", () => {
  const ids: OptionId[] = ["a", "b", "c", "d"];
  const slugs = new Set(products.map((p) => p.slug));

  for (const target of ["a", "b"] as OptionId[]) {
    for (const presence of ids) {
      for (const drive of ids) {
        for (const secret of ids) {
          const result = matchProduct(answer(target, presence, drive, secret), products);
          assert.ok(result, `tidak ada hasil untuk ${target}${presence}${drive}${secret}`);
          assert.ok(slugs.has(result), `slug tidak dikenal: ${result}`);
        }
      }
    }
  }
});

test("hasil selalu berasal dari koleksi yang dipilih di Q1", () => {
  const ids: OptionId[] = ["a", "b", "c", "d"];
  const category = new Map(products.map((p) => [p.slug, p.category]));

  for (const presence of ids) {
    for (const drive of ids) {
      for (const secret of ids) {
        const male = matchProduct(answer("a", presence, drive, secret), products)!;
        const female = matchProduct(answer("b", presence, drive, secret), products)!;
        assert.equal(category.get(male), "pria");
        assert.equal(category.get(female), "wanita");
      }
    }
  }
});

test("kuis punya 4 langkah sesuai PRD 5.2", () => {
  assert.equal(questions.length, 4);
  assert.equal(questions[0].options.length, 2);
  for (const question of questions.slice(1)) {
    assert.equal(question.options.length, 4);
  }
});
