/**
 * Sumber tunggal untuk FAQ: dirender di halaman Tentang sekaligus jadi isi
 * JSON-LD FAQPage. Satu daftar, dua konsumen, tidak bisa berbeda isi.
 */
export const faq = [
  {
    question: "Bagaimana cara kerja kuis Scent Profiler?",
    answer:
      "Kamu cukup menjawab empat pertanyaan singkat soal gaya keseharian dan suasana yang kamu suka. Dari jawaban itu, kami pilihkan varian The Bold yang karakternya paling nyambung dengan kepribadianmu, jadi kamu tidak perlu menebak-nebak istilah parfum.",
  },
  {
    question: "Cara membaca grafik kurva aroma di tiap parfum itu gimana?",
    answer:
      "Wangi parfum berubah seiring waktu setelah disemprot. Grafik itu membantu kamu membayangkan perjalanannya: wangi segar di 15 menit pertama (top notes), aroma inti setelah setengah jam (heart notes), sampai wangi dasar yang menempel di kulit berjam-jam kemudian (base notes).",
  },
  {
    question: "Berapa lama wangi parfum The Bold bertahan di kulit?",
    answer:
      "Rata-rata bertahan 6 sampai 12 jam tergantung varian dan aktivitasmu. Varian segar untuk siang hari biasanya bertahan 6 sampai 10 jam, sedangkan varian hangat dengan vanila, amber, atau kayu-kayuan bisa awet 8 sampai 12 jam.",
  },
  {
    question: "Ada ukuran botol apa saja?",
    answer:
      "Semua varian tersedia dalam dua ukuran: botol 30 ml yang praktis dibawa di tas, dan botol 50 ml untuk pemakaian rutin setiap hari.",
  },
  {
    question: "Bagaimana cara memesannya?",
    answer:
      "Tinggal pilih ukuran botol yang kamu mau, lalu klik tombol Beli via WhatsApp. Kalau ingin beli lebih dari satu varian, masukkan dulu ke keranjang. Daftar pesananmu akan otomatis terformat rapi di chat WhatsApp admin kami.",
  },
  {
    question: "Kalau wanginya kurang cocok, apakah bisa ditukar?",
    answer:
      "Bisa. Selama segel kemasan belum dibuka, kamu bisa mengajukan penukaran ke varian lain maksimal 7 hari sejak paket diterima. Untuk alasan kebersihan, botol yang segelnya sudah dibuka tidak dapat ditukar.",
  },
] as const;
