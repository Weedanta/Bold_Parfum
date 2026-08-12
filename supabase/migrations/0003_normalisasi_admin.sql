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

begin;

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

commit;
