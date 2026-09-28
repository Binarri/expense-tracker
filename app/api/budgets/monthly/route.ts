// SRS-009 — Monthly Budget
// Programmer: Annis Fakhiroh Akbar
//
// TODO:
// 1. Ambil user yang sedang login dari session.
// 2. Terima parameter month dan year dari request.
// 3. Cari budget berdasarkan:
//       userId
//       month
//       year
// 4. Return budget bulan yang dipilih dalam format JSON.
// 5. Jika budget tidak ditemukan, berikan response yang sesuai.
// 6. Endpoint harus dapat dipanggil menggunakan AJAX/fetch.
// 7. Pastikan user tidak dapat mengakses budget user lain.
// 8. Fitur harus dapat digunakan untuk berpindah antar bulan
//    tanpa reload halaman.