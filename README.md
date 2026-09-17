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
│  API serverless (/api/*)    │──────▶ │  - port 6543 (pooler, prod)  │
│  Express app = api/index.js │        │  - port 5432 (session, dev)  │
│                             │        │                              │
│  Upload multipart ──────────┼──────▶ │  Storage bucket "uploads"    │
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
- A Supabase project (PostgreSQL + Storage)

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
# Local dev: session/direct connection (port 5432) — wajib untuk prisma migrate
DATABASE_URL="postgresql://postgres.REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="replace-with-a-strong-secret"
SUPABASE_URL="https://REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="service-role-secret-key"
```

4. Generate the Prisma client, apply migrations, create the Storage bucket, and seed.

```bash
npx prisma generate
npx prisma migrate dev
# Bucket "uploads" + RLS policies (idempotent):
npx prisma db execute --file prisma/sql/storage_bucket.sql --schema prisma/schema.prisma
node prisma/seed.js
```

5. Run the backend and frontend in two separate terminals.

```bash
# Terminal 1 (API) — hanya listen saat dijalankan langsung
node server.js

# Terminal 2 (web)
npm run dev:frontend
```

6. Open http://localhost:5173 in your browser.

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
