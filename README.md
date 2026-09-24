# Go-PKL

Go-PKL is a full-stack portal for managing student internships (PKL).
It supports five roles: Student, Teacher, Mentor, Hubin, and Super Admin,
with GPS-based attendance, logbook verification, permission requests,
company mapping with geofencing, and final grading.

## Arsitektur Dua Layanan

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│           VERCEL            │        │          SUPABASE            │
│  Web statis (Vite build)    │  SQL   │  PostgreSQL (Prisma ORM)     │
│  API serverless (/api/*)    │──────▶│  - port 6543 (pooler, prod)  │
│  Express app = api/index.js │        │  - port 5432 (session, dev)  │
│                             │        │                              │
│  Upload multipart ──────────┼──────▶│  Storage bucket "uploads"    │
└─────────────────────────────┘ upload └──────────────────────────────┘
```

Hanya ada **dua layanan** — tidak ada backend host lain (tanpa Koyeb/Render/ngrok):

- **Vercel**: satu project melayani frontend statis DAN seluruh Express API
  sebagai serverless function (`api/index.js`, di-rewrite dari `/api/*`).
- **Supabase**: database PostgreSQL + file storage (lampiran perizinan).
  Semua file di-upload ke bucket publik `uploads`, URL publik penuh yang
  disimpan di database — disk serverless tidak dipakai (ephemeral).

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Leaflet
- Backend: Node.js, Express, JWT (dijalankan sebagai Vercel function)
- Database: PostgreSQL via Prisma ORM (Supabase)
- Storage: Supabase Storage (bucket `uploads`)

## Prerequisites

- Node.js 20 or newer
- npm or pnpm
- Docker (untuk local dev: PostgreSQL + Adminer via `docker compose`)
- A Supabase project (PostgreSQL + Storage) — hanya untuk produksi/deploy

## Installation

1. Clone the repository and enter the project folder.

```bash
git clone <repository-url>
cd gopkl
```

2. Install dependencies.

```bash
npm install
# or: pnpm install
```

3. Create a `.env` file in the project root (see `.env.example`).

```env
# Local dev: PostgreSQL LOKAL via Docker (engine sama dengan Supabase)
DATABASE_URL="postgresql://sail:password@localhost:5432/ujikom_go_pkl"
JWT_SECRET="replace-with-a-strong-secret"
SUPABASE_URL="https://REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="service-role-secret-key"
```

4. Start the local PostgreSQL + Adminer with Docker Compose (opsional
   untuk Supabase — local dev memakai Postgres lokal, production tetap Supabase).

```bash
docker compose up -d
# Adminer: http://localhost:8080  → System: PostgreSQL, Server: postgres,
#           Username: sail, Password: password, Database: ujikom_go_pkl
```

5. Generate the Prisma client, apply migrations, create the Storage bucket, and seed.

```bash
npx prisma generate
npx prisma migrate deploy   # atau npx prisma migrate dev
# Bucket "uploads" + RLS policies (idempotent) — hanya untuk Supabase:
npx prisma db execute --file prisma/sql/storage_bucket.sql --schema prisma/schema.prisma
node prisma/seed.js
```

6. Run the backend and frontend in two separate terminals.

```bash
# Terminal 1 (API) — hanya listen saat dijalankan langsung
node server.js

# Terminal 2 (web)
npm run dev:frontend
```

7. Open http://localhost:5173 in your browser.

### Cara Menjalankan — Ringkas (local dev)

> Backend: `node server.js` listen di :3000 · Frontend: Vite di :5173 ·
> `npm run dev` menjalankan keduanya sekaligus (concurrently + nodemon).
> Frontend memanggil API di `http://localhost:3000` (dari `VITE_API_URL`,
> bukan proxy Vite).

```bash
# 1) Nyalakan database lokal (PostgreSQL + Adminer) — Docker
docker compose up -d

# 2) Pertama kali / reset data: drop → migrate → seed (idempotent, aman diulang)
npm run db:reset

# 3) Run backend + frontend sekaligus
npm run dev
#     → Backend : http://localhost:3000   (auto-reload lewat nodemon)
#     → Frontend: http://localhost:5173

# Alternatif: pisah-pisah
#   Terminal A: node server.js            (backend saja)
#   Terminal B: npm run dev:frontend      (vite saja)

# Adminer (lihat isi DB): http://localhost:8080
#   System: PostgreSQL · Server: postgres · User: sail · Pass: password · DB: ujikom_go_pkl
```

> **Jika port 3000 sudah terpakai** oleh proses lama, matikan dulu:
> `pkill -f "node server.js"` (atau `lsof -i :3000`) lalu jalankan `npm run dev` lagi.

### Reset Data Database

```bash
npm run db:reset
```

Skrip ini menjalankan `prisma migrate reset --force --skip-seed` lalu
`node prisma/seed.js` — menghapus seluruh data, menerapkan ulang semua
migration Prisma, dan mengisi ulang data dummy (49 user + 6 perusahaan +
1 kelas, password semua akun `gopkl123`). Cocok dipakai kapan pun ingin
kembali ke kondisi awal.

### Melihat Database lewat IDE (Database Client)

> ⚠️ **Project ini memakai PostgreSQL** (Prisma `provider = "postgresql"`),
> bukan MySQL! Jangan pilih driver MySQL saat menghubungkan database client —
> pilih **PostgreSQL**. (Repositori ini pernah berisi MySQL di
> `docker-compose.yml`, tapi sudah diganti PostgreSQL agar sama dengan Supabase:
> `prisma/migrations_mysql_backup/` hanyalah arsip lama.)

Sebelum connect, pastikan database lokal hidup:

```bash
docker compose up -d
```

Lalu isi form **Database Client** (extension IDE, mis. *Database Client*,
*SQLTools*, *DataGrip*, dll.) dengan nilai berikut:

| Field | Nilai |
| --- | --- |
| Driver / Type | **PostgreSQL** (bukan MySQL) |
| Host / Server | `localhost` |
| Port | `5432` |
| Username | `sail` |
| Password | `password` |
| Database | `ujikom_go_pkl` |
| SSL / TLS | `Disabled` / `prefer` |

Connection string (kalau extension menerima URL):

```text
postgresql://sail:password@localhost:5432/ujikom_go_pkl
```

Tabel yang akan terlihat setelah terhubung:

| Tabel | Isi |
| --- | --- |
| `User` | 49 user (superadmin, hubin, 6 guru, 6 mentor, 35 siswa) |
| `Company` | 6 perusahaan PKL |
| `Class` | 1 kelas |
| `Absensi`, `Logbook`, `Permission`, `Evaluation` | kosong (belum ada aktivitas PKL) |
| `_prisma_migrations` | riwayat migration Prisma |

> Kalau **Test Connection gagal**: cek driver masih MySQL, pastikan
> `docker compose up -d` sudah jalan (`docker ps`), atau reset ulang DB
> dengan `npm run db:reset`.

#### Buat yang biasa pakai phpMyAdmin (Laragon)

> ⚠️ **phpMyAdmin TIDAK bisa dipakai untuk database ini.** phpMyAdmin hanya
> mendukung MySQL — project ini PostgreSQL, jadi phpMyAdmin tidak akan pernah
> connect. Gantinya pakai **Adminer**, web UI database yang tampilan &
> cara pakainya mirip phpMyAdmin dan sudah masuk `docker-compose.yml`.

Cara pakai Adminer (ganti phpMyAdmin):

```bash
# 1) Pastikan adminer + postgres jalan
docker compose up -d

# 2) Buka di browser
#    http://localhost:8080
```

Lalu isi form login Adminer:

| Field | Isi |
| --- | --- |
| System | **PostgreSQL** (dropdown di pojok kiri atas) |
| Server | `postgres` |
| Username | `sail` |
| Password | `password` |
| Database | `ujikom_go_pkl` |

Lebih lanjut (PostgreSQL vs MySQL, kenapa bukan phpMyAdmin) ada di bagian
atas README — intinya satu: **pilih PostgreSQL, bukan MySQL.**

#### Kalau Tidak Pakai Docker (untuk anggota kelompok)

> ⚠️ `docker compose up -d` **hanya jalan kalau Docker terpasang** di mesin
> tersebut (Docker Desktop / docker engine). Tanpa Docker, perintah itu error
> (`docker: command not found` atau `Cannot connect to the Docker daemon`).
> Berikut dua cara tanpa Docker:

**Opsi 1 — Pakai database Supabase bersama (PALING GAMPANG, nol setup)**

Semua anggota memakai database yang sama persis dengan produksi. Tidak perlu
install PostgreSQL/Docker apa pun — tinggal uncomment URL Supabase di `.env`:

```env
DATABASE_URL="postgresql://postgres.ggxmeagaccegdatkrylp:qwerty3306%3F%21jo@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

Lalu jalankan sekali (untuk memastikan schema + data dummy tersedia):

```bash
npx prisma migrate deploy
node prisma/seed.js
npm run dev
```

Cara lihat datanya: **Supabase Dashboard → SQL Editor** (browser, tanpa install)
atau connect lewat Database Client IDE memakai host
`aws-0-ap-southeast-1.pooler.supabase.com` port `5432`, user
`postgres.ggxmeagaccegdatkrylp`, password `qwerty3306?!jo`, database `postgres`.

> ⚠️ Karena semua anggota share 1 database, `npm run db:reset` dari salah satu
> anggota akan menghapus data anggota lain. Untuk data dummy tidak masalah,
> tapi jangan jalankan `db:reset` sembarangan saat semua sedang aktif kerja.

**Opsi 2 — PostgreSQL via Laragon (untuk yang sudah terbiasa Laragon)**

Laragon tidak hanya untuk MySQL — ia juga bisa menjalankan **PostgreSQL**
(menu Laragon → buka panel, aktifkan service **PostgreSQL**, bukan MySQL).
Lalu:

1. Start PostgreSQL dari Laragon (port default `5432`).
2. Buat database `ujikom_go_pkl`, atau buat user/role sesuai yang dipakai.
3. Sesuaikan `DATABASE_URL` di `.env` dengan kredensial Postgres di Laragon.

   ```env
   DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/ujikom_go_pkl"
   ```

4. Migration + seed + run:

   ```bash
   npx prisma migrate deploy
   node prisma/seed.js
   npm run dev
   ```

5. Lihat database pakai **Adminer bawaan Laragon** (menu Laragon → Tools →
   **Adminer**) — mendukung PostgreSQL, login `System: PostgreSQL`.

> Sebelum migration, pastikan user Postgres di Laragon punya hak akses ke
> database `ujikom_go_pkl` (`GRANT ALL PRIVILEGES` / meng-`OWNER`-kan), karena
> Prisma perlu membuat/mengubah tabel.

Intinya: **Docker hanya salah satu cara** untuk dapat PostgreSQL lokal. Yang
penting untuk project ini selalu `PostgreSQL` — lewat Supabase, Docker,
atau Laragon, semuanya valid selama `DATABASE_URL` benar.

## Deploy ke Vercel

### 1. Import Project

1. Push repo ini ke GitHub, lalu di [vercel.com](https://vercel.com) → **Add New → Project** → pilih repo.
2. Framework preset terdeteksi otomatis (Vite). Build command `npm run build`,
   output `dist` — biarkan default.
3. Set env variables di **Settings → Environment Variables** (lihat tabel di bawah).

### 2. Environment Variables (Vercel)

JANGAN menyimpan secret di dalam repo. Semua secret di-set di dashboard Vercel:

| Key | Value | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` | Supabase **TRANSACTION pooler**, port **6543** + `pgbouncer=true`. WAJIB untuk serverless — tanpa pooler koneksi Postgres habis. |
| `JWT_SECRET` | placeholder: `change_this_secret` | Samakan dengan nilai yang dipakai mobile app agar token tetap valid. |
| `SUPABASE_URL` | `https://[REF].supabase.co` | Project URL dari Supabase Dashboard → Settings → API. |
| `SUPABASE_SERVICE_ROLE_KEY` | placeholder: `[SERVICE_ROLE_SECRET_KEY]` | service_role SECRET key — server-side only, JANGAN expose ke client. |

> Catatan: TIDAK perlu `VITE_API_URL`/`VITE_API_BASE` di Vercel. Web production
> otomatis memakai same-origin `/api`. Jangan set env apa pun yang berawalan
> `VITE_API` di Vercel — fallback bawaan `src/utils/api.ts` sudah benar.

> Migrasi database tetap dijalankan dari lokal memakai URL 5432 (session);
> URL 6543 (transaction pooler) hanya untuk runtime Vercel.

### 3. Storage Bucket

Jalankan sekali per project Supabase (idempotent, aman diulang):

```bash
npx prisma db execute --file prisma/sql/storage_bucket.sql --schema prisma/schema.prisma
```

Atau tempel isi `prisma/sql/storage_bucket.sql` di Supabase Dashboard → SQL Editor.
Verifikasi: Dashboard → Storage → bucket `uploads` bersifat **public**.

### 4. Verifikasi

Buka `https://<vercel-domain>/api/health` — harus mengembalikan JSON `200`:

```json
{"status":"ok","app":"Go-PKL API"}
```

### 5. Redirect Client Setelah Deploy

Setelah URL Vercel aktif (mis. `https://<vercel-domain>`):

1. **Web**: tidak perlu apa pun — same-origin `/api` sudah dipakai otomatis.
2. **Mobile (gopkl-student)**: update secret repo `VITE_API_BASE` ke
   `https://<vercel-domain>/api` lalu **build ulang APK**. (Nilai `VITE_API_BASE`
   adalah secret berisi URL penuh.)

### 6. Catatan Free Tier

- **Vercel Hobby**: max durasi function ~10s (default) — cukup untuk semua
  route kecuali kemungkinan export PDF besar (`/api/reports/...`). Cold start
  beberapa ratus ms sampai ~1s pada invocation pertama setelah idle.
- **Supabase free tier**: project dapat **pause otomatis setelah ~1 minggu
  tidak aktif**; aktifkan kembali dari dashboard Supabase bila API error
  koneksi. Bandwidth/egress storage terbatas.
- Serverless = disk ephemeral: **jangan** pernah menulis file ke disk; semua
  upload wajib ke Supabase Storage (sudah diterapkan).

## Default Accounts

The seed script creates one account for each role
(Student, Teacher, Mentor, Hubin, Super Admin).
See `prisma/seed.js` for the email addresses and passwords.

## Notes

- Permission attachments are stored in **Supabase Storage** (bucket `uploads`,
  path `permissions/<timestamp>-<filename>`); the database stores the full
  public URL. Legacy rows with `/uploads/...` paths are deprecated test data —
  re-seed or re-upload; the old disk route no longer exists.
- Map and geofencing features require an internet connection
  (map tiles and address search).
