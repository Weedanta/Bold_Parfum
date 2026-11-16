/**
 * Template dirender ulang dengan key baru di tiap navigasi, berbeda dengan
 * layout yang menetap. Itu yang membuat animasi masuk halaman berjalan lagi
 * setiap kali pengunjung berpindah rute, tanpa satu baris JavaScript pun.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
