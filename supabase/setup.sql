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
  ('crown', 'TB-01', 'Crown', 'Alpha, Maskulin & Sangat Karismatik', 'pria', 'Fresh Spicy Amber', '#3b6ea5', 'riak air tenang di bawah cahaya biru malam', '#3b6ea5', '#0c1d33', 'Karakter alpha yang tegas dan maskulin membutuhkan aroma yang langsung dihormati. Perpaduan segar Calabrian bergamot dan hangatnya Sichuan pepper di atas dasar ambroxan serta kayu cedar menjadikan Crown simbol karisma yang tak terbantahkan, dari ruang rapat hingga malam formal.', 8, 12, 'Kuat', 'pria', 10),
  ('ether', 'TB-02', 'Ether', 'Niche Luxury, Modern & Menghipnotis', 'pria', 'Woody Fruity Niche', '#3b6fd4', 'kilau cincin emas dan satin biru safir', '#3b6fd4', '#0d1b3a', 'Aura kemewahan modern yang menghipnotis sejak semprotan pertama. Kesegaran buah pir, bergamot, dan jahe berpadu dengan molekul eksklusif Petalia serta Akigalawood dan Ambrofix, menciptakan harmoni niche luxury untuk momen paling berkelas.', 8, 12, 'Kuat', null, 20),
  ('azur', 'TB-03', 'Azur', 'Quiet Luxury, Berkelas & Tenang', 'pria', 'Citrus Aromatic Tea', '#d4af48', 'seduhan teh hitam, neroli putih, dan citron di teras batu', '#d4af48', '#2c2414', 'Kemewahan yang tenang dan tak perlu berteriak. Kesegaran citron, Calabrian bergamot, dan jeruk Sisilia bertemu hangatnya kayu manis Ceylon serta teh hitam Tiongkok dan ambroxan, menghadirkan karakter elegan yang bersih di bawah cuaca cerah.', 7, 10, 'Sedang', null, 30),
  ('visionary', 'TB-04', 'Visionary', 'Clean, Segar & Menenangkan', 'pria', 'Aquatic Citrus Marine', '#3898b8', 'percikan air biru jernih dan es kristal di siang cerah', '#3898b8', '#0b2530', 'Fokus, bersih, dan menenangkan sepanjang hari. Sentuhan leci, jeruk mandarin, dan teratai membuka gelombang aroma laut dan kayu rosewood Brasil yang ditutup lembut oleh tonka bean serta musk, menemani rutinitas kerja hingga santai siang hari.', 6, 8, 'Sedang', null, 40),
  ('ultra', 'TB-05', 'Ultra', 'Seductive, Manis & Sangat Menggoda', 'pria', 'Sweet Amber Spicy', '#d49a38', 'kabut semprotan emas di antara bebatuan malam gelap', '#d49a38', '#2b1c08', 'Dirancang untuk memikat perhatian sejak langkah pertama memasuki ruangan. Kontras segar buah pir, mint, dan lavender yang melebur ke dalam hangatnya kayu manis, clary sage, serta black vanilla dan amber menciptakan jejak manis yang sangat menggoda sepanjang malam.', 8, 12, 'Kuat', null, 50),
  ('night-shift', 'TB-06', 'Night Shift', 'High Energy, Smoky-Fruity & Rebellious', 'pria', 'Smoky Fruity Nightlife', '#9b3ec8', 'jaket kulit hitam di bawah sorot neon ungu malam hari', '#9b3ec8', '#1c0d26', 'Malam adalah panggung tempatmu beraksi. Ledakan nanas, apel hijau, dan mandarin yang berpadu dengan karakter smoky-fruity modern menghadirkan energi tinggi dan daya tarik pemberontak untuk pesta malam hingga clubbing.', 8, 12, 'Kuat', null, 60),
  ('eclat', 'TB-07', 'Éclat', 'Super Fresh, Clean & Energizing', 'pria', 'Fresh Fruity Aquatic', '#4ec5d4', 'pecahan es kristal dan percikan air dingin yang menyegarkan', '#4ec5d4', '#0c2a33', 'Sensasi dingin yang membangkitkan energi di tengah cuaca paling terik. Apel beku, bergamot, dan daun mint membuka kesegaran bersih yang diperkaya buah plum, kapulaga, serta kayu apung dan amber.', 7, 10, 'Kuat', null, 70),
  ('midnight-tide', 'TB-08', 'Midnight Tide', 'Dark Aquatic, Misterius & Maskulin Klasik', 'pria', 'Dark Aquatic Mineral', '#3b6b8c', 'karang vulkanik hitam di tengah deburan ombak malam', '#3b6b8c', '#0b1824', 'Tenang, dalam, dan berwibawa layaknya samudra di malam hari. Hembusan angin laut dan bergamot bertemu herba aromatik rosemary, sage, serta asap dupa dan mineral gelap yang menegaskan kematangan pria klasik.', 8, 11, 'Kuat', null, 80),
  ('voyage', 'TB-09', 'Voyage', 'Sparkling, Mewah & Berkilau', 'pria', 'Sparkling Citrus Woody', '#68a357', 'batu sungai berlumut dengan grapefruit segar dan rimpang jahe', '#68a357', '#162614', 'Kilau kesegaran mewah yang langsung mencuri perhatian di setiap perayaan. Grapefruit yang berbinar, bergamot, jahe, dan davana mengalir ke jantung bunga magnolia serta melati, lalu menetap anggun di atas powdery musk, cedarwood, dan vetiver.', 8, 12, 'Kuat', null, 90),
  ('muse', 'TB-10', 'Muse', 'Feminin, Radiant & Anggun Modern', 'wanita', 'Radiant White Floral', '#d86b98', 'hamparan tuberose dan melati putih di bawah cahaya pagi', '#d86b98', '#2e1622', 'Pancaran keanggunan modern yang cerah dan memikat. Buket orange blossom dan bergamot membuka keharuman tuberose serta melati India yang mewah, berpadu lembut dengan vanila Madagaskar, white musk, dan kayu cedar.', 7, 10, 'Sedang', null, 100),
  ('reve', 'TB-11', 'Rêve', 'Romantic, Dreamy & Floral Mawar', 'wanita', 'Rose White Floral', '#d97254', 'mawar mekar dan bunga putih dalam rona cahaya hangat', '#d97254', '#2e1a14', 'Romantis dan membuai layaknya mimpi indah di siang maupun malam hari. Kelopak mawar segar dan bergamot menyatu dengan buket bunga putih dan mawar mekar, dibalut kehangatan vanila lembut, white musk, dan cedar.', 7, 10, 'Sedang', 'wanita', 110),
  ('lune', 'TB-12', 'Lune', 'Sweet, Sensual, Flirty & Addictive', 'wanita', 'Fruity Floral Praline', '#a8426b', 'beludru merah anggur dan mutiara di bawah cahaya purnama', '#a8426b', '#240d18', 'Manis, sensual, dan meninggalkan jejak yang sulit dilupakan. Liqueur raspberry yang menggoda berpadu dengan kelopak black peony yang elegan dan lelehan praline manis, diciptakan untuk malam penuh pesona.', 8, 12, 'Kuat', null, 120),
  ('twist', 'TB-13', 'Twist', 'Playful, Enchanting & Manis Menyenangkan', 'wanita', 'Fruity Floral Sweet', '#e57c9c', 'awan lembut merah muda dengan pita satin dan kupu-kupu', '#e57c9c', '#2e1520', 'Ceria, memikat, dan selalu membawa energi positif ke mana pun kamu melangkah. Perpaduan segar raspberry, blackberry, dan teh hijau bertemu bunga freesia, purple peony, serta hibiscus di atas kehangatan golden vanilla dan buah persik.', 6, 8, 'Sedang', null, 130),
  ('midnight-siren', 'TB-14', 'Midnight Siren', 'Bold, Sensual & Menggoda Perhatian', 'wanita', 'Warm Floral Tonka', '#c82878', 'kelopak mawar merah gelap di atas hamparan beludru hitam', '#c82878', '#260a18', 'Keseimbangan sempurna antara keberanian dan sensualitas tingkat tinggi. Almond dan kopi hitam berpadu dengan kemewahan tuberose serta jasmine sambac, ditutup kehangatan tonka bean, kakao, vanila, dan praline yang memikat setiap pasang mata.', 8, 12, 'Kuat', null, 140),
  ('secret-potion', 'TB-15', 'Secret Potion', 'Warm Gourmand, Glamour & Bikin Candu', 'wanita', 'Warm Gourmand Coffee', '#b82e52', 'pecahan kristal hitam dan pendar merah rubi di larut malam', '#b82e52', '#240912', 'Gelap, glamor, dan bikin candu sejak hirupan pertama. Buah pir dan lada merah muda membuka jalan bagi kopi hitam pekat, melati, dan bitter almond yang melebur ke dalam vanila hangat, nilam, serta kayu kasmir untuk malam yang tak terlupakan.', 8, 12, 'Kuat', null, 150)
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
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'voyage', 'muse', 'reve', 'lune', 'twist', 'midnight-siren', 'secret-potion'));

insert into public.product_notes (product_id, position, name, layer, onset, peak, fade)
select p.id, v.position, v.name, v.layer::product_layer, v.onset, v.peak, v.fade
from (values
  ('crown', 0, 'Calabrian Bergamot', 'top', 0, 10, 45),
  ('crown', 1, 'Sichuan Pepper', 'top', 0, 12, 40),
  ('crown', 2, 'Lavender', 'heart', 20, 80, 220),
  ('crown', 3, 'Pink Pepper', 'heart', 18, 70, 200),
  ('crown', 4, 'Vetiver', 'heart', 25, 95, 240),
  ('crown', 5, 'Patchouli', 'heart', 30, 100, 250),
  ('crown', 6, 'Ambroxan', 'base', 90, 240, 720),
  ('crown', 7, 'Cedar', 'base', 95, 250, 700),
  ('crown', 8, 'Labdanum', 'base', 100, 260, 720),
  ('ether', 0, 'Pear', 'top', 0, 10, 42),
  ('ether', 1, 'Bergamot', 'top', 0, 9, 38),
  ('ether', 2, 'Ginger', 'top', 0, 12, 45),
  ('ether', 3, 'Orange Blossom', 'heart', 22, 85, 230),
  ('ether', 4, 'Petalia', 'heart', 28, 95, 250),
  ('ether', 5, 'Ambrofix', 'base', 90, 240, 720),
  ('ether', 6, 'Musk', 'base', 95, 250, 700),
  ('ether', 7, 'Akigalawood', 'base', 100, 260, 720),
  ('azur', 0, 'Citron', 'top', 0, 8, 35),
  ('azur', 1, 'Calabrian Bergamot', 'top', 0, 10, 40),
  ('azur', 2, 'Sicilian Orange', 'top', 0, 9, 38),
  ('azur', 3, 'Tunisian Neroli', 'heart', 20, 75, 200),
  ('azur', 4, 'Ginger', 'heart', 22, 80, 210),
  ('azur', 5, 'Ceylon Cinnamon', 'heart', 28, 90, 230),
  ('azur', 6, 'Chinese Black Tea', 'base', 85, 220, 580),
  ('azur', 7, 'Ambroxan', 'base', 90, 240, 600),
  ('azur', 8, 'Guaiac Wood', 'base', 95, 245, 580),
  ('azur', 9, 'Olibanum', 'base', 100, 250, 600),
  ('visionary', 0, 'Litchi', 'top', 0, 9, 38),
  ('visionary', 1, 'Mandarin Orange', 'top', 0, 8, 35),
  ('visionary', 2, 'Lotus', 'top', 0, 11, 42),
  ('visionary', 3, 'Bergamot', 'top', 0, 10, 40),
  ('visionary', 4, 'Sea Notes', 'heart', 20, 75, 210),
  ('visionary', 5, 'Orange', 'heart', 22, 70, 190),
  ('visionary', 6, 'Brazilian Rosewood', 'heart', 28, 88, 225),
  ('visionary', 7, 'Tonka Bean', 'base', 85, 215, 480),
  ('visionary', 8, 'Amber', 'base', 90, 225, 480),
  ('visionary', 9, 'Musk', 'base', 88, 220, 480),
  ('visionary', 10, 'Benzoin', 'base', 95, 230, 460),
  ('ultra', 0, 'Pear', 'top', 0, 10, 40),
  ('ultra', 1, 'Lavender', 'top', 0, 12, 45),
  ('ultra', 2, 'Mint', 'top', 0, 8, 32),
  ('ultra', 3, 'Bergamot', 'top', 0, 9, 36),
  ('ultra', 4, 'Cinnamon', 'heart', 24, 88, 235),
  ('ultra', 5, 'Clary Sage', 'heart', 26, 92, 230),
  ('ultra', 6, 'Caraway', 'heart', 30, 95, 220),
  ('ultra', 7, 'Black Vanilla', 'base', 90, 245, 720),
  ('ultra', 8, 'Amber', 'base', 95, 255, 720),
  ('ultra', 9, 'Cedarwood', 'base', 92, 240, 690),
  ('night-shift', 0, 'Pineapple', 'top', 0, 10, 45),
  ('night-shift', 1, 'Green Apple', 'top', 0, 9, 40),
  ('night-shift', 2, 'Mandarin', 'top', 0, 8, 36),
  ('night-shift', 3, 'Cedarwood', 'heart', 24, 85, 225),
  ('night-shift', 4, 'Oakmoss', 'heart', 28, 92, 240),
  ('night-shift', 5, 'Vanilla', 'heart', 30, 98, 250),
  ('night-shift', 6, 'Ambergris', 'base', 92, 245, 720),
  ('night-shift', 7, 'Dry Woods', 'base', 95, 255, 720),
  ('night-shift', 8, 'Caramel', 'base', 90, 240, 700),
  ('night-shift', 9, 'Musk', 'base', 98, 260, 720),
  ('eclat', 0, 'Frozen Apple', 'top', 0, 9, 40),
  ('eclat', 1, 'Bergamot', 'top', 0, 10, 38),
  ('eclat', 2, 'Mint', 'top', 0, 7, 32),
  ('eclat', 3, 'Plum', 'heart', 22, 80, 210),
  ('eclat', 4, 'Orange Blossom', 'heart', 25, 85, 220),
  ('eclat', 5, 'Cardamom', 'heart', 28, 90, 230),
  ('eclat', 6, 'Amber', 'base', 88, 225, 580),
  ('eclat', 7, 'Musk', 'base', 90, 235, 600),
  ('eclat', 8, 'Driftwood', 'base', 92, 240, 580),
  ('midnight-tide', 0, 'Sea Notes', 'top', 0, 10, 42),
  ('midnight-tide', 1, 'Bergamot', 'top', 0, 9, 36),
  ('midnight-tide', 2, 'Marine Accents', 'top', 0, 11, 45),
  ('midnight-tide', 3, 'Rosemary', 'heart', 24, 82, 215),
  ('midnight-tide', 4, 'Sage', 'heart', 26, 88, 225),
  ('midnight-tide', 5, 'Geranium', 'heart', 28, 90, 220),
  ('midnight-tide', 6, 'Incense', 'base', 92, 245, 660),
  ('midnight-tide', 7, 'Patchouli', 'base', 95, 250, 660),
  ('midnight-tide', 8, 'Mineral Notes', 'base', 90, 240, 640),
  ('voyage', 0, 'Grapefruit', 'top', 0, 9, 40),
  ('voyage', 1, 'Bergamot', 'top', 0, 10, 38),
  ('voyage', 2, 'Ginger', 'top', 0, 11, 42),
  ('voyage', 3, 'Davana', 'top', 0, 12, 45),
  ('voyage', 4, 'Magnolia', 'heart', 24, 82, 220),
  ('voyage', 5, 'Jasmine', 'heart', 26, 88, 230),
  ('voyage', 6, 'Nutmeg', 'heart', 28, 92, 235),
  ('voyage', 7, 'Powdery Musk', 'base', 90, 240, 700),
  ('voyage', 8, 'Cedarwood', 'base', 92, 245, 720),
  ('voyage', 9, 'Vetiver', 'base', 95, 250, 700),
  ('voyage', 10, 'Patchouli', 'base', 98, 255, 720),
  ('muse', 0, 'Orange Blossom', 'top', 0, 10, 42),
  ('muse', 1, 'Bergamot', 'top', 0, 9, 36),
  ('muse', 2, 'Tuberose', 'heart', 24, 88, 240),
  ('muse', 3, 'Indian Jasmine', 'heart', 26, 92, 245),
  ('muse', 4, 'Madagascar Vanilla', 'base', 90, 235, 600),
  ('muse', 5, 'White Musk', 'base', 92, 240, 600),
  ('muse', 6, 'Cedarwood', 'base', 95, 245, 580),
  ('reve', 0, 'Fresh Rose Petals', 'top', 0, 9, 40),
  ('reve', 1, 'Bergamot', 'top', 0, 8, 36),
  ('reve', 2, 'Mixed White Florals', 'heart', 24, 88, 235),
  ('reve', 3, 'Blooming Rose', 'heart', 26, 95, 245),
  ('reve', 4, 'Soft Vanilla', 'base', 90, 235, 600),
  ('reve', 5, 'White Musk', 'base', 92, 240, 600),
  ('reve', 6, 'Cedar', 'base', 95, 245, 580),
  ('lune', 0, 'Raspberry Liqueur', 'top', 0, 11, 45),
  ('lune', 1, 'Black Peony', 'heart', 25, 92, 240),
  ('lune', 2, 'Praline', 'base', 92, 245, 720),
  ('lune', 3, 'Sweet Accords', 'base', 95, 255, 720),
  ('twist', 0, 'Raspberry', 'top', 0, 9, 36),
  ('twist', 1, 'Blackberry', 'top', 0, 10, 38),
  ('twist', 2, 'Green Tea', 'top', 0, 8, 34),
  ('twist', 3, 'Freesia', 'heart', 22, 78, 195),
  ('twist', 4, 'Purple Peony', 'heart', 25, 82, 205),
  ('twist', 5, 'Hibiscus', 'heart', 28, 85, 210),
  ('twist', 6, 'Golden Vanilla', 'base', 85, 210, 480),
  ('twist', 7, 'Warm Musk', 'base', 88, 215, 480),
  ('twist', 8, 'Peach', 'base', 82, 200, 450),
  ('midnight-siren', 0, 'Almond', 'top', 0, 10, 42),
  ('midnight-siren', 1, 'Coffee', 'top', 0, 12, 48),
  ('midnight-siren', 2, 'Bergamot', 'top', 0, 8, 35),
  ('midnight-siren', 3, 'Lemon', 'top', 0, 7, 32),
  ('midnight-siren', 4, 'Tuberose', 'heart', 25, 90, 240),
  ('midnight-siren', 5, 'Jasmine Sambac', 'heart', 28, 95, 245),
  ('midnight-siren', 6, 'Orange Blossom', 'heart', 24, 85, 230),
  ('midnight-siren', 7, 'Tonka Bean', 'base', 92, 245, 720),
  ('midnight-siren', 8, 'Cacao', 'base', 95, 250, 700),
  ('midnight-siren', 9, 'Vanilla', 'base', 98, 255, 720),
  ('midnight-siren', 10, 'Praline', 'base', 95, 250, 710),
  ('midnight-siren', 11, 'Patchouli', 'base', 100, 260, 720),
  ('secret-potion', 0, 'Pear', 'top', 0, 9, 38),
  ('secret-potion', 1, 'Pink Pepper', 'top', 0, 10, 40),
  ('secret-potion', 2, 'Orange Blossom', 'top', 0, 11, 44),
  ('secret-potion', 3, 'Black Coffee', 'heart', 24, 90, 245),
  ('secret-potion', 4, 'Jasmine', 'heart', 26, 85, 230),
  ('secret-potion', 5, 'Bitter Almond', 'heart', 28, 92, 235),
  ('secret-potion', 6, 'Licorice', 'heart', 30, 95, 240),
  ('secret-potion', 7, 'Vanilla', 'base', 92, 250, 720),
  ('secret-potion', 8, 'Patchouli', 'base', 95, 255, 710),
  ('secret-potion', 9, 'Cedarwood', 'base', 98, 245, 700),
  ('secret-potion', 10, 'Cashmere Wood', 'base', 100, 260, 720)
) as v(slug, position, name, layer, onset, peak, fade)
join public.products p on p.slug = v.slug;

delete from public.product_sizes
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'voyage', 'muse', 'reve', 'lune', 'twist', 'midnight-siren', 'secret-potion'));

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
  ('voyage', 30, 149000),
  ('voyage', 50, 219000),
  ('muse', 30, 149000),
  ('muse', 50, 219000),
  ('reve', 30, 149000),
  ('reve', 50, 219000),
  ('lune', 30, 149000),
  ('lune', 50, 219000),
  ('twist', 30, 149000),
  ('twist', 50, 219000),
  ('midnight-siren', 30, 149000),
  ('midnight-siren', 50, 219000),
  ('secret-potion', 30, 149000),
  ('secret-potion', 50, 219000)
) as v(slug, ml, price)
join public.products p on p.slug = v.slug;

delete from public.product_vibes
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'voyage', 'muse', 'reve', 'lune', 'twist', 'midnight-siren', 'secret-potion'));

insert into public.product_vibes (product_id, vibe)
select p.id, v.vibe::product_vibe
from (values
  ('crown', 'fresh'),
  ('crown', 'woody'),
  ('ether', 'woody'),
  ('ether', 'fresh'),
  ('azur', 'fresh'),
  ('azur', 'woody'),
  ('visionary', 'fresh'),
  ('ultra', 'sweet'),
  ('ultra', 'dark'),
  ('night-shift', 'sweet'),
  ('night-shift', 'dark'),
  ('eclat', 'fresh'),
  ('eclat', 'sweet'),
  ('midnight-tide', 'fresh'),
  ('midnight-tide', 'dark'),
  ('midnight-tide', 'woody'),
  ('voyage', 'fresh'),
  ('voyage', 'woody'),
  ('muse', 'floral'),
  ('muse', 'sweet'),
  ('reve', 'floral'),
  ('lune', 'sweet'),
  ('lune', 'floral'),
  ('twist', 'sweet'),
  ('twist', 'floral'),
  ('twist', 'fresh'),
  ('midnight-siren', 'sweet'),
  ('midnight-siren', 'dark'),
  ('midnight-siren', 'floral'),
  ('secret-potion', 'sweet'),
  ('secret-potion', 'dark')
) as v(slug, vibe)
join public.products p on p.slug = v.slug;

delete from public.product_occasions
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'voyage', 'muse', 'reve', 'lune', 'twist', 'midnight-siren', 'secret-potion'));

insert into public.product_occasions (product_id, position, label)
select p.id, v.position, v.label
from (values
  ('crown', 0, 'Daily Office'),
  ('crown', 1, 'Meeting Penting'),
  ('crown', 2, 'Formal & Casual'),
  ('ether', 0, 'Formal'),
  ('ether', 1, 'Hangout Mewah'),
  ('ether', 2, 'Acara Eksklusif'),
  ('azur', 0, 'Semi-Formal'),
  ('azur', 1, 'Cuaca Cerah'),
  ('azur', 2, 'Liburan Kelas Atas'),
  ('visionary', 0, 'Kerja Harian'),
  ('visionary', 1, 'Kuliah'),
  ('visionary', 2, 'Aktivitas Santai Siang Hari'),
  ('ultra', 0, 'Malam Hari'),
  ('ultra', 1, 'Night Out'),
  ('ultra', 2, 'Pesta'),
  ('ultra', 3, 'Kencan Romantis'),
  ('night-shift', 0, 'Pesta Malam'),
  ('night-shift', 1, 'Hangout Seru'),
  ('night-shift', 2, 'Clubbing'),
  ('eclat', 0, 'Casual'),
  ('eclat', 1, 'Outdoor'),
  ('eclat', 2, 'Olahraga'),
  ('eclat', 3, 'Cuaca Panas'),
  ('midnight-tide', 0, 'Pertemuan Formal'),
  ('midnight-tide', 1, 'Acara Malam'),
  ('midnight-tide', 2, 'Pria Dewasa/Wibawa'),
  ('voyage', 0, 'Acara Spesial'),
  ('voyage', 1, 'Dinner Mewah'),
  ('voyage', 2, 'Semi-Formal'),
  ('muse', 0, 'Kerja'),
  ('muse', 1, 'Hangout Cantik'),
  ('muse', 2, 'Kencan Kasual'),
  ('reve', 0, 'Kencan Romantis'),
  ('reve', 1, 'Acara Semi-Formal'),
  ('reve', 2, 'Siang/Malam'),
  ('lune', 0, 'Malam Hari'),
  ('lune', 1, 'Party'),
  ('lune', 2, 'Kencan Intim'),
  ('twist', 0, 'Aktivitas Sehari-hari'),
  ('twist', 1, 'Hangout Santai'),
  ('twist', 2, 'Day Out'),
  ('midnight-siren', 0, 'Pesta Malam'),
  ('midnight-siren', 1, 'Acara Glamour'),
  ('midnight-siren', 2, 'Special Night Out'),
  ('secret-potion', 0, 'Cuaca Dingin/Malam Hari'),
  ('secret-potion', 1, 'Hangout Malam'),
  ('secret-potion', 2, 'Nightlife')
) as v(slug, position, label)
join public.products p on p.slug = v.slug;

delete from public.product_badges
 where product_id in (select id from public.products where slug in ('crown', 'ether', 'azur', 'visionary', 'ultra', 'night-shift', 'eclat', 'midnight-tide', 'voyage', 'muse', 'reve', 'lune', 'twist', 'midnight-siren', 'secret-potion'));

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
  ('voyage', 0, 'Signature'),
  ('muse', 0, 'Signature'),
  ('reve', 0, 'Best Seller'),
  ('reve', 1, 'Signature'),
  ('lune', 0, 'Best Seller'),
  ('twist', 0, 'Best Seller'),
  ('midnight-siren', 0, 'Night Out'),
  ('secret-potion', 0, 'Night Out'),
  ('secret-potion', 1, 'Signature')
) as v(slug, position, label)
join public.products p on p.slug = v.slug;

commit;
