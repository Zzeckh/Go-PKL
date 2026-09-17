# Go-PKL

Go-PKL is a full-stack portal for managing student internships (PKL).
It supports five roles: Student, Teacher, Mentor, Hubin, and Super Admin,
with GPS-based attendance, logbook verification, permission requests,
company mapping with geofencing, and final grading.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Leaflet
- Backend: Node.js, Express, JWT
- Database: SQL via Prisma ORM

## Prerequisites

- Node.js 18 or newer
- npm or pnpm
- A Supabase project (PostgreSQL). The `DATABASE_URL` in `.env` must point to
  Supabase (session/direct connection, port 5432) as documented in `.env.example`.

> Note: local MySQL via `docker-compose.yml` (and Laragon/XAMPP) is optional and
> effectively retired — the backend now targets Supabase PostgreSQL.

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

3. Point the backend at your Supabase database (see `.env.example` for the
   two supported URL forms). Local MySQL via `docker compose up -d` is no
   longer required.

4. Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://postgres.REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="replace-with-a-strong-secret"
PORT=3000
```

5. Generate the Prisma client, apply migrations, and load the seed data.

```bash
npx prisma generate
npx prisma migrate dev
node prisma/seed.js
```

6. Run the backend and frontend in two separate terminals.

```bash
# Terminal 1 (backend)
node server.js

# Terminal 2 (frontend)
npm run dev
```

7. Open http://localhost:5173 in your browser.

## Deploy ke Koyeb

Backend ini siap di-deploy ke [Koyeb](https://www.koyeb.com) (free tier, tanpa kartu kredit) tanpa perubahan kode.
Repo sudah menyertakan `Procfile` (`web: node server.js`) dan pin versi Node via `.node-version`.

### 1. Daftar & Hubungkan GitHub

1. Daftar di [app.koyeb.com](https://app.koyeb.com) dengan akun **GitHub** (free tier, tanpa kartu kredit).
2. Install **Koyeb GitHub App** dan beri akses pada repo `Go-PKL`.

### 2. Buat Web Service

1. Dashboard Koyeb → **Create → Web Service** → pilih repo `Go-PKL`, branch `main`.
2. Konfigurasi build:

   - **Builder**: Buildpack (Nixpacks)
   - **Build command**: `npm install && npx prisma generate`
   - **Run command**: `node server.js` (atau biarkan Koyeb memakai `Procfile`)
   - **Instance**: Free (nano)
   - **Region**: Singapore bila tersedia, jika tidak pilih yang terdekat

3. Koyeb otomatis menyuntikkan `PORT` — **jangan pernah set `PORT` manual**; `server.js` memakai `process.env.PORT || 3000`.

### 3. Environment Variables (wajib diisi di dashboard Koyeb)

JANGAN menyimpan secret di dalam repo. Tambahkan di **Services → Settings → Environment Variables**, salin dari `.env` lokal:

| Key | Value | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` | Supabase **direct/session**, port **5432** (lihat `.env.example`; password di-URL-encode). |
| `JWT_SECRET` | placeholder: `change_this_secret` | Ganti dengan secret kuat dari `.env` lokal. |
| `PORT` | (jangan diisi) | Otomatis dari Koyeb; mengisi manual dapat membuat service gagal bind. |

### 4. Verifikasi

Buka `https://<app-slug>.koyeb.app/api/health` — harus mengembalikan JSON `200`:

```json
{"status":"ok","app":"Go-PKL API"}
```

### 5. Redirect Client Setelah Deploy

Setelah URL Koyeb aktif (mis. `https://<app-slug>.koyeb.app`):

1. **Vercel**: set env `VITE_API_BASE` ke `https://<app-slug>.koyeb.app/api` lalu **redeploy** frontend.
2. **Mobile (gopkl-student)**: update secret repo `VITE_API_BASE` ke `https://<app-slug>.koyeb.app/api` lalu **build ulang APK**.
3. Hapus/ganti tunnel ngrok yang lama.

### 6. Catatan Free Tier

- **Disk ephemeral**: file upload (mis. lampiran perizinan di `uploads/`) **hilang saat redeploy/restart**.
  Jangan simpan data penting di disk — langkah lanjutan: migrasi ke **Supabase Storage**.
- **Supabase free tier** dapat pause mingguan; aktifkan kembali dari dashboard Supabase bila API error koneksi.
- Instance free Koyeb memiliki limit resource (nano); pantau usage di dashboard bila API terasa lambat.

## Default Accounts

## Default Accounts

The seed script creates one account for each role
(Student, Teacher, Mentor, Hubin, Super Admin).
See `prisma/seed.js` for the email addresses and passwords.

## Notes

- Permission attachments are stored in `uploads/permissions`.
- Map and geofencing features require an internet connection
  (map tiles and address search).