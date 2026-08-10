-- SETUP SEKALI JALAN untuk katalog The Bold.
-- Gabungan dari supabase/migrations/0001_catalog.sql, 0002_storage.sql, dan seed.sql.
-- Tempel seluruh isi file ini ke Supabase SQL Editor lalu Run.
-- Aman dijalankan berulang.

begin;

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

-- DIHASILKAN OTOMATIS oleh scripts/generate-seed-sql.ts. Jangan diedit tangan.
-- Sumber: lib/seed/products.seed.ts
-- Perbarui dengan: npm run seed:sql
--
-- Aman dijalankan berulang. Menjalankannya lagi akan menimpa perubahan yang
-- dibuat lewat dashboard, kecuali photo_path yang sengaja dipertahankan.

insert into public.products (
  slug,
  code,
  name,
  subtitle,
  category,
  family,
  vibes,
  juice,
  atmosphere_label,
  atmosphere_from,
  atmosphere_to,
  story,
  longevity_min,
  longevity_max,
  sillage,
  occasions,
  badges,
  notes,
  sizes,
  featured_for,
  sort_order
) values
  (
    'crown',
    'TB-01',
    'Crown',
    'Charisma in a Bottle',
    'pria',
    'Fresh Spicy',
    array['fresh', 'woody']::product_vibe[],
    '#c98a3c',
    'cahaya lampu gantung di ruang rapat petang',
    '#c98a3c',
    '#3a2410',
    'Karaktermu yang kuat dan dominan membutuhkan aroma yang dihormati. Crown adalah simbol karisma yang tak terbantahkan.',
    8,
    12,
    'Kuat',
    array['Kantor', 'Acara formal petang'],
    array['Best Seller', 'Signature'],
    '[{"name":"Bergamot Calabria","layer":"top","onset":0,"peak":10,"fade":45},{"name":"Lada Merah Muda","layer":"top","onset":0,"peak":12,"fade":40},{"name":"Grapefruit","layer":"top","onset":0,"peak":8,"fade":35},{"name":"Lavender","layer":"heart","onset":20,"peak":80,"fade":220},{"name":"Kayu Manis","layer":"heart","onset":25,"peak":90,"fade":240},{"name":"Pala","layer":"heart","onset":30,"peak":95,"fade":230},{"name":"Cedarwood","layer":"base","onset":90,"peak":240,"fade":720},{"name":"Ambergris","layer":"base","onset":100,"peak":260,"fade":720},{"name":"Vetiver","layer":"base","onset":95,"peak":250,"fade":660}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    'pria',
    10
  ),
  (
    'ether',
    'TB-02',
    'Ether',
    'Kemewahan yang Tenang',
    'pria',
    'Woody Niche',
    array['woody']::product_vibe[],
    '#7c8b7a',
    'asap dupa di ruang berlantai kayu',
    '#7c8b7a',
    '#1c2320',
    'Aura eksklusivitas mengelilingimu. Ether adalah harmoni sempurna untuk kamu yang berkelas dan menyukai kemewahan yang tenang.',
    8,
    12,
    'Kuat',
    array['Acara formal', 'Signature harian'],
    array['Signature'],
    '[{"name":"Elemi","layer":"top","onset":0,"peak":10,"fade":40},{"name":"Jeruk Pahit","layer":"top","onset":0,"peak":9,"fade":35},{"name":"Iris","layer":"heart","onset":25,"peak":90,"fade":240},{"name":"Cengkeh","layer":"heart","onset":30,"peak":100,"fade":230},{"name":"Gaharu Ringan","layer":"heart","onset":35,"peak":110,"fade":260},{"name":"Oud","layer":"base","onset":95,"peak":250,"fade":720},{"name":"Sandalwood","layer":"base","onset":90,"peak":240,"fade":700},{"name":"Musk Putih","layer":"base","onset":100,"peak":260,"fade":720}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    20
  ),
  (
    'azur',
    'TB-03',
    'Azur',
    'Kesegaran Absolut',
    'pria',
    'Fresh Citrus',
    array['fresh']::product_vibe[],
    '#7fc8d6',
    'ombak siang di laut dangkal',
    '#7fc8d6',
    '#0e3540',
    'Kamu adalah pribadi yang santai dan menyukai kebersihan. Azur akan menemani hari aktifmu dengan kesegaran absolut.',
    5,
    7,
    'Sedang',
    array['Harian', 'Siang hari'],
    array['Best Seller'],
    '[{"name":"Lemon Sisilia","layer":"top","onset":0,"peak":8,"fade":35},{"name":"Bergamot","layer":"top","onset":0,"peak":10,"fade":40},{"name":"Daun Mint","layer":"top","onset":0,"peak":7,"fade":30},{"name":"Neroli","layer":"heart","onset":20,"peak":70,"fade":180},{"name":"Teh Putih","layer":"heart","onset":25,"peak":80,"fade":190},{"name":"Musk Bersih","layer":"base","onset":85,"peak":200,"fade":420},{"name":"Cedar Muda","layer":"base","onset":90,"peak":210,"fade":420}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    30
  ),
  (
    'visionary',
    'TB-04',
    'Visionary',
    'Dorongan Semangat Harian',
    'pria',
    'Aquatic Sporty',
    array['fresh']::product_vibe[],
    '#5c8bb0',
    'udara pagi berkabut di tepi dermaga',
    '#5c8bb0',
    '#12222f',
    'Fokus, segar, dan maskulin. Visionary adalah dorongan semangat harianmu untuk jiwa yang bebas.',
    6,
    8,
    'Sedang',
    array['Olahraga', 'Kasual'],
    '{}',
    '[{"name":"Nota Laut","layer":"top","onset":0,"peak":9,"fade":40},{"name":"Jeruk Mandarin","layer":"top","onset":0,"peak":8,"fade":35},{"name":"Rosemary","layer":"heart","onset":22,"peak":75,"fade":200},{"name":"Geranium","layer":"heart","onset":25,"peak":85,"fade":210},{"name":"Garam Air","layer":"heart","onset":20,"peak":80,"fade":220},{"name":"Kayu Apung","layer":"base","onset":88,"peak":220,"fade":480},{"name":"Musk Abu","layer":"base","onset":90,"peak":230,"fade":480}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    40
  ),
  (
    'ultra',
    'TB-05',
    'Ultra',
    'Manis yang Intens',
    'pria',
    'Sweet Seductive',
    array['sweet']::product_vibe[],
    '#8e2f45',
    'lampu merah panggung sebelum tengah malam',
    '#8e2f45',
    '#2a0d16',
    'Kamu adalah nyawa dari setiap suasana. Ultra dirancang untuk memikat perhatian dengan aroma manis yang intens.',
    8,
    12,
    'Kuat',
    array['Pesta', 'Malam'],
    array['Night Out'],
    '[{"name":"Nanas","layer":"top","onset":0,"peak":10,"fade":40},{"name":"Bergamot","layer":"top","onset":0,"peak":9,"fade":35},{"name":"Kayu Manis","layer":"heart","onset":25,"peak":90,"fade":230},{"name":"Melati","layer":"heart","onset":28,"peak":95,"fade":240},{"name":"Vanila Bourbon","layer":"base","onset":95,"peak":250,"fade":720},{"name":"Kemenyan","layer":"base","onset":100,"peak":260,"fade":700},{"name":"Amber","layer":"base","onset":95,"peak":255,"fade":720}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    50
  ),
  (
    'night-shift',
    'TB-06',
    'Night Shift',
    'Daya Tarik Pemberontak',
    'pria',
    'Sweet Nightlife',
    array['sweet', 'dark']::product_vibe[],
    '#6f4a9c',
    'gemerlap kota selepas tengah malam',
    '#6f4a9c',
    '#160f24',
    'Malam adalah waktumu beraksi. Night Shift memiliki daya tarik pemberontak yang manis namun sangat maskulin.',
    8,
    12,
    'Kuat',
    array['Kelab', 'Malam panjang'],
    array['Night Out', 'Best Seller'],
    '[{"name":"Absinth","layer":"top","onset":0,"peak":11,"fade":45},{"name":"Kapulaga","layer":"top","onset":0,"peak":10,"fade":40},{"name":"Bunga Jeruk","layer":"heart","onset":25,"peak":85,"fade":220},{"name":"Lavender Gelap","layer":"heart","onset":30,"peak":95,"fade":235},{"name":"Tonka Bean","layer":"base","onset":95,"peak":250,"fade":720},{"name":"Vanila Asap","layer":"base","onset":100,"peak":260,"fade":720},{"name":"Cedar Hitam","layer":"base","onset":95,"peak":245,"fade":700}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    60
  ),
  (
    'eclat',
    'TB-07',
    'Eclat',
    'Segar dengan Sentuhan Manis',
    'pria',
    'Sweet Aquatic',
    array['fresh', 'sweet']::product_vibe[],
    '#4fb3a5',
    'kolam jernih di bawah langit sore',
    '#4fb3a5',
    '#0f2e2c',
    'Santai namun tetap stand out. Eclat memberikan kesegaran dengan sentuhan manis yang sangat modern.',
    6,
    8,
    'Sedang',
    array['Harian', 'Kencan siang'],
    '{}',
    '[{"name":"Bergamot Manis","layer":"top","onset":0,"peak":9,"fade":38},{"name":"Pir","layer":"top","onset":0,"peak":10,"fade":40},{"name":"Nota Laut","layer":"heart","onset":22,"peak":80,"fade":200},{"name":"Melati Air","layer":"heart","onset":25,"peak":85,"fade":210},{"name":"Musk Manis","layer":"base","onset":88,"peak":220,"fade":480},{"name":"Ambroxan","layer":"base","onset":90,"peak":230,"fade":480}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    70
  ),
  (
    'midnight-tide',
    'TB-08',
    'Midnight Tide',
    'Kedalaman Lautan Malam',
    'pria',
    'Deep Marine',
    array['fresh', 'dark']::product_vibe[],
    '#2e7d8a',
    'laut gelap di bawah bulan',
    '#2e7d8a',
    '#0a1b1f',
    'Tenang dan dalam seperti lautan malam. Mencerminkan kedewasaan dan kedalaman karaktermu yang misterius.',
    8,
    10,
    'Kuat',
    array['Malam', 'Formal tenang'],
    array['Signature'],
    '[{"name":"Garam Laut","layer":"top","onset":0,"peak":10,"fade":42},{"name":"Jeruk Bali","layer":"top","onset":0,"peak":9,"fade":36},{"name":"Rumput Laut","layer":"heart","onset":24,"peak":85,"fade":215},{"name":"Sage","layer":"heart","onset":28,"peak":90,"fade":225},{"name":"Ambergris Gelap","layer":"base","onset":92,"peak":245,"fade":600},{"name":"Vetiver Basah","layer":"base","onset":95,"peak":250,"fade":600},{"name":"Musk Mineral","layer":"base","onset":90,"peak":240,"fade":600}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    80
  ),
  (
    'twist',
    'TB-09',
    'Twist',
    'Energi Positif Setiap Hari',
    'wanita',
    'Fruity Floral Sweet',
    array['sweet', 'floral']::product_vibe[],
    '#e8735f',
    'kelopak dan buah di meja pagi',
    '#e8735f',
    '#3d1a16',
    'Ceria dan menyenangkan. Twist memancarkan pesona mudamu yang selalu membawa energi positif di setiap suasana.',
    5,
    7,
    'Sedang',
    array['Harian', 'Kampus'],
    array['Best Seller'],
    '[{"name":"Raspberry","layer":"top","onset":0,"peak":9,"fade":35},{"name":"Jeruk Mandarin","layer":"top","onset":0,"peak":8,"fade":32},{"name":"Peony","layer":"heart","onset":22,"peak":75,"fade":185},{"name":"Melati Manis","layer":"heart","onset":25,"peak":80,"fade":195},{"name":"Musk Putih","layer":"base","onset":85,"peak":200,"fade":420},{"name":"Vanila Ringan","layer":"base","onset":88,"peak":210,"fade":420}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    90
  ),
  (
    'reve',
    'TB-10',
    'Reve',
    'Kecantikan yang Elegan',
    'wanita',
    'White Floral',
    array['floral']::product_vibe[],
    '#e6dcc8',
    'kelopak putih di ruang berkain linen',
    '#e6dcc8',
    '#33302a',
    'Anggun dan penuh percaya diri. Reve merangkum kecantikan elegan yang cocok untuk wanita berselera tinggi.',
    7,
    9,
    'Sedang',
    array['Kantor', 'Acara formal'],
    array['Best Seller', 'Signature'],
    '[{"name":"Bergamot","layer":"top","onset":0,"peak":9,"fade":38},{"name":"Pir Putih","layer":"top","onset":0,"peak":10,"fade":40},{"name":"Tuberose","layer":"heart","onset":25,"peak":90,"fade":240},{"name":"Melati Sambac","layer":"heart","onset":28,"peak":95,"fade":245},{"name":"Gardenia","layer":"heart","onset":30,"peak":100,"fade":250},{"name":"Musk Halus","layer":"base","onset":90,"peak":235,"fade":540},{"name":"Sandalwood Krem","layer":"base","onset":92,"peak":240,"fade":540}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    'wanita',
    100
  ),
  (
    'lune',
    'TB-11',
    'Lune',
    'Jejak yang Sulit Dilupakan',
    'wanita',
    'Sweet Praline',
    array['sweet']::product_vibe[],
    '#c08552',
    'karamel hangat di bawah lampu temaram',
    '#c08552',
    '#33200f',
    'Aromamu meninggalkan jejak yang sulit dilupakan. Lune diciptakan untuk kamu yang berani tampil memukau.',
    8,
    12,
    'Kuat',
    array['Malam', 'Kencan'],
    array['Best Seller'],
    '[{"name":"Almond","layer":"top","onset":0,"peak":11,"fade":42},{"name":"Bergamot","layer":"top","onset":0,"peak":9,"fade":35},{"name":"Bunga Jeruk","layer":"heart","onset":25,"peak":88,"fade":225},{"name":"Praline","layer":"heart","onset":30,"peak":100,"fade":250},{"name":"Tonka Bean","layer":"base","onset":95,"peak":250,"fade":720},{"name":"Vanila","layer":"base","onset":100,"peak":255,"fade":720},{"name":"Musk Hangat","layer":"base","onset":95,"peak":245,"fade":700}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    110
  ),
  (
    'midnight-siren',
    'TB-12',
    'Midnight Siren',
    'Berani dan Sensual',
    'wanita',
    'Tonka Bold',
    array['sweet', 'dark']::product_vibe[],
    '#8c3a63',
    'beludru gelap di ruang tanpa jendela',
    '#8c3a63',
    '#25101c',
    'Keseimbangan sempurna yang sangat berani, powerful, namun tetap sensual di saat bersamaan.',
    8,
    12,
    'Kuat',
    array['Malam', 'Acara besar'],
    array['Night Out'],
    '[{"name":"Plum","layer":"top","onset":0,"peak":10,"fade":40},{"name":"Lada Merah Muda","layer":"top","onset":0,"peak":9,"fade":36},{"name":"Mawar Gelap","layer":"heart","onset":25,"peak":90,"fade":235},{"name":"Iris","layer":"heart","onset":30,"peak":95,"fade":245},{"name":"Tonka Bean","layer":"base","onset":95,"peak":250,"fade":720},{"name":"Patchouli","layer":"base","onset":98,"peak":255,"fade":700},{"name":"Amber Gelap","layer":"base","onset":95,"peak":250,"fade":720}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    120
  ),
  (
    'secret-potion',
    'TB-13',
    'Secret Potion',
    'Senjata Rahasia Malammu',
    'wanita',
    'Vanilla Coffee Dark',
    array['sweet', 'dark']::product_vibe[],
    '#7a4a2f',
    'kopi hitam dan kayu di larut malam',
    '#7a4a2f',
    '#1d100a',
    'Gelap, adiktif, dan menggoda. Ini adalah senjata rahasiamu untuk malam yang tak terlupakan. Sangat memikat.',
    8,
    12,
    'Kuat',
    array['Malam', 'Suasana intim'],
    array['Night Out', 'Signature'],
    '[{"name":"Kopi Panggang","layer":"top","onset":0,"peak":12,"fade":50},{"name":"Kapulaga","layer":"top","onset":0,"peak":10,"fade":40},{"name":"Bunga Jeruk","layer":"heart","onset":25,"peak":85,"fade":220},{"name":"Kakao","layer":"heart","onset":30,"peak":95,"fade":240},{"name":"Vanila Gelap","layer":"base","onset":95,"peak":255,"fade":720},{"name":"Benzoin","layer":"base","onset":100,"peak":260,"fade":720},{"name":"Musk Hitam","layer":"base","onset":95,"peak":250,"fade":700}]'::jsonb,
    '[{"ml":30,"price":149000},{"ml":50,"price":219000}]'::jsonb,
    null,
    130
  )
on conflict (slug) do update set
  code = excluded.code,
  name = excluded.name,
  subtitle = excluded.subtitle,
  category = excluded.category,
  family = excluded.family,
  vibes = excluded.vibes,
  juice = excluded.juice,
  atmosphere_label = excluded.atmosphere_label,
  atmosphere_from = excluded.atmosphere_from,
  atmosphere_to = excluded.atmosphere_to,
  story = excluded.story,
  longevity_min = excluded.longevity_min,
  longevity_max = excluded.longevity_max,
  sillage = excluded.sillage,
  occasions = excluded.occasions,
  badges = excluded.badges,
  notes = excluded.notes,
  sizes = excluded.sizes,
  featured_for = excluded.featured_for,
  sort_order = excluded.sort_order;

commit;
