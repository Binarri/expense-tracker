// SRS-007 — Set Budget
// Programmer: Shafa Aqilla Zahira
//
// TODO:
// 1. Ambil user yang sedang login dari session.
// 2. Buat endpoint untuk membuat/menetapkan budget bulanan.
// 3. Jika budget untuk user + bulan + tahun tersebut sudah ada,
//    lakukan update terhadap budget tersebut.
// 4. Jangan menerima userId dari request sebagai sumber kepemilikan.
// 5. userId harus berasal dari session.
// 6. Validasi amount, month, dan year.
// 7. Gunakan Prisma untuk menyimpan budget.
// 8. Return response dalam format JSON.
// 9. Endpoint harus dapat dipanggil menggunakan AJAX/fetch.
// 10. Pastikan user hanya dapat mengelola budget miliknya sendiri.