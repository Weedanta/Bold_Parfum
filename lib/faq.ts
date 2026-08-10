/**
 * Sumber tunggal untuk FAQ: dirender di halaman Tentang sekaligus jadi isi
 * JSON-LD FAQPage. Satu daftar, dua konsumen, tidak bisa berbeda isi.
 */
export const faq = [
  {
    question: "Bagaimana cara kerja Scent Profiler?",
    answer:
      "Empat pertanyaan tentang cara Anda hadir di ruangan, dorongan hidup, dan sisi lain diri Anda. Jawaban itu diterjemahkan jadi bobot karakter, lalu dicocokkan dengan karakter tiap varian. Tidak perlu paham istilah parfum sama sekali.",
  },
  {
    question: "Apa arti kurva sillage di setiap halaman varian?",
    answer:
      "Grafik itu menunjukkan kapan tiap note muncul, memuncak, dan menghilang. Top note terasa di menit-menit pertama, heart note mengambil alih setelah sekitar 30 menit, base note bertahan setelah dua jam. Ini cara kami menggantikan pengalaman mencium langsung di toko.",
  },
  {
    question: "Berapa lama parfum The Bold bertahan?",
    answer:
      "Tergantung varian. Yang paling ringan bertahan sekitar 5 sampai 7 jam, sedangkan varian dengan base note tonka, oud, atau vanila bisa 8 sampai 12 jam. Angka pastinya tercantum di setiap halaman varian.",
  },
  {
    question: "Ukuran apa saja yang tersedia?",
    answer: "Setiap varian tersedia dalam botol 30 ml dan 50 ml.",
  },
  {
    question: "Bagaimana cara memesan?",
    answer:
      "Pilih ukuran di halaman varian, lalu tekan Beli via WhatsApp untuk memesan satu varian, atau masukkan ke keranjang dulu kalau mau beberapa sekaligus. Isi keranjang otomatis dirangkai jadi pesan WhatsApp saat checkout.",
  },
  {
    question: "Apakah bisa ditukar kalau aromanya tidak cocok?",
    answer:
      "Bisa, selama segel botol belum dibuka dan pengajuan dilakukan dalam 7 hari setelah barang diterima. Botol yang sudah dibuka tidak bisa ditukar karena alasan higienitas.",
  },
] as const;
