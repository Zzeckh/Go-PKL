# figma-make-app

Panduan singkat untuk kontribusi dan menjalankan proyek ini secara lokal.

## Prasyarat

 - Node.js 18+ (direkomendasikan Node 26 yang digunakan pengembang)
 - npm (tersedia bersama Node) atau pnpm jika Anda pilih
 - Docker & Docker Compose (untuk MySQL lokal)

## Langkah cepat untuk menjalankan (baru clone)

1. Clone repo:

```bash
git clone <repo-url>
cd gopkl
```

2. Salin file environment dan sesuaikan `DATABASE_URL` (MySQL lokal):

```bash
cp .env.example .env
# Edit .env -> pastikan DATABASE_URL mengarah ke MySQL lokal (contoh: mysql://user:pass@localhost:3306/ujikom_go_pkl)
```

3. (Opsional) Mulai MySQL lokal dengan Docker Compose jika belum tersedia:

```bash
# contoh singkat: jalankan mysql:8
docker run --name gopkl-mysql -e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE=ujikom_go_pkl -p 3306:3306 -d mysql:8
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

 - Jika Prisma tidak menemukan DB: periksa `DATABASE_URL` di `.env` dan pastikan MySQL berjalan.

 - Jika seed gagal karena model baru, jalankan ulang `npx prisma db push` lalu `node prisma/seed_static.js`.

## Check sebelum push ke GitHub

1. Pastikan `.env` tidak ikut ter-commit (file ini seharusnya ada di `.gitignore`).
2. Tambahkan instruksi run singkat di `README.md` (sudah ada di sini).
3. Jalankan test build lokal dan pastikan `npm run dev` berjalan.
4. Commit & push:

```bash
git add .
git commit -m "chore: add README and run instructions"
git push origin main
```

Jika Anda mau, saya bisa bantu membuat `docker-compose.yml` minimal untuk MySQL dan menambahkan skrip `make` atau `npm` untuk mengeksekusinya otomatis sebelum `npx prisma db push`.
