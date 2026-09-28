// SRS-008 — Budget Summary
// Programmer: Binar Ridha Wiritanaya
//
// TODO:
// 1. Ambil user yang sedang login dari session.
// 2. Ambil budget berdasarkan user, month, dan year.
// 3. Hitung total pengeluaran user pada bulan tersebut.
// 4. Hitung sisa budget:
//       sisa = budget - total pengeluaran
// 5. Jangan mengambil transaksi milik user lain.
// 6. Return data dalam format JSON.
// 7. Endpoint harus dapat dipanggil menggunakan AJAX/fetch.
// 8. Jika budget belum tersedia, berikan response yang sesuai.
// 9. Pastikan authorization berdasarkan user yang sedang login.