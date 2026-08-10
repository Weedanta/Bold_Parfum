-- Bucket foto botol.
--
-- Publik karena isinya foto produk yang memang untuk dilihat siapa saja, dan
-- URL publik bisa langsung dipakai next/image tanpa perlu menandatangani URL
-- di setiap render.
--
-- Batas 2 MB per file (permintaan klien) supaya storage tidak cepat penuh:
-- Supabase menolak upload yang lebih besar di sisi server, jadi batasnya berlaku
-- baik dari dashboard maupun dari panel admin nanti. Mime type dikunci ke tiga
-- format gambar; webp yang dipakai situs, jpeg/png diterima supaya foto mentah
-- dari fotografer bisa diunggah tanpa konversi lebih dulu.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-photos',
  'product-photos',
  true,
  2097152,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Baca publik. Tidak ada policy insert/update/delete di Fase A, jadi unggah dan
-- hapus hanya bisa lewat dashboard. Policy tulis untuk admin menyusul di Fase B.
drop policy if exists "Foto produk boleh dibaca siapa saja" on storage.objects;
create policy "Foto produk boleh dibaca siapa saja"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-photos');
