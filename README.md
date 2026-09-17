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

## Deploy ke Render

Backend ini siap di-deploy ke Render (free tier) tanpa perubahan kode.
Repo sudah menyertakan Blueprint `render.yaml` dan pin versi Node via `.node-version`.

### 1. Buat Web Service

Cara termudah (Blueprint, otomatis membaca `render.yaml`):

1. Login ke [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint Instance** → pilih repo ini → **Apply**.
2. Render akan otomatis memakai `buildCommand`, `startCommand`, dan `healthCheckPath` dari `render.yaml`.

Alternatif manual (**New → Web Service**), isi:

- **Runtime**: Node
- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `node server.js`
- **Health Check Path**: `/api/health`
- **Region**: Singapore

### 2. Environment Variables (wajib diisi manual di dashboard Render)

JANGAN menyimpan secret di `render.yaml`. Tambahkan di dashboard Render (**Environment**):

| Key | Value | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` | Supabase **direct/session**, port **5432** (lihat `.env.example`; password di-URL-encode). |
| `JWT_SECRET` | placeholder: `change_this_secret` | Ganti dengan secret kuat. |
| `VITE_API_URL` | placeholder: `http://localhost:3000` | Hanya untuk build frontend lokal; di Render tidak dipakai backend. |
| `PORT` | (tidak perlu) | Render menyuntikkan `PORT` otomatis; `server.js` memakai `process.env.PORT \|\| 3000`. |

Semua key yang ada di `.env.example` harus terpenuhi di dashboard Render.

### 3. Catatan Free Tier

- **Spin-down**: service free tidur setelah 15 menit tanpa trafik; cold start pertama **30–60 detik**.
- **Disk ephemeral**: file upload (mis. lampiran perizinan di `uploads/`) **hilang saat redeploy/restart**.
  Jangan simpan data penting di disk — langkah lanjutan: migrasi ke **Supabase Storage**.
- **Supabase free tier** dapat pause mingguan; aktifkan kembali dari dashboard Supabase bila API error koneksi.

### 4. Redirect Client Setelah Deploy

Setelah URL Render aktif (mis. `https://gopkl-api.onrender.com`):

1. **Vercel**: set `VITE_API_BASE` ke `https://gopkl-api.onrender.com/api` lalu **redeploy** frontend.
2. **Mobile (gopkl-student)**: update secret `VITE_API_BASE` ke `https://gopkl-api.onrender.com/api` lalu **build ulang APK**.
3. Hapus/tiap ganti tunnel ngrok yang lama.

## Default Accounts

The seed script creates one account for each role
(Student, Teacher, Mentor, Hubin, Super Admin).
See `prisma/seed.js` for the email addresses and passwords.

## Notes

- Permission attachments are stored in `uploads/permissions`.
- Map and geofencing features require an internet connection
  (map tiles and address search).