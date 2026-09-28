# test-srs005.ps1
# Skenario tes SRS-005: dashboard (AJAX/fetch) menampilkan ringkasan keuangan
# milik user yang sedang login, dan menolak akses tanpa login.
# Jalankan dulu: npm run seed   (biar akun binar@test.com + transaksinya ada)
# Lalu jalankan: powershell -ExecutionPolicy Bypass -File .\test-srs005.ps1
# (atau kalau execution policy sudah longgar, cukup: .\test-srs005.ps1)

$base = "http://localhost:3000"
$email = "binar@test.com"
$password = "password123"

function Show-Result($label, $expected, $actual) {
    $status = if ($actual -eq $expected) { "OK" } else { "GAGAL" }
    Write-Host "[$status] $label -> diharapkan $expected, dapat $actual"
}

Write-Host "=== 1. Akses /api/dashboard TANPA login (HARUS ditolak / 401) ===" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$base/api/dashboard" -Method GET | Out-Null
    Show-Result "GET /api/dashboard tanpa session" 401 200
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "GET /api/dashboard tanpa session" 401 $code
}

Write-Host "`n=== 2. Login sebagai $email (cookie session disimpan otomatis) ===" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$base/api/login" -Method POST -ContentType "application/json" `
        -Body (@{ email = $email; password = $password } | ConvertTo-Json) `
        -SessionVariable session | Out-Null
    Write-Host "Login berhasil, session tersimpan."
} catch {
    Write-Host "Login GAGAL: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Pastikan sudah jalankan 'npm run seed' dan server 'npm run dev' aktif." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== 3. GET /api/dashboard SETELAH login (HARUS berhasil / 200, data sesuai seed) ===" -ForegroundColor Cyan

try {
    $dashboard = Invoke-RestMethod -Uri "$base/api/dashboard" -Method GET -WebSession $session
    Show-Result "GET /api/dashboard dengan session" 200 200

    Show-Result "Nama user" "Binar" $dashboard.name
    Show-Result "Total pemasukan (4.000.000)" 4000000 $dashboard.totalIncome
    Show-Result "Total pengeluaran (1.570.000)" 1570000 $dashboard.totalExpense
    Show-Result "Saldo (2.430.000)" 2430000 $dashboard.balance
    Show-Result "Jumlah transaksi terbaru (maks 5)" 5 $dashboard.recentTransactions.Count
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "GET /api/dashboard dengan session" 200 $code
}

Write-Host "`nSelesai. Screenshot output di atas (yang ada [OK]/[GAGAL]) buat bukti G-form SRS-005." -ForegroundColor Yellow
