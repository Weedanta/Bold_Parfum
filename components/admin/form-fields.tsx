"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { LAYER_LABELS, LAYERS, type Layer, type Note } from "@/lib/products";

/**
 * Field dasar panel admin.
 *
 * Sengaja terpisah dari components/ui: primitif di sana melayani etalase yang
 * dilihat pembeli, sedangkan yang di sini melayani form padat yang dipakai satu
 * orang setiap hari. Menyatukan keduanya akan membuat salah satunya berkompromi.
 */

const inputClass =
  "w-full border border-line bg-obsidian px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-gold";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="font-mono text-label tracking-label text-muted uppercase">{label}</span>
      <span className="mt-2 block">{children}</span>
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.ComponentProps<"input">) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: React.ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(inputClass, "min-h-28", props.className)} />;
}

export function Select(props: React.ComponentProps<"select">) {
  return <select {...props} className={cn(inputClass, props.className)} />;
}

/** Input warna plus kotak teksnya, karena hex sering disalin langsung dari desain. */
export function ColorInput({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <span className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={`Pemilih warna ${name}`}
        className="size-9 shrink-0 cursor-pointer border border-line bg-obsidian"
      />
      <input
        type="text"
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        spellCheck={false}
        className={cn(inputClass, "font-mono")}
      />
    </span>
  );
}

/**
 * Editor note.
 *
 * Tiap note punya tiga penanda waktu dalam menit sejak disemprot, dan ketiganya
 * itulah yang menggambar Kurva Sillage di situs. Ditampilkan sebagai baris, bukan
 * JSON, supaya bisa diubah tanpa tahu format apa pun.
 */
export function NotesEditor({ notes }: { notes: Note[] }) {
  const [rows, setRows] = useState<Note[]>(
    notes.length > 0 ? notes : [{ name: "", layer: "top", onset: 0, peak: 10, fade: 45 }],
  );

  function update(index: number, patch: Partial<Note>) {
    setRows((current) =>
      current.map((row, position) => (position === index ? { ...row, ...patch } : row)),
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-label tracking-label text-muted uppercase">Note aroma</span>
        <span className="text-xs text-muted">{rows.length} note</span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        Waktu dalam menit sejak disemprot. Onset saat mulai terasa, puncak saat paling kuat, habis
        saat menghilang. Urutannya harus onset ≤ puncak ≤ habis.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {rows.map((row, index) => (
          <li
            key={index}
            className="grid grid-cols-2 gap-2 border border-line p-3 sm:grid-cols-[minmax(0,1fr)_7rem_5rem_5rem_5rem_2.25rem]"
          >
            <input
              name="note_name"
              value={row.name}
              onChange={(event) => update(index, { name: event.target.value })}
              placeholder="Nama note"
              aria-label={`Nama note baris ${index + 1}`}
              className={inputClass}
            />
            <select
              name="note_layer"
              value={row.layer}
              onChange={(event) => update(index, { layer: event.target.value as Layer })}
              aria-label={`Lapisan note baris ${index + 1}`}
              className={inputClass}
            >
              {LAYERS.map((layer) => (
                <option key={layer} value={layer}>
                  {LAYER_LABELS[layer]}
                </option>
              ))}
            </select>
            {(["onset", "peak", "fade"] as const).map((key) => (
              <input
                key={key}
                name={`note_${key}`}
                type="number"
                min={0}
                value={row[key]}
                onChange={(event) => update(index, { [key]: Number(event.target.value) })}
                aria-label={`${key} note baris ${index + 1}`}
                className={cn(inputClass, "font-mono")}
              />
            ))}
            <button
              type="button"
              onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
              aria-label={`Hapus note baris ${index + 1}`}
              className="border border-line text-muted transition-colors hover:border-gold hover:text-ink"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() =>
          setRows((current) => [
            ...current,
            { name: "", layer: "top", onset: 0, peak: 10, fade: 45 },
          ])
        }
        className="mt-3 border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-ink"
      >
        Tambah note
      </button>
    </div>
  );
}
