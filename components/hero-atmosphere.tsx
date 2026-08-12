/**
 * Kabut sillage.
 *
 * Hero sudah menggambar sumbu waktu dan kurva, tapi ruang di antaranya hitam
 * rata. Lapisan ini mengisinya dengan uap yang mengambil warna cairan varian
 * yang sedang tampil, jadi latar tidak sekadar cantik: ia ikut berganti warna
 * setiap kali kurva morph ke varian berikutnya.
 *
 * Warnanya dibaca dari `--hero-juice`, variabel yang sudah ditulis GSAP pada
 * elemen hero di tiap frame. Karena itu komponen ini tidak menerima prop apa
 * pun dan tidak menjalankan JavaScript sama sekali: geraknya animasi CSS murni,
 * sama seperti pita nama varian. Menjalankan timeline kedua hanya untuk
 * menggeser tiga gradien akan membayar ongkos yang tidak perlu.
 *
 * Arah visual diambil dari Silk Aurora di 21st.dev (pita satin + film grain +
 * vignette), tapi shader WebGL-nya diganti gradien radial dan satu tekstur
 * feTurbulence. Hasilnya kelas yang sama tanpa canvas, tanpa dependensi baru,
 * dan tanpa beban GPU di ponsel kelas bawah.
 *
 * Induknya harus `relative` dan `overflow-hidden`.
 */
export function HeroAtmosphere() {
  return (
    <div aria-hidden="true" className="hero-atmosphere">
      {/* Tiga massa uap dengan laju berbeda. Periode yang tidak kelipatan satu
          sama lain membuat susunannya tidak pernah berulang persis. */}
      <div className="hero-vapor hero-vapor--top" />
      <div className="hero-vapor hero-vapor--gold" />
      <div className="hero-vapor hero-vapor--base" />

      {/* Menggelapkan tepi dan pucuk layar. Header menempel di atas hero, jadi
          bagian itu harus tetap tenang agar nama toko dan menu terbaca. */}
      <div className="hero-vignette" />

      {/* Butiran film. Menyatukan gradien dan teks pada satu permukaan; tanpa
          ini gradien besar terbaca sebagai banding, bukan sebagai kabut. */}
      <div className="hero-grain" />
    </div>
  );
}
