# Expense Tracker

Aplikasi web untuk membantu mahasiswa mengelola keuangan pribadi secara sederhana. Aplikasi ini ditujukan bagi mahasiswa dengan gaya hidup konsumtif yang membutuhkan expense tracker untuk mencatat dan mengelola keuangan pribadi. Melalui aplikasi ini, pengguna dapat membuat akun, login, mencatat pemasukan dan pengeluaran, melihat riwayat transaksi, serta mengetahui kondisi keuangan melalui total pemasukan, total pengeluaran, dan saldo.

Setiap transaksi terhubung dengan pengguna yang sedang login sehingga pengguna hanya dapat mengakses dan mengelola transaksi miliknya sendiri. Aplikasi juga mempertahankan informasi login selama session masih berlaku dan menggunakan cookies untuk menyimpan informasi yang diperlukan.

Pengguna dapat menambahkan, melihat, mengubah, dan menghapus transaksi keuangan melalui halaman transaksi serta melihat ringkasan keuangan melalui dashboard.


## Daftar Isi

- [Fitur](#fitur)
- [Stack](#stack)
- [Kebutuhan Sistem](#kebutuhan-sistem)
- [Instalasi](#instalasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Database](#struktur-database)
- [Model & Relasi](#model--relasi)
- [Daftar SRS & Pembagian Tugas](#daftar-srs--pembagian-tugas)
- [Alur Kerja Git](#alur-kerja-git)
- [Peran Tim](#peran-tim)


## Fitur

- Registrasi pengguna dengan nama, email, dan password
- Login menggunakan email dan password
- Session untuk mempertahankan status login pengguna
- Cookies untuk menyimpan informasi session dan preferensi pengguna
- Dashboard yang menampilkan:
  - Nama pengguna
  - Total pemasukan
  - Total pengeluaran
  - Saldo
  - Transaksi terbaru
- Management transaksi
- CRUD transaksi:
  - Menambahkan transaksi
  - Melihat transaksi
  - Mengubah transaksi
  - Menghapus transaksi
- Jenis transaksi berupa pemasukan dan pengeluaran
- Filter transaksi berdasarkan jenis:
  - Semua
  - Pemasukan
  - Pengeluaran
- Authorization sehingga pengguna hanya dapat mengakses transaksi miliknya sendiri
- Logout untuk mengakhiri session pengguna
- Validasi input pada proses registrasi, login, dan transaksi


## Stack

| Komponen | Teknologi |
|---|---|
| Framework | Next.js |
| Bahasa | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |


## Kebutuhan Sistem

- Node.js
- PostgreSQL
- Git
- Visual Studio Code


## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/USERNAME/expense-tracker.git
cd expense-tracker
```

### 2. Install dependency

```bash
npm install
```

### 3. Siapkan database PostgreSQL

Buat database baru dengan nama:

```text
expense_tracker
```

Database dapat dibuat melalui PostgreSQL atau pgAdmin.

### 4. Siapkan file environment

Buat file `.env` di root project dan isi sesuai konfigurasi PostgreSQL lokal:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/expense_tracker"
```

Sesuaikan `USERNAME`, `PASSWORD`, dan port PostgreSQL dengan komputer masing-masing.

### 5. Jalankan migration

```bash
npx prisma migrate dev
```

Migration akan membuat tabel yang dibutuhkan aplikasi pada database lokal.


## Menjalankan Aplikasi

Jalankan:

```bash
npm run dev
```

Kemudian buka:

```text
http://localhost:3000
```

Alur penggunaan aplikasi:

```text
Login / Register
       ↓
   Dashboard
       ↓
  Transactions
       ↓
Tambah / Edit / Hapus / Filter transaksi
```


## Struktur Database

Database menggunakan PostgreSQL dan dikelola menggunakan Prisma.

Tabel utama:

| Tabel | Keterangan |
|---|---|
| `User` | Menyimpan data akun pengguna |
| `Session` | Menyimpan session login pengguna |
| `Transaction` | Menyimpan transaksi pemasukan dan pengeluaran pengguna |

### User

Menyimpan informasi pengguna yang melakukan registrasi.

Data utama:

- `id`
- `name`
- `email`
- `password`
- `createdAt`
- `updatedAt`

Password pengguna disimpan dalam bentuk hash.

### Session

Digunakan untuk mempertahankan status login pengguna.

Data utama:

- `id`
- `userId`
- `expiresAt`
- `createdAt`

Session terhubung dengan `User`.

### Transaction

Menyimpan data pemasukan dan pengeluaran pengguna.

Data utama:

- `id`
- `userId`
- `type`
- `amount`
- `description`
- `transactionDate`
- `createdAt`
- `updatedAt`

`userId` digunakan untuk menghubungkan transaksi dengan pengguna yang membuatnya.


## Model & Relasi

Relasi utama dalam database:

```text
User
 │
 ├──< Session
 │
 └──< Transaction
```

Artinya:

- Satu `User` dapat memiliki beberapa `Session`.
- Satu `User` dapat memiliki banyak `Transaction`.
- Setiap `Transaction` hanya dimiliki oleh satu `User`.

Data transaksi tidak boleh diakses oleh pengguna lain.


## Daftar SRS & Pembagian Tugas

| Kode | Deskripsi | Acceptance Criteria | PIC |
|---|---|---|---|
| SRS001 | Autentikasi user | Registrasi dengan nama, email, password; login menggunakan email dan password; password ter-hash | Qilla |
| SRS002 | Session, Cookie & Logout | Session dibuat setelah login; halaman internal diproteksi autentikasi; cookie `sessionId` digunakan; logout mengakhiri session | Qilla |
| SRS003 | CRUD transaksi | Pengguna dapat membuat, melihat, mengedit, dan menghapus transaksi miliknya | Varissa |
| SRS004 | Filter transaksi | Pengguna dapat memfilter transaksi berdasarkan pemasukan atau pengeluaran | Varissa |
| SRS005 | Dashboard | Dashboard menampilkan nama, total pemasukan, total pengeluaran, saldo, dan transaksi terbaru | Annis |
| SRS006 | Authorization & Security Testing | Pengguna hanya dapat mengakses transaksi miliknya; request tanpa autentikasi ditolak; akses ke transaksi milik user lain ditolak | Annis |


## Alur Kerja Git

### Programmer

Setiap programmer bekerja pada branch masing-masing.

```bash
git checkout main
git pull origin main
git checkout -b feature/nama-fitur
```

Setelah selesai:

```bash
git add .
git commit -m "feat(scope): deskripsi perubahan"
git push origin feature/nama-fitur
```

Kemudian buat Pull Request menuju branch `main`.

### Contoh Branch

```text
feature/srs-001-register-login-cookie
feature/srs-002-session-cookie-logout
feature/srs-003-crud-transaksi
feature/srs-004-filter-transaksi
feature/srs-005
feature/srs-006
```

Nama branch dapat menggunakan variasi `feature/`, `fix/`, atau nama branch yang sudah digunakan selama tetap jelas.


## PM — Merge

PM bertugas mengecek Pull Request dan menggabungkan branch programmer ke `main`.

Alur:

```text
Programmer
    ↓
Feature Branch
    ↓
Push
    ↓
Pull Request
    ↓
PM Review
    ↓
Resolve Conflict jika ada
    ↓
Merge ke main
```


## Peran Tim

| Nama | Peran | SRS |
|---|---|---|
| Binar Ridha Wiritanaya | Setup project, migration, model, merge | — |
| Shafa Aqilla Zahira | Programmer | SRS001, SRS002 |
| Varissa Nabila Kifli | Programmer | SRS003, SRS004 |
| Annis Fakhiroh Akbar | Programmer | SRS005, SRS006 |

