# Go-PKL

Repository: https://github.com/Zzeckh/Go-PKL

Panduan singkat untuk menjalankan proyek ini secara lokal (untuk pengguna Laragon / XAMPP).

## Prasyarat

- Node.js 18+ (pengembang menggunakan Node 26)
- npm (atau pnpm jika Anda prefer)
- MySQL lokal (dijalankan via Laragon, XAMPP, atau layanan MySQL lain di mesin lokal)

> Catatan: pengguna Windows biasanya memakai Laragon atau XAMPP — instruksi di bawah menyesuaikan pengaturan MySQL lokal, bukan Docker.

## Langkah cepat untuk menjalankan (baru clone)

1. Clone repo:

```bash
git clone https://github.com/Zzeckh/Go-PKL.git
cd Go-PKL
```

2. Salin file environment dan sesuaikan `DATABASE_URL`:

```bash
cp .env.example .env
# Contoh DATABASE_URL untuk Laragon / XAMPP (root tanpa password):
# DATABASE_URL="mysql://root:@127.0.0.1:3306/ujikom_go_pkl"
# Jika MySQL Anda punya password, gunakan: mysql://root:yourpassword@127.0.0.1:3306/ujikom_go_pkl
```

3. Pastikan database dibuat (pakai phpMyAdmin atau CLI):

```bash
# Jika MySQL tanpa password (typical Laragon/XAMPP):
mysql -u root -e "CREATE DATABASE IF NOT EXISTS ujikom_go_pkl;"

# Jika MySQL memakai password:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ujikom_go_pkl;"
```

4. Install dependensi:

```bash
npm install
```

5. Terapkan schema Prisma ke database dan generate client:

```bash
npx prisma db push --accept-data-loss
npx prisma generate
```

6. Seed database (sample data):

```bash
npm run seed           # menjalankan prisma/seed.js (users, absensi, logbook)
node prisma/seed_static.js   # data perusahaan, perizinan, lokasi peta
```

7. Jalankan development (backend + frontend secara bersamaan):

```bash
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:8443
```

## Perintah penting lain

- Menjalankan hanya backend:

```bash
npm start
```

- Menjalankan hanya frontend (Vite):

```bash
npm run dev:frontend
```

- Cek TypeScript tanpa build:

```bash
npx tsc --noEmit
```

- Build produksi & preview frontend:

```bash
npm run build
npm run preview
```

## Struktur singkat (file penting)

- `server.js` — entry point Express backend
- `prisma/schema.prisma` — definisi model database
- `prisma/seed.js` dan `prisma/seed_static.js` — script seed sample data
- `src/context/AppContext.tsx` — frontend: data fetched dari `http://localhost:5000/api/*`

Lihat juga: [prisma/schema.prisma](prisma/schema.prisma#L1) dan [server.js](server.js#L1).

## Troubleshooting singkat

- Jika `EADDRINUSE` (port in use): hentikan proses yang memakai port 5000 atau 8443, lalu ulangi `npm run dev`:

```bash
ss -ltnp | grep ':5000\|:8443'
kill <PID>
```

- Jika Prisma tidak menemukan DB: periksa `DATABASE_URL` di `.env` dan pastikan MySQL berjalan (Laragon/XAMPP control panel atau phpMyAdmin).

- Jika seed gagal karena model baru, jalankan ulang `npx prisma db push` lalu `node prisma/seed_static.js`.

## Check sebelum push ke GitHub

1. Pastikan `.env` tidak ikut ter-commit (file ini seharusnya ada di `.gitignore`).
2. Jalankan test build lokal dan pastikan `npm run dev` berjalan.
3. Commit & push:

```bash
git add .
git commit -m "chore: add README and run instructions"
git push origin main
```

If you want, I can also add a `docker-compose.yml` or a `scripts/start-mysql.sh` for convenience, but this README assumes Laragon/XAMPP users will manage MySQL locally.
