# test-srs009.ps1
# Skenario tes SRS-009: Monthly Budget & Budget Indicator (AJAX/fetch).
# Jalankan dulu: npm run seed   (biar akun binar@test.com + budget September 2026 ada)
# Lalu jalankan: powershell -ExecutionPolicy Bypass -File .\test-srs009.ps1
# (atau kalau execution policy sudah longgar, cukup: .\test-srs009.ps1)

$base = "http://localhost:3000"
$email = "binar@test.com"
$password = "password123"

function Show-Result($label, $expected, $actual) {
    $status = if ($actual -eq $expected) { "OK" } else { "GAGAL" }
    Write-Host "[$status] $label -> diharapkan $expected, dapat $actual"
}

Write-Host "=== 1. Akses budget endpoints TANPA login (HARUS ditolak / 401) ===" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$base/api/budgets/monthly?month=9&year=2026" -Method GET | Out-Null
    Show-Result "GET /api/budgets/monthly tanpa session" 401 200
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "GET /api/budgets/monthly tanpa session" 401 $code
}

try {
    Invoke-RestMethod -Uri "$base/api/budgets/indicator?month=9&year=2026" -Method GET | Out-Null
    Show-Result "GET /api/budgets/indicator tanpa session" 401 200
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "GET /api/budgets/indicator tanpa session" 401 $code
}

Write-Host "`n=== 2. Login sebagai $email ===" -ForegroundColor Cyan

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

Write-Host "`n=== 3. Bulan yang SUDAH ada budget-nya (September 2026) ===" -ForegroundColor Cyan

try {
    $monthly = Invoke-RestMethod -Uri "$base/api/budgets/monthly?month=9&year=2026" -Method GET -WebSession $session
    Show-Result "GET /api/budgets/monthly (Sep 2026)" 200 200
    Show-Result "hasBudget" $true $monthly.hasBudget
    Show-Result "amount (2.000.000)" 2000000 $monthly.amount
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "GET /api/budgets/monthly (Sep 2026)" 200 $code
}

try {
    $indicator = Invoke-RestMethod -Uri "$base/api/budgets/indicator?month=9&year=2026" -Method GET -WebSession $session
    Show-Result "GET /api/budgets/indicator (Sep 2026)" 200 200
    Show-Result "budget (2.000.000)" 2000000 $indicator.budget
    Show-Result "totalExpense (1.570.000)" 1570000 $indicator.totalExpense
    Show-Result "remaining (430.000)" 430000 $indicator.remaining
    Show-Result "percentage (78.5)" 78.5 $indicator.percentage
    Show-Result "status (waspada)" "waspada" $indicator.status
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "GET /api/budgets/indicator (Sep 2026)" 200 $code
}

Write-Host "`n=== 4. Bulan yang BELUM ada budget-nya (Oktober 2026) ===" -ForegroundColor Cyan

try {
    $monthlyEmpty = Invoke-RestMethod -Uri "$base/api/budgets/monthly?month=10&year=2026" -Method GET -WebSession $session
    Show-Result "GET /api/budgets/monthly (Okt 2026) tetap 200" 200 200
    Show-Result "hasBudget (Okt 2026)" $false $monthlyEmpty.hasBudget
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "GET /api/budgets/monthly (Okt 2026)" 200 $code
}

try {
    $indicatorEmpty = Invoke-RestMethod -Uri "$base/api/budgets/indicator?month=10&year=2026" -Method GET -WebSession $session
    Show-Result "status (Okt 2026, belum_diset)" "belum_diset" $indicatorEmpty.status
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "GET /api/budgets/indicator (Okt 2026)" 200 $code
}

Write-Host "`n=== 5. Validasi parameter month/year tidak valid (HARUS ditolak / 400) ===" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$base/api/budgets/indicator?month=13&year=2026" -Method GET -WebSession $session | Out-Null
    Show-Result "GET /api/budgets/indicator month=13 (invalid)" 400 200
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "GET /api/budgets/indicator month=13 (invalid)" 400 $code
}

Write-Host "`n=== 6. User lain TIDAK boleh lihat budget milik binar@test.com ===" -ForegroundColor Cyan

$emailOther = "otheruser_$(Get-Random)@test.com"

try {
    Invoke-RestMethod -Uri "$base/api/register" -Method POST -ContentType "application/json" `
        -Body (@{ name = "Other User"; email = $emailOther; password = "password123" } | ConvertTo-Json) | Out-Null

    Invoke-RestMethod -Uri "$base/api/login" -Method POST -ContentType "application/json" `
        -Body (@{ email = $emailOther; password = "password123" } | ConvertTo-Json) `
        -SessionVariable sessionOther | Out-Null

    $otherView = Invoke-RestMethod -Uri "$base/api/budgets/monthly?month=9&year=2026" -Method GET -WebSession $sessionOther
    Show-Result "User lain akses budget Sep 2026 -> hasBudget harus False" $false $otherView.hasBudget
} catch {
    Write-Host "Skenario user lain gagal dijalankan: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nSelesai. Screenshot output di atas (yang ada [OK]/[GAGAL]) buat bukti G-form SRS-009." -ForegroundColor Yellow
