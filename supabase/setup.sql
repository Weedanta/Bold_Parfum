-- DIHASILKAN OTOMATIS oleh scripts/generate-setup-sql.ts. Jangan diedit tangan.
-- Perbarui dengan: npm run setup:sql
--
-- SETUP SEKALI JALAN untuk katalog The Bold: gabungan seluruh migrasi dan seed.
-- Tempel seluruh isi berkas ini ke Supabase SQL Editor lalu Run.
-- Aman dijalankan berulang.
--
-- Bagian:
--   supabase/migrations/0001_catalog.sql
--   supabase/migrations/0002_storage.sql
--   supabase/migrations/0003_normalisasi_admin.sql
--   supabase/migrations/0004_status_stok_crud.sql
--   supabase/seed.sql

begin;

-- ==========================================================================
-- supabase/migrations/0001_catalog.sql
-- ==========================================================================

-- Katalog parfum The Bold.
--
-- Satu tabel. `notes` dan `sizes` disimpan sebagai JSONB karena keduanya selalu
-- dibaca utuh bersama produknya, tidak pernah difilter atau di-join sendiri, dan
-- urutannya bermakna. Bentuknya dijaga CHECK constraint di bawah plus validator
-- di lib/catalog.ts saat memetakan baris ke tipe TypeScript.

create extension if not exists pgcrypto;

-- Enum, bukan text bebas: nilainya persis mencerminkan union type di
-- lib/products.ts, jadi data yang tidak dikenal ditolak di level database.
do $$ begin
  create type product_category as enum ('pria', 'wanita');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_vibe as enum ('fresh', 'woody', 'sweet', 'floral', 'dark');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_sillage as enum ('Lembut', 'Sedang', 'Kuat');
exception when duplicate_object then null; end $$;

create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  code              text not null unique,
  name              text not null,
  subtitle          text not null,
  category          product_category not null,
  family            text not null,
  vibes             product_vibe[] not null default '{}',
  juice             text not null,
  atmosphere_label  text not null,
  atmosphere_from   text not null,
  atmosphere_to     text not null,
  story             text not null,
  longevity_min     int not null,
  longevity_max     int not null,
  sillage           product_sillage not null,
  occasions         text[] not null default '{}',
  badges            text[] not null default '{}',
  notes             jsonb not null default '[]'::jsonb,
  sizes             jsonb not null default '[]'::jsonb,

  -- Nama objek di bucket `product-photos`, misal 'crown.webp'.
  -- NULL berarti fotonya belum diunggah; situs menggambar siluet botol.
  photo_path        text,

  -- Menggantikan konstanta `featured` yang dulu di-hardcode. NULL = tidak
  -- ditampilkan di Featured Scent of the Month.
  featured_for      product_category,

  sort_order        int not null default 0,
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_juice_hex check (juice ~* '^#[0-9a-f]{6}$'),
  constraint products_atmosphere_from_hex check (atmosphere_from ~* '^#[0-9a-f]{6}$'),
  constraint products_atmosphere_to_hex check (atmosphere_to ~* '^#[0-9a-f]{6}$'),
  constraint products_longevity_range check (longevity_min > 0 and longevity_max >= longevity_min),
  constraint products_notes_is_array check (jsonb_typeof(notes) = 'array'),
  constraint products_sizes_is_array check (jsonb_typeof(sizes) = 'array'),
  constraint products_sizes_not_empty check (jsonb_array_length(sizes) > 0)
);

-- Hanya satu varian unggulan per kategori.
create unique index if not exists products_one_featured_per_category
  on public.products (featured_for)
  where featured_for is not null;

-- Urutan tampil katalog: sort_order dulu, code sebagai pemutus seri supaya
-- hasilnya deterministik walau sort_order kembar.
create index if not exists products_display_order
  on public.products (sort_order, code);

create index if not exists products_category
  on public.products (category)
  where is_published;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- RLS -----------------------------------------------------------------------
-- Fase A hanya membuka jalur baca. Tidak ada policy insert/update/delete sama
-- sekali, jadi publishable key yang dipakai situs tidak bisa mengubah apa pun.
-- Pengelolaan data lewat dashboard Supabase. Policy admin menyusul di Fase B.

alter table public.products enable row level security;

drop policy if exists "Katalog terbit boleh dibaca siapa saja" on public.products;
create policy "Katalog terbit boleh dibaca siapa saja"
  on public.products
  for select
  to anon, authenticated
  using (is_published);

-- ==========================================================================
-- supabase/migrations/0002_storage.sql
-- ==========================================================================

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

-- ==========================================================================
-- supabase/migrations/0003_normalisasi_admin.sql
-- ==========================================================================

-- Normalisasi katalog dan pintu masuk admin.
--
-- Migrasi ini menuliskan ulang keadaan yang sudah berlaku di database sejak
-- commit 1f6da39 tapi tidak pernah ikut masuk repo. Tanpa berkas ini, 0001 dan
-- 0002 saja tidak cukup untuk membangun ulang database dari nol: kode di
-- lib/catalog.ts membaca tabel anak yang belum pernah dideklarasikan di mana pun.
--
-- Yang berubah dari 0001: `notes`, `sizes`, `vibes`, `occasions`, dan `badges`
-- pindah dari kolom JSONB/array di dalam `products` ke lima tabel anak. Alasannya
-- panel admin: mengubah satu note lewat JSONB berarti menulis ulang seluruh larik
-- dan kehilangan CHECK constraint per barisnya. Sebagai tabel, tiap note punya
-- kolom bertipe dan urutannya dipegang kolom `position`, bukan urutan elemen.
--
-- Aman dijalankan berulang, dan aman dijalankan di database yang sudah memakai
-- bentuk baru: setiap langkah dijaga IF NOT EXISTS atau drop-lalu-buat.


do $$ begin
  create type product_layer as enum ('top', 'heart', 'base');
exception when duplicate_object then null; end $$;

-- Tabel anak -----------------------------------------------------------------
-- Semuanya memakai product_id sebagai bagian dari primary key dan menghapus diri
-- bersama induknya. Tidak ada satu pun yang punya id sendiri: baris-baris ini
-- tidak pernah dirujuk dari luar produknya.

create table if not exists public.product_notes (
  product_id uuid not null references public.products (id) on delete cascade,
  position   int not null,
  name       text not null,
  layer      product_layer not null,
  onset      int not null,
  peak       int not null,
  fade       int not null,

  primary key (product_id, position),
  constraint product_notes_name_not_blank check (length(btrim(name)) > 0),
  -- Tiga penanda waktu Kurva Sillage, dalam menit sejak disemprot.
  constraint product_notes_time_order check (onset >= 0 and onset <= peak and peak <= fade)
);

create table if not exists public.product_sizes (
  product_id uuid not null references public.products (id) on delete cascade,
  ml         int not null,
  price      int not null,

  primary key (product_id, ml),
  constraint product_sizes_ml_known check (ml = any (array[30, 50])),
  constraint product_sizes_price_positive check (price > 0)
);

create table if not exists public.product_vibes (
  product_id uuid not null references public.products (id) on delete cascade,
  vibe       product_vibe not null,

  primary key (product_id, vibe)
);

create table if not exists public.product_occasions (
  product_id uuid not null references public.products (id) on delete cascade,
  position   int not null,
  label      text not null,

  primary key (product_id, position),
  constraint product_occasions_label_not_blank check (length(btrim(label)) > 0)
);

create table if not exists public.product_badges (
  product_id uuid not null references public.products (id) on delete cascade,
  position   int not null,
  label      text not null,

  primary key (product_id, position),
  constraint product_badges_label_not_blank check (length(btrim(label)) > 0)
);

-- Pemindahan isi kolom lama ---------------------------------------------------
-- Hanya berjalan kalau kolom JSONB/array dari 0001 masih ada. Di database yang
-- sudah dinormalisasi, blok ini dilewati seluruhnya.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'notes'
  ) then
    insert into public.product_notes (product_id, position, name, layer, onset, peak, fade)
    select p.id, (n.ordinality - 1)::int, n.value ->> 'name',
           (n.value ->> 'layer')::public.product_layer,
           (n.value ->> 'onset')::int, (n.value ->> 'peak')::int, (n.value ->> 'fade')::int
    from public.products p,
         lateral jsonb_array_elements(p.notes) with ordinality as n(value, ordinality)
    on conflict do nothing;

    insert into public.product_sizes (product_id, ml, price)
    select p.id, (s.value ->> 'ml')::int, (s.value ->> 'price')::int
    from public.products p,
         lateral jsonb_array_elements(p.sizes) as s(value)
    on conflict do nothing;

    insert into public.product_vibes (product_id, vibe)
    select distinct p.id, v.vibe
    from public.products p, lateral unnest(p.vibes) as v(vibe)
    on conflict do nothing;

    insert into public.product_occasions (product_id, position, label)
    select p.id, (o.ordinality - 1)::int, o.label
    from public.products p,
         lateral unnest(p.occasions) with ordinality as o(label, ordinality)
    on conflict do nothing;

    insert into public.product_badges (product_id, position, label)
    select p.id, (b.ordinality - 1)::int, b.label
    from public.products p,
         lateral unnest(p.badges) with ordinality as b(label, ordinality)
    on conflict do nothing;
  end if;
end $$;

alter table public.products drop constraint if exists products_notes_is_array;
alter table public.products drop constraint if exists products_sizes_is_array;
alter table public.products drop constraint if exists products_sizes_not_empty;

alter table public.products drop column if exists notes;
alter table public.products drop column if exists sizes;
alter table public.products drop column if exists vibes;
alter table public.products drop column if exists occasions;
alter table public.products drop column if exists badges;

-- Admin ----------------------------------------------------------------------
-- Daftar admin dipisah dari auth.users. Punya akun Supabase saja tidak cukup;
-- hanya baris di tabel ini yang membuka panel. Menambah admin dilakukan manual
-- lewat dashboard, dan itu memang disengaja: penambahannya jarang, dan tidak ada
-- gunanya menyediakan jalur yang bisa disalahgunakan untuk itu.

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER supaya policy yang memanggilnya tidak ikut tersandung RLS
-- tabel admin_users sendiri, yang akan membuat pemeriksaannya berputar.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

-- Penyimpanan satu varian -----------------------------------------------------
-- Satu penyimpanan menyentuh enam tabel. Lewat fungsi, semuanya berada dalam satu
-- transaksi: kalau ada yang gagal, tidak ada varian yang tertinggal dengan note
-- baru tapi ukuran lama.
--
-- Sengaja BUKAN SECURITY DEFINER. Fungsi ini berjalan sebagai pemanggilnya, jadi
-- setiap tulisan di dalamnya tetap melewati policy di bawah. Pemeriksaan
-- is_admin() di baris pertama hanya untuk memberi pesan yang enak dibaca lebih
-- awal, bukan penjaga yang sebenarnya.

create or replace function public.simpan_varian(
  p_slug      text,
  p_fields    jsonb,
  p_notes     jsonb,
  p_sizes     jsonb,
  p_vibes     text[],
  p_occasions text[],
  p_badges    text[]
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_featured text := nullif(p_fields ->> 'featured_for', '');
begin
  if not public.is_admin() then
    raise exception 'Tidak berwenang mengubah katalog.';
  end if;

  -- Hanya satu unggulan per kategori. Yang lama dilepas lebih dulu supaya
  -- memindahkan sorotan tidak berbenturan dengan unique index.
  if v_featured is not null then
    update public.products
       set featured_for = null
     where featured_for = v_featured::public.product_category
       and slug <> p_slug;
  end if;

  update public.products set
    name             = p_fields ->> 'name',
    subtitle         = p_fields ->> 'subtitle',
    family           = p_fields ->> 'family',
    story            = p_fields ->> 'story',
    category         = (p_fields ->> 'category')::public.product_category,
    sillage          = (p_fields ->> 'sillage')::public.product_sillage,
    juice            = p_fields ->> 'juice',
    atmosphere_label = p_fields ->> 'atmosphere_label',
    atmosphere_from  = p_fields ->> 'atmosphere_from',
    atmosphere_to    = p_fields ->> 'atmosphere_to',
    longevity_min    = (p_fields ->> 'longevity_min')::int,
    longevity_max    = (p_fields ->> 'longevity_max')::int,
    featured_for     = v_featured::public.product_category,
    sort_order       = (p_fields ->> 'sort_order')::int,
    is_published     = (p_fields ->> 'is_published')::boolean
  where slug = p_slug
  returning id into v_id;

  if v_id is null then
    raise exception 'Varian % tidak ditemukan.', p_slug;
  end if;

  -- Anak diganti seluruhnya, bukan disamakan satu per satu. Jumlahnya belasan,
  -- jadi mengganti utuh lebih sederhana dan hasilnya persis seperti yang dikirim.
  delete from public.product_notes where product_id = v_id;
  insert into public.product_notes (product_id, position, name, layer, onset, peak, fade)
  select v_id, (n.ordinality - 1)::int, n.value ->> 'name',
         (n.value ->> 'layer')::public.product_layer,
         (n.value ->> 'onset')::int, (n.value ->> 'peak')::int, (n.value ->> 'fade')::int
  from jsonb_array_elements(p_notes) with ordinality as n(value, ordinality);

  delete from public.product_sizes where product_id = v_id;
  insert into public.product_sizes (product_id, ml, price)
  select v_id, (s.value ->> 'ml')::int, (s.value ->> 'price')::int
  from jsonb_array_elements(p_sizes) as s(value);

  if not exists (select 1 from public.product_sizes where product_id = v_id) then
    raise exception 'Minimal satu ukuran harus punya harga.';
  end if;

  delete from public.product_vibes where product_id = v_id;
  insert into public.product_vibes (product_id, vibe)
  select distinct v_id, v.vibe::public.product_vibe from unnest(p_vibes) as v(vibe);

  delete from public.product_occasions where product_id = v_id;
  insert into public.product_occasions (product_id, position, label)
  select v_id, (o.ordinality - 1)::int, o.label
  from unnest(p_occasions) with ordinality as o(label, ordinality);

  delete from public.product_badges where product_id = v_id;
  insert into public.product_badges (product_id, position, label)
  select v_id, (b.ordinality - 1)::int, b.label
  from unnest(p_badges) with ordinality as b(label, ordinality);
end;
$$;

-- RLS ------------------------------------------------------------------------
-- Dua sudut pandang untuk tiap tabel: pengunjung hanya melihat varian terbit,
-- admin melihat dan menulis semuanya. Tabel anak tidak punya kolom is_published
-- sendiri, jadi keterlihatannya diikutkan ke induknya lewat EXISTS.

alter table public.admin_users enable row level security;
alter table public.product_notes enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_vibes enable row level security;
alter table public.product_occasions enable row level security;
alter table public.product_badges enable row level security;

drop policy if exists "Admin boleh melihat daftar admin" on public.admin_users;
create policy "Admin boleh melihat daftar admin"
  on public.admin_users for select to authenticated using (public.is_admin());

drop policy if exists "Admin melihat semua varian" on public.products;
create policy "Admin melihat semua varian"
  on public.products for select to authenticated using (public.is_admin());

drop policy if exists "Admin menyunting varian" on public.products;
create policy "Admin menyunting varian"
  on public.products for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Ketiga policy tabel anak bentuknya sama persis untuk kelima tabel, jadi
-- ditulis sekali lalu diterapkan berulang. Menyalinnya lima kali hanya membuat
-- perbedaan yang tidak disengaja lebih mudah menyelinap masuk.
do $$
declare
  t text;
begin
  foreach t in array array['product_notes', 'product_sizes', 'product_vibes',
                           'product_occasions', 'product_badges']
  loop
    execute format('drop policy if exists %I on public.%I', 'Ikut keterlihatan varian', t);
    execute format($f$
      create policy "Ikut keterlihatan varian" on public.%I
        for select to anon, authenticated
        using (exists (select 1 from public.products p
                        where p.id = %I.product_id and p.is_published))
    $f$, t, t);

    execute format('drop policy if exists %I on public.%I', 'Admin melihat semua', t);
    execute format($f$
      create policy "Admin melihat semua" on public.%I
        for select to authenticated using (public.is_admin())
    $f$, t);

    execute format('drop policy if exists %I on public.%I', 'Admin menulis', t);
    execute format($f$
      create policy "Admin menulis" on public.%I
        for all to authenticated
        using (public.is_admin()) with check (public.is_admin())
    $f$, t);
  end loop;
end $$;

-- ==========================================================================
-- supabase/migrations/0004_status_stok_crud.sql
-- ==========================================================================

-- Status ketersediaan, plus pembuatan dan penghapusan varian dari panel admin.
--
-- Sampai migrasi ini, satu-satunya sakelar yang dipunyai klien adalah
-- `is_published`: varian muncul di situs atau tidak. Itu tidak cukup. Parfum yang
-- stoknya habis tetap ingin dipajang, justru supaya orang menunggunya. Maka
-- `stock_status` menjawab pertanyaan yang berbeda dari `is_published`:
--
--   is_published : varian ini muncul di situs atau tidak?
--   stock_status : varian yang muncul itu bisa dibeli sekarang atau tidak?
--
-- Menyatukan keduanya jadi satu kolom akan membuat "kosong" dan "disembunyikan"
-- tidak bisa dibedakan, padahal keduanya keputusan yang berbeda.
--
-- Migrasi ini juga membuka INSERT dan DELETE untuk admin. Sebelumnya `products`
-- hanya punya policy SELECT dan UPDATE, jadi katalog terkunci pada 13 varian
-- bawaan seed.


do $$ begin
  create type product_stock as enum ('tersedia', 'kosong', 'preorder');
exception when duplicate_object then null; end $$;

-- Default 'tersedia' supaya varian yang sudah ada tidak mendadak jadi kosong saat
-- migrasi dijalankan.
alter table public.products
  add column if not exists stock_status product_stock not null default 'tersedia';

-- Katalog publik menyaring is_published lalu mengurutkan sort_order/code. Status
-- tidak ikut menyaring apa pun, hanya ikut terbaca, jadi tidak ada index baru.

-- simpan_varian ---------------------------------------------------------------
-- Sama persis dengan versi di 0003, ditambah satu kolom. Ditulis ulang utuh,
-- bukan ditambal, karena CREATE OR REPLACE FUNCTION memang mengganti seluruh
-- badan fungsi: menyimpan versi setengah di sini akan menyesatkan pembacanya.

create or replace function public.simpan_varian(
  p_slug      text,
  p_fields    jsonb,
  p_notes     jsonb,
  p_sizes     jsonb,
  p_vibes     text[],
  p_occasions text[],
  p_badges    text[]
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_featured text := nullif(p_fields ->> 'featured_for', '');
begin
  if not public.is_admin() then
    raise exception 'Tidak berwenang mengubah katalog.';
  end if;

  if v_featured is not null then
    update public.products
       set featured_for = null
     where featured_for = v_featured::public.product_category
       and slug <> p_slug;
  end if;

  update public.products set
    name             = p_fields ->> 'name',
    subtitle         = p_fields ->> 'subtitle',
    family           = p_fields ->> 'family',
    story            = p_fields ->> 'story',
    category         = (p_fields ->> 'category')::public.product_category,
    sillage          = (p_fields ->> 'sillage')::public.product_sillage,
    juice            = p_fields ->> 'juice',
    atmosphere_label = p_fields ->> 'atmosphere_label',
    atmosphere_from  = p_fields ->> 'atmosphere_from',
    atmosphere_to    = p_fields ->> 'atmosphere_to',
    longevity_min    = (p_fields ->> 'longevity_min')::int,
    longevity_max    = (p_fields ->> 'longevity_max')::int,
    featured_for     = v_featured::public.product_category,
    sort_order       = (p_fields ->> 'sort_order')::int,
    is_published     = (p_fields ->> 'is_published')::boolean,
    stock_status     = (p_fields ->> 'stock_status')::public.product_stock
  where slug = p_slug
  returning id into v_id;

  if v_id is null then
    raise exception 'Varian % tidak ditemukan.', p_slug;
  end if;

  delete from public.product_notes where product_id = v_id;
  insert into public.product_notes (product_id, position, name, layer, onset, peak, fade)
  select v_id, (n.ordinality - 1)::int, n.value ->> 'name',
         (n.value ->> 'layer')::public.product_layer,
         (n.value ->> 'onset')::int, (n.value ->> 'peak')::int, (n.value ->> 'fade')::int
  from jsonb_array_elements(p_notes) with ordinality as n(value, ordinality);

  delete from public.product_sizes where product_id = v_id;
  insert into public.product_sizes (product_id, ml, price)
  select v_id, (s.value ->> 'ml')::int, (s.value ->> 'price')::int
  from jsonb_array_elements(p_sizes) as s(value);

  if not exists (select 1 from public.product_sizes where product_id = v_id) then
    raise exception 'Minimal satu ukuran harus punya harga.';
  end if;

  delete from public.product_vibes where product_id = v_id;
  insert into public.product_vibes (product_id, vibe)
  select distinct v_id, v.vibe::public.product_vibe from unnest(p_vibes) as v(vibe);

  delete from public.product_occasions where product_id = v_id;
  insert into public.product_occasions (product_id, position, label)
  select v_id, (o.ordinality - 1)::int, o.label
  from unnest(p_occasions) with ordinality as o(label, ordinality);

  delete from public.product_badges where product_id = v_id;
  insert into public.product_badges (product_id, position, label)
  select v_id, (b.ordinality - 1)::int, b.label
  from unnest(p_badges) with ordinality as b(label, ordinality);
end;
$$;

-- buat_varian -----------------------------------------------------------------
-- Varian baru lahir sebagai draf: hanya nama, kode, koleksi, dan harga yang
-- diminta, sisanya diisi nilai bawaan yang sah. Form lengkapnya punya dua puluh
-- field, dan menuntut semuanya terisi sebelum varian boleh ada hanya akan membuat
-- pekerjaan yang sebenarnya bertahap terasa seperti satu ujian panjang.
--
-- is_published selalu false. Draf yang belum dilengkapi tidak boleh sempat
-- terlihat pengunjung, dan itu dijamin di sini, bukan diserahkan ke kedisiplinan
-- orang yang mengisinya.
--
-- Seperti simpan_varian: bukan SECURITY DEFINER, jadi INSERT di dalamnya tetap
-- diperiksa policy "Admin menambah varian" di bawah.

create or replace function public.buat_varian(
  p_slug     text,
  p_code     text,
  p_name     text,
  p_category text,
  p_sizes    jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Tidak berwenang mengubah katalog.';
  end if;

  insert into public.products (
    slug, code, name, subtitle, category, family, juice,
    atmosphere_label, atmosphere_from, atmosphere_to, story,
    longevity_min, longevity_max, sillage,
    sort_order, is_published, stock_status
  ) values (
    p_slug, p_code, p_name, '', p_category::public.product_category, '',
    -- Emas dan obsidian, dua warna rumah dari app/globals.css. Varian baru tampil
    -- selaras sejak menit pertama, dan tetap jelas belum disetel.
    '#c5a880', '', '#0b0c10', '#c5a880', '',
    6, 8, 'Sedang',
    -- Kelipatan sepuluh, mengikuti pola seed, jadi masih ada ruang menyelipkan
    -- varian di antaranya tanpa menomori ulang semuanya.
    coalesce((select max(sort_order) from public.products), 0) + 10,
    false, 'tersedia'
  )
  returning id into v_id;

  insert into public.product_sizes (product_id, ml, price)
  select v_id, (s.value ->> 'ml')::int, (s.value ->> 'price')::int
  from jsonb_array_elements(p_sizes) as s(value);

  if not exists (select 1 from public.product_sizes where product_id = v_id) then
    raise exception 'Minimal satu ukuran harus punya harga.';
  end if;
end;
$$;

-- RLS ------------------------------------------------------------------------
-- Penghapusan tidak butuh fungsi sendiri: tabel anak sudah ikut terhapus lewat
-- ON DELETE CASCADE, jadi satu DELETE di panel sudah membereskan semuanya.

drop policy if exists "Admin menambah varian" on public.products;
create policy "Admin menambah varian"
  on public.products for insert to authenticated with check (public.is_admin());

drop policy if exists "Admin menghapus varian" on public.products;
create policy "Admin menghapus varian"
  on public.products for delete to authenticated using (public.is_admin());

-- ==========================================================================
-- supabase/seed.sql
-- ==========================================================================

-- DIHASILKAN OTOMATIS oleh scripts/generate-seed-sql.ts. Jangan diedit tangan.
-- Sumber: lib/seed/products.seed.ts
-- Perbarui dengan: npm run seed:sql
--
-- Aman dijalankan berulang. Menjalankannya lagi akan menimpa perubahan isi yang
-- dibuat lewat panel admin, kecuali photo_path dan stock_status yang sengaja
-- dipertahankan.


insert into public.products (
  slug,
  code,
  name,
  subtitle,
  category,
  family,
  juice,
  atmosphere_label,
  atmosphere_from,
  atmosphere_to,
  story,
  longevity_min,
  longevity_max,
  sillage,
  featured_for,
  sort_order
) values
  ('crown', 'TB-01', 'Crown', 'Charisma in a Bottle', 'pria', 'Fresh Spicy', '#c98a3c', 'cahaya lampu gantung di ruang rapat petang', '#c98a3c', '#3a2410', 'Karaktermu yang kuat dan dominan membutuhkan aroma yang dihormati. Crown adalah simbol karisma yang tak terbantahkan.', 8, 12, 'Kuat', 'pria', 10),
  ('ether', 'TB-02', 'Ether', 'Kemewahan yang Tenang', 'pria', 'Woody Niche', '#7c8b7a', 'asap dupa di ruang berlantai kayu', '#7c8b7a', '#1c2320', 'Aura eksklusivitas mengelilingimu. Ether adalah harmoni sempurna untuk kamu yang berkelas dan menyukai kemewahan yang tenang.', 8, 12, 'Kuat', null, 20),
  ('azur', 'TB-03', 'Azur', 'Kesegaran Absolut', 'pria', 'Fresh Citrus', '#7fc8d6', 'ombak siang di laut dangkal', '#7fc8d6', '#0e3540', 'Kamu adalah pribadi yang santai dan menyukai kebersihan. Azur akan menemani hari aktifmu dengan kesegaran absolut.', 5, 7, 'Sedang', null, 30),
  ('visionary', 'TB-04', 'Visionary', 'Dorongan Semangat Harian', 'pria', 'Aquatic Sporty', '#5c8bb0', 'udara pagi berkabut di tepi dermaga', '#5c8bb0', '#12222f', 'Fokus, segar, dan maskulin. Visionary adalah dorongan semangat harianmu untuk jiwa yang bebas.', 6, 8, 'Sedang', null, 40),
  ('ultra', 'TB-05', 'Ultra', 'Manis yang Intens', 'pria', 'Sweet Seductive', '#8e2f45', 'lampu merah panggung sebelum tengah malam', '#8e2f45', '#2a0d16', 'Kamu adalah nyawa dari setiap suasana. Ultra dirancang untuk memikat perhatian dengan aroma manis yang intens.', 8, 12, 'Kuat', null, 50),
  ('night-shift', 'TB-06', 'Night Shift', 'Daya Tarik Pemberontak', 'pria', 'Sweet Nightlife', '#6f4a9c', 'gemerlap kota selepas tengah malam', '#6f4a9c', '#160f24', 'Malam adalah waktumu beraksi. Night Shift memiliki daya tarik pemberontak yang manis namun sangat maskulin.', 8, 12, 'Kuat', null, 60),
  ('eclat', 'TB-07', 'Eclat', 'Segar dengan Sentuhan Manis', 'pria', 'Sweet Aquatic', '#4fb3a5', 'kolam jernih di bawah langit sore', '#4fb3a5', '#0f2e2c', 'Santai namun tetap stand out. Eclat memberikan kesegaran dengan sentuhan manis yang sangat modern.', 6, 8, 'Sedang', null, 70),
  ('midnight-tide', 'TB-08', 'Midnight Tide', 'Kedalaman Lautan Malam', 'pria', 'Deep Marine', '#2e7d8a', 'laut gelap di bawah bulan', '#2e7d8a', '#0a1b1f', 'Tenang dan dalam seperti lautan malam. Mencerminkan kedewasaan dan kedalaman karaktermu yang misterius.', 8, 10, 'Kuat', null, 80),
  ('twist', 'TB-09', 'Twist', 'Energi Positif Setiap Hari', 'wanita', 'Fruity Floral Sweet', '#e8735f', 'kelopak dan buah di meja pagi', '#e8735f', '#3d1a16', 'Ceria dan menyenangkan. Twist memancarkan pesona mudamu yang selalu membawa energi positif di setiap suasana.', 5, 7, 'Sedang', null, 90),
  ('reve', 'TB-10', 'Reve', 'Kecantikan yang Elegan', 'wanita', 'White Floral', '#e6dcc8', 'kelopak putih di ruang berkain linen', '#e6dcc8', '#33302a', 'Anggun dan penuh percaya diri. Reve merangkum kecantikan elegan yang cocok untuk wanita berselera tinggi.', 7, 9, 'Sedang', 'wanita', 100),
  ('lune', 'TB-11', 'Lune', 'Jejak yang Sulit Dilupakan', 'wanita', 'Sweet Praline', '#c08552', 'karamel hangat di bawah lampu temaram', '#c08552', '#33200f', 'Aromamu meninggalkan jejak yang sulit dilupakan. Lune diciptakan untuk kamu yang berani tampil memukau.', 8, 12, 'Kuat', null, 110),
  ('midnight-siren', 'TB-12', 'Midnight Siren', 'Berani dan Sensual', 'wanita', 'Tonka Bold', '#8c3a63', 'beludru gelap di ruang tanpa jendela', '#8c3a63', '#25101c', 'Keseimbangan sempurna yang sangat berani, powerful, namun tetap sensual di saat bersamaan.', 8, 12, 'Kuat', null, 120),
  ('secret-potion', 'TB-13', 'Secret Potion', 'Senjata Rahasia Malammu', 'wanita', 'Vanilla Coffee Dark', '#7a4a2f', 'kopi hitam dan kayu di larut malam', '#7a4a2f', '#1d100a', 'Gelap, adiktif, dan menggoda. Ini adalah senjata rahasiamu untuk malam yang tak terlupakan. Sangat memikat.', 8, 12, 'Kuat', null, 130)
on conflict (slug) do update set
  code = excluded.code,
  name = excluded.name,
  subtitle = excluded.subtitle,
  category = excluded.category,
  family = excluded.family,
  juice = excluded.juice,
  atmosphere_label = excluded.atmosphere_label,
  atmosphere_from = excluded.atmosphere_from,
  atmosphere_to = excluded.atmosphere_to,
  story = excluded.story,
  longevity_min = excluded.longevity_min,
  longevity_max = excluded.longevity_max,
  sillage = excluded.sillage,
  featured_for = excluded.featured_for,
  sort_order = excluded.sort_order;

delete from public.product_notes
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'twist', 'reve', 'lune', 'midnight-siren', 'secret-potion'));

insert into public.product_notes (product_id, position, name, layer, onset, peak, fade)
select p.id, v.position, v.name, v.layer::product_layer, v.onset, v.peak, v.fade
from (values
  ('crown', 0, 'Bergamot Calabria', 'top', 0, 10, 45),
  ('crown', 1, 'Lada Merah Muda', 'top', 0, 12, 40),
  ('crown', 2, 'Grapefruit', 'top', 0, 8, 35),
  ('crown', 3, 'Lavender', 'heart', 20, 80, 220),
  ('crown', 4, 'Kayu Manis', 'heart', 25, 90, 240),
  ('crown', 5, 'Pala', 'heart', 30, 95, 230),
  ('crown', 6, 'Cedarwood', 'base', 90, 240, 720),
  ('crown', 7, 'Ambergris', 'base', 100, 260, 720),
  ('crown', 8, 'Vetiver', 'base', 95, 250, 660),
  ('ether', 0, 'Elemi', 'top', 0, 10, 40),
  ('ether', 1, 'Jeruk Pahit', 'top', 0, 9, 35),
  ('ether', 2, 'Iris', 'heart', 25, 90, 240),
  ('ether', 3, 'Cengkeh', 'heart', 30, 100, 230),
  ('ether', 4, 'Gaharu Ringan', 'heart', 35, 110, 260),
  ('ether', 5, 'Oud', 'base', 95, 250, 720),
  ('ether', 6, 'Sandalwood', 'base', 90, 240, 700),
  ('ether', 7, 'Musk Putih', 'base', 100, 260, 720),
  ('azur', 0, 'Lemon Sisilia', 'top', 0, 8, 35),
  ('azur', 1, 'Bergamot', 'top', 0, 10, 40),
  ('azur', 2, 'Daun Mint', 'top', 0, 7, 30),
  ('azur', 3, 'Neroli', 'heart', 20, 70, 180),
  ('azur', 4, 'Teh Putih', 'heart', 25, 80, 190),
  ('azur', 5, 'Musk Bersih', 'base', 85, 200, 420),
  ('azur', 6, 'Cedar Muda', 'base', 90, 210, 420),
  ('visionary', 0, 'Nota Laut', 'top', 0, 9, 40),
  ('visionary', 1, 'Jeruk Mandarin', 'top', 0, 8, 35),
  ('visionary', 2, 'Rosemary', 'heart', 22, 75, 200),
  ('visionary', 3, 'Geranium', 'heart', 25, 85, 210),
  ('visionary', 4, 'Garam Air', 'heart', 20, 80, 220),
  ('visionary', 5, 'Kayu Apung', 'base', 88, 220, 480),
  ('visionary', 6, 'Musk Abu', 'base', 90, 230, 480),
  ('ultra', 0, 'Nanas', 'top', 0, 10, 40),
  ('ultra', 1, 'Bergamot', 'top', 0, 9, 35),
  ('ultra', 2, 'Kayu Manis', 'heart', 25, 90, 230),
  ('ultra', 3, 'Melati', 'heart', 28, 95, 240),
  ('ultra', 4, 'Vanila Bourbon', 'base', 95, 250, 720),
  ('ultra', 5, 'Kemenyan', 'base', 100, 260, 700),
  ('ultra', 6, 'Amber', 'base', 95, 255, 720),
  ('night-shift', 0, 'Absinth', 'top', 0, 11, 45),
  ('night-shift', 1, 'Kapulaga', 'top', 0, 10, 40),
  ('night-shift', 2, 'Bunga Jeruk', 'heart', 25, 85, 220),
  ('night-shift', 3, 'Lavender Gelap', 'heart', 30, 95, 235),
  ('night-shift', 4, 'Tonka Bean', 'base', 95, 250, 720),
  ('night-shift', 5, 'Vanila Asap', 'base', 100, 260, 720),
  ('night-shift', 6, 'Cedar Hitam', 'base', 95, 245, 700),
  ('eclat', 0, 'Bergamot Manis', 'top', 0, 9, 38),
  ('eclat', 1, 'Pir', 'top', 0, 10, 40),
  ('eclat', 2, 'Nota Laut', 'heart', 22, 80, 200),
  ('eclat', 3, 'Melati Air', 'heart', 25, 85, 210),
  ('eclat', 4, 'Musk Manis', 'base', 88, 220, 480),
  ('eclat', 5, 'Ambroxan', 'base', 90, 230, 480),
  ('midnight-tide', 0, 'Garam Laut', 'top', 0, 10, 42),
  ('midnight-tide', 1, 'Jeruk Bali', 'top', 0, 9, 36),
  ('midnight-tide', 2, 'Rumput Laut', 'heart', 24, 85, 215),
  ('midnight-tide', 3, 'Sage', 'heart', 28, 90, 225),
  ('midnight-tide', 4, 'Ambergris Gelap', 'base', 92, 245, 600),
  ('midnight-tide', 5, 'Vetiver Basah', 'base', 95, 250, 600),
  ('midnight-tide', 6, 'Musk Mineral', 'base', 90, 240, 600),
  ('twist', 0, 'Raspberry', 'top', 0, 9, 35),
  ('twist', 1, 'Jeruk Mandarin', 'top', 0, 8, 32),
  ('twist', 2, 'Peony', 'heart', 22, 75, 185),
  ('twist', 3, 'Melati Manis', 'heart', 25, 80, 195),
  ('twist', 4, 'Musk Putih', 'base', 85, 200, 420),
  ('twist', 5, 'Vanila Ringan', 'base', 88, 210, 420),
  ('reve', 0, 'Bergamot', 'top', 0, 9, 38),
  ('reve', 1, 'Pir Putih', 'top', 0, 10, 40),
  ('reve', 2, 'Tuberose', 'heart', 25, 90, 240),
  ('reve', 3, 'Melati Sambac', 'heart', 28, 95, 245),
  ('reve', 4, 'Gardenia', 'heart', 30, 100, 250),
  ('reve', 5, 'Musk Halus', 'base', 90, 235, 540),
  ('reve', 6, 'Sandalwood Krem', 'base', 92, 240, 540),
  ('lune', 0, 'Almond', 'top', 0, 11, 42),
  ('lune', 1, 'Bergamot', 'top', 0, 9, 35),
  ('lune', 2, 'Bunga Jeruk', 'heart', 25, 88, 225),
  ('lune', 3, 'Praline', 'heart', 30, 100, 250),
  ('lune', 4, 'Tonka Bean', 'base', 95, 250, 720),
  ('lune', 5, 'Vanila', 'base', 100, 255, 720),
  ('lune', 6, 'Musk Hangat', 'base', 95, 245, 700),
  ('midnight-siren', 0, 'Plum', 'top', 0, 10, 40),
  ('midnight-siren', 1, 'Lada Merah Muda', 'top', 0, 9, 36),
  ('midnight-siren', 2, 'Mawar Gelap', 'heart', 25, 90, 235),
  ('midnight-siren', 3, 'Iris', 'heart', 30, 95, 245),
  ('midnight-siren', 4, 'Tonka Bean', 'base', 95, 250, 720),
  ('midnight-siren', 5, 'Patchouli', 'base', 98, 255, 700),
  ('midnight-siren', 6, 'Amber Gelap', 'base', 95, 250, 720),
  ('secret-potion', 0, 'Kopi Panggang', 'top', 0, 12, 50),
  ('secret-potion', 1, 'Kapulaga', 'top', 0, 10, 40),
  ('secret-potion', 2, 'Bunga Jeruk', 'heart', 25, 85, 220),
  ('secret-potion', 3, 'Kakao', 'heart', 30, 95, 240),
  ('secret-potion', 4, 'Vanila Gelap', 'base', 95, 255, 720),
  ('secret-potion', 5, 'Benzoin', 'base', 100, 260, 720),
  ('secret-potion', 6, 'Musk Hitam', 'base', 95, 250, 700)
) as v(slug, position, name, layer, onset, peak, fade)
join public.products p on p.slug = v.slug;

delete from public.product_sizes
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'twist', 'reve', 'lune', 'midnight-siren', 'secret-potion'));

insert into public.product_sizes (product_id, ml, price)
select p.id, v.ml, v.price
from (values
  ('crown', 30, 149000),
  ('crown', 50, 219000),
  ('ether', 30, 149000),
  ('ether', 50, 219000),
  ('azur', 30, 149000),
  ('azur', 50, 219000),
  ('visionary', 30, 149000),
  ('visionary', 50, 219000),
  ('ultra', 30, 149000),
  ('ultra', 50, 219000),
  ('night-shift', 30, 149000),
  ('night-shift', 50, 219000),
  ('eclat', 30, 149000),
  ('eclat', 50, 219000),
  ('midnight-tide', 30, 149000),
  ('midnight-tide', 50, 219000),
  ('twist', 30, 149000),
  ('twist', 50, 219000),
  ('reve', 30, 149000),
  ('reve', 50, 219000),
  ('lune', 30, 149000),
  ('lune', 50, 219000),
  ('midnight-siren', 30, 149000),
  ('midnight-siren', 50, 219000),
  ('secret-potion', 30, 149000),
  ('secret-potion', 50, 219000)
) as v(slug, ml, price)
join public.products p on p.slug = v.slug;

delete from public.product_vibes
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'twist', 'reve', 'lune', 'midnight-siren', 'secret-potion'));

insert into public.product_vibes (product_id, vibe)
select p.id, v.vibe::product_vibe
from (values
  ('crown', 'fresh'),
  ('crown', 'woody'),
  ('ether', 'woody'),
  ('azur', 'fresh'),
  ('visionary', 'fresh'),
  ('ultra', 'sweet'),
  ('night-shift', 'sweet'),
  ('night-shift', 'dark'),
  ('eclat', 'fresh'),
  ('eclat', 'sweet'),
  ('midnight-tide', 'fresh'),
  ('midnight-tide', 'dark'),
  ('twist', 'sweet'),
  ('twist', 'floral'),
  ('reve', 'floral'),
  ('lune', 'sweet'),
  ('midnight-siren', 'sweet'),
  ('midnight-siren', 'dark'),
  ('secret-potion', 'sweet'),
  ('secret-potion', 'dark')
) as v(slug, vibe)
join public.products p on p.slug = v.slug;

delete from public.product_occasions
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'twist', 'reve', 'lune', 'midnight-siren', 'secret-potion'));

insert into public.product_occasions (product_id, position, label)
select p.id, v.position, v.label
from (values
  ('crown', 0, 'Kantor'),
  ('crown', 1, 'Acara formal petang'),
  ('ether', 0, 'Acara formal'),
  ('ether', 1, 'Signature harian'),
  ('azur', 0, 'Harian'),
  ('azur', 1, 'Siang hari'),
  ('visionary', 0, 'Olahraga'),
  ('visionary', 1, 'Kasual'),
  ('ultra', 0, 'Pesta'),
  ('ultra', 1, 'Malam'),
  ('night-shift', 0, 'Kelab'),
  ('night-shift', 1, 'Malam panjang'),
  ('eclat', 0, 'Harian'),
  ('eclat', 1, 'Kencan siang'),
  ('midnight-tide', 0, 'Malam'),
  ('midnight-tide', 1, 'Formal tenang'),
  ('twist', 0, 'Harian'),
  ('twist', 1, 'Kampus'),
  ('reve', 0, 'Kantor'),
  ('reve', 1, 'Acara formal'),
  ('lune', 0, 'Malam'),
  ('lune', 1, 'Kencan'),
  ('midnight-siren', 0, 'Malam'),
  ('midnight-siren', 1, 'Acara besar'),
  ('secret-potion', 0, 'Malam'),
  ('secret-potion', 1, 'Suasana intim')
) as v(slug, position, label)
join public.products p on p.slug = v.slug;

delete from public.product_badges
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'twist', 'reve', 'lune', 'midnight-siren', 'secret-potion'));

insert into public.product_badges (product_id, position, label)
select p.id, v.position, v.label
from (values
  ('crown', 0, 'Best Seller'),
  ('crown', 1, 'Signature'),
  ('ether', 0, 'Signature'),
  ('azur', 0, 'Best Seller'),
  ('ultra', 0, 'Night Out'),
  ('night-shift', 0, 'Night Out'),
  ('night-shift', 1, 'Best Seller'),
  ('midnight-tide', 0, 'Signature'),
  ('twist', 0, 'Best Seller'),
  ('reve', 0, 'Best Seller'),
  ('reve', 1, 'Signature'),
  ('lune', 0, 'Best Seller'),
  ('midnight-siren', 0, 'Night Out'),
  ('secret-potion', 0, 'Night Out'),
  ('secret-potion', 1, 'Signature')
) as v(slug, position, label)
join public.products p on p.slug = v.slug;

commit;
