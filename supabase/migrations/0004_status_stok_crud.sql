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

begin;

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

commit;
