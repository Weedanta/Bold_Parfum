"use client";

import Image from "next/image";
import { useActionState } from "react";

import { hapusFoto, unggahFoto, type ActionState } from "@/app/admin/actions";

/**
 * Unggah dan hapus foto botol.
 *
 * Batas 2 MB diperiksa tiga kali: `accept` di input menyaring pemilih berkas,
 * Server Action menolak berkas yang lolos, dan bucket Supabase menolak yang
 * lolos keduanya. Lapisan pertama demi kenyamanan, dua terakhir demi kebenaran.
 */
export function PhotoPanel({
  slug,
  photoUrl,
  photoPath,
}: {
  slug: string;
  photoUrl: string | null;
  photoPath: string | null;
}) {
  const [uploadState, upload, uploading] = useActionState<ActionState, FormData>(unggahFoto, {});
  const [removeState, remove, removing] = useActionState<ActionState, FormData>(hapusFoto, {});
  const state = uploadState.error || uploadState.ok ? uploadState : removeState;

  return (
    <section className="border border-line p-5">
      <h2 className="font-mono text-label tracking-label text-muted uppercase">Foto botol</h2>

      <div className="mt-4 aspect-3/4 w-full max-w-48 border border-line bg-surface">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`Foto ${slug}`}
            width={192}
            height={256}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <p className="flex size-full items-center justify-center p-4 text-center text-xs text-muted">
            Belum ada foto. Situs menampilkan siluet botol.
          </p>
        )}
      </div>

      <form action={upload} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="slug" value={slug} />
        <input
          type="file"
          name="photo"
          accept="image/webp,image/jpeg,image/png"
          required
          className="text-sm text-muted file:mr-3 file:border file:border-line file:bg-obsidian file:px-3 file:py-1.5 file:text-sm file:text-ink"
        />
        <p className="text-xs text-muted">Maksimal 2 MB. Format WebP, JPEG, atau PNG.</p>
        <button
          type="submit"
          disabled={uploading}
          className="border border-line px-4 py-2 text-sm transition-colors hover:border-gold disabled:opacity-50"
        >
          {uploading ? "Mengunggah…" : photoUrl ? "Ganti foto" : "Unggah foto"}
        </button>
      </form>

      {photoPath ? (
        <form action={remove} className="mt-3">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="photo_path" value={photoPath} />
          <button
            type="submit"
            disabled={removing}
            className="text-sm text-muted underline-offset-4 transition-colors hover:text-red-400 hover:underline disabled:opacity-50"
          >
            {removing ? "Menghapus…" : "Hapus foto"}
          </button>
        </form>
      ) : null}

      {state.error ? (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="mt-4 text-sm text-gold">
          {state.ok}
        </p>
      ) : null}
    </section>
  );
}
