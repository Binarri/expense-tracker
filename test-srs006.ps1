# test-srs006.ps1
# Skenario tes SRS-006: pastikan User B TIDAK bisa akses transaksi milik User A.
# Jalankan: powershell -ExecutionPolicy Bypass -File .\test-srs006.ps1
# (atau kalau execution policy sudah longgar, cukup: .\test-srs006.ps1)

$base = "http://localhost:3000"

function Show-Result($label, $expected, $actual) {
    $status = if ($actual -eq $expected) { "OK" } else { "GAGAL" }
    Write-Host "[$status] $label -> diharapkan $expected, dapat $actual"
}

Write-Host "=== 1. Register User A & User B ===" -ForegroundColor Cyan

$emailA = "usera_$(Get-Random)@test.com"
$emailB = "userb_$(Get-Random)@test.com"

try {
    Invoke-RestMethod -Uri "$base/api/register" -Method POST -ContentType "application/json" `
        -Body (@{ name = "User A"; email = $emailA; password = "password123" } | ConvertTo-Json) | Out-Null
    Write-Host "User A terdaftar: $emailA"
} catch { Write-Host "Register User A gagal: $($_.Exception.Message)" -ForegroundColor Red }

try {
    Invoke-RestMethod -Uri "$base/api/register" -Method POST -ContentType "application/json" `
        -Body (@{ name = "User B"; email = $emailB; password = "password123" } | ConvertTo-Json) | Out-Null
    Write-Host "User B terdaftar: $emailB"
} catch { Write-Host "Register User B gagal: $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== 2. Login sebagai User A & User B (cookie session disimpan otomatis) ===" -ForegroundColor Cyan

Invoke-RestMethod -Uri "$base/api/login" -Method POST -ContentType "application/json" `
    -Body (@{ email = $emailA; password = "password123" } | ConvertTo-Json) `
    -SessionVariable sessionA | Out-Null
Write-Host "Login User A berhasil, session A tersimpan."

Invoke-RestMethod -Uri "$base/api/login" -Method POST -ContentType "application/json" `
    -Body (@{ email = $emailB; password = "password123" } | ConvertTo-Json) `
    -SessionVariable sessionB | Out-Null
Write-Host "Login User B berhasil, session B tersimpan."

Write-Host "`n=== 3. User A membuat satu transaksi ===" -ForegroundColor Cyan

$tx = Invoke-RestMethod -Uri "$base/api/transactions" -Method POST -ContentType "application/json" `
    -WebSession $sessionA `
    -Body (@{ type = "expense"; amount = 25000; description = "Punya User A"; transactionDate = "2026-09-23" } | ConvertTo-Json)

$txId = $tx.id
if (-not $txId) { $txId = $tx.data.id }
Write-Host "Transaksi dibuat dengan id: $txId"

Write-Host "`n=== 4. User B mencoba akses transaksi milik User A (HARUS ditolak / 403) ===" -ForegroundColor Cyan

function Try-Request($label, $method, $url, $session, $body = $null) {
    try {
        if ($body) {
            Invoke-RestMethod -Uri $url -Method $method -ContentType "application/json" -WebSession $session -Body ($body | ConvertTo-Json) | Out-Null
        } else {
            Invoke-RestMethod -Uri $url -Method $method -WebSession $session | Out-Null
        }
        Show-Result $label 403 200   # kalau nggak ada exception, berarti malah berhasil (200) -> ini SALAH
    } catch {
        $code = [int]$_.Exception.Response.StatusCode
        Show-Result $label 403 $code
    }
}

Try-Request "User B GET transaksi User A"    "GET"    "$base/api/transactions/$txId" $sessionB
Try-Request "User B UPDATE transaksi User A" "PUT"    "$base/api/transactions/$txId" $sessionB @{ amount = 999999 }
Try-Request "User B DELETE transaksi User A" "DELETE" "$base/api/transactions/$txId" $sessionB

Write-Host "`n=== 5. User A akses transaksinya sendiri (HARUS berhasil / 200) ===" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$base/api/transactions/$txId" -Method GET -WebSession $sessionA | Out-Null
    Show-Result "User A GET transaksi miliknya sendiri" 200 200
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "User A GET transaksi miliknya sendiri" 200 $code
}

Write-Host "`n=== 6. Tanpa login sama sekali (HARUS ditolak / 401) ===" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$base/api/transactions/$txId" -Method GET | Out-Null
    Show-Result "Akses tanpa session" 401 200
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    Show-Result "Akses tanpa session" 401 $code
}

Write-Host "`nSelesai. Screenshot output di atas (yang ada [OK]/[GAGAL]) buat bukti G-form SRS-006." -ForegroundColor Yellow
