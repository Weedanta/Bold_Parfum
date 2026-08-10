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
