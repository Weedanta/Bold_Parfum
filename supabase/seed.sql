-- DIHASILKAN OTOMATIS oleh scripts/generate-seed-sql.ts. Jangan diedit tangan.
-- Sumber: lib/seed/products.seed.ts
-- Perbarui dengan: npm run seed:sql
--
-- Aman dijalankan berulang. Menjalankannya lagi akan menimpa perubahan isi yang
-- dibuat lewat panel admin, kecuali photo_path dan stock_status yang sengaja
-- dipertahankan.

begin;

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
