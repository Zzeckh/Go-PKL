# Go-PKL - Panduan Instalasi dan Migrasi

Dokumen ini memandu pengguna Windows yang menjalankan database melalui Laragon (bundel MySQL/MariaDB) untuk menginstal dependensi, menyiapkan database, menjalankan migrasi Prisma, mengisi data awal, serta menjalankan aplikasi Go-PKL secara lokal.

Asumsi lingkungan:
- Sistem operasi Windows 10 atau Windows 11.
- Laragon Full sudah terpasang (membawa Apache, MySQL/MariaDB, PHP, dan terminal).
- Node.js versi 18 atau lebih baru sudah terpasang dan dapat dipanggil dari command line.
- Git sudah terpasang (opsional, untuk mengambil kode sumber).


## 1. Persiapan Laragon dan Database MySQL

Langkah ini memastikan layanan MySQL berjalan dan database proyek tersedia.

1. Jalankan Laragon dengan klik kanan pada ikon Laragon, lalu pilih Run, atau buka aplikasi Laragon dan tekan Start All. Pastikan indikator MySQL berwarna hijau (berjalan).
2. Buka terminal. Anda dapat menggunakan terminal bawaan Laragon (klik kanan di area Laragon, pilih Terminal, lalu Terminal) atau Command Prompt maupun PowerShell biasa.
3. Masuk ke klien MySQL melalui Laragon. Cara tercepat: di menu Laragon pilih MySQL, lalu mysql.exe -u root. Alternatifnya jalankan perintah berikut di terminal:

   mysql -u root

4. Buat database khusus untuk proyek. Jalankan perintah SQL berikut di dalam klien MySQL:

   CREATE DATABASE ujikom_go_pkl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

5. (Opsional namun disarankan) Buat pengguna khusus bernama sail agar sesuai dengan konfigurasi default proyek, lalu berikan hak akses penuh ke database tersebut:

   CREATE USER 'sail'@'localhost' IDENTIFIED BY 'sail';
   GRANT ALL PRIVILEGES ON ujikom_go_pkl.* TO 'sail'@'localhost';
   FLUSH PRIVILEGES;

   Catatan: jika Anda tidak ingin membuat pengguna sail dan memilih tetap memakai root tanpa password, sesuaikan nilai DATABASE_URL pada langkah berikutnya menjadi menggunakan root.

6. Keluar dari klien MySQL dengan mengetik exit lalu Enter.


## 2. Konfigurasi Environment Variable

1. Buka folder proyek Go-PKL di terminal, misalnya:

   cd C:\laragon\www\gopkl

   Sesuaikan jalur dengan lokasi penyimpanan proyek Anda.

2. Jika belum ada file .env di akar proyek, buatlah dengan menyalin dari contoh. Bila file .env.example tersedia:

   copy .env.example .env

   Bila tidak ada contoh, buat file .env secara manual.

3. Isi file .env dengan minimal variabel berikut. Pilih salah satu dari dua opsi DATABASE_URL sesuai langkah 1 nomor 5.

   Opsi A (menggunakan pengguna sail):
   DATABASE_URL="mysql://sail:sail@localhost:3306/ujikom_go_pkl"

   Opsi B (menggunakan root tanpa password):
   DATABASE_URL="mysql://root@localhost:3306/ujikom_go_pkl"

   Variabel lain yang diperlukan:
   JWT_SECRET=ganti_dengan_string_acak_panjang_minimal_32_karakter
   PORT=5000
   NODE_ENV=development

   Penting: pastikan tidak ada spasi di sekitar tanda sama dengan, dan nilai DATABASE_URL diapit tanda kutip ganda.


## 3. Instalasi Dependensi

Jalankan perintah berikut di akar proyek untuk memasang seluruh paket Node.js yang dibutuhkan, termasuk Prisma, Express, bcryptjs, jsonwebtoken, serta library peta Leaflet di sisi frontend:

npm install


## 4. Generate Prisma Client

Sebelum menjalankan migrasi, generate Prisma Client agar TypeScript mengenali model database:

npx prisma generate


## 5. Migrasi Schema ke Database

Proyek menggunakan Prisma dengan pendekatan db push karena schema dikelola langsung dari file prisma/schema.prisma. Perintah ini akan membuat seluruh tabel (School, Class, User, Company, Absensi, Logbook, Permission, Evaluation) beserta enum dan relasinya di database ujikom_go_pkl.

Untuk pengembangan awal atau saat database masih kosong:

npx prisma db push

Jika Anda ingin mereset database sepenuhnya (menghapus semua data lalu membangun ulang schema dari nol), gunakan:

npx prisma db push --force-reset

Peringatan: perintah force-reset akan menghapus seluruh data yang ada di database ujikom_go_pkl. Hanya gunakan pada lingkungan pengembangan.

Verifikasi hasil migrasi:
- Buka phpMyAdmin melalui menu Laragon (MySQL, phpMyAdmin), masuk dengan kredensial yang sesuai, lalu pilih database ujikom_go_pkl. Seluruh tabel seharusnya sudah muncul.
- Atau jalankan Prisma Studio untuk melihat data secara visual:

  npx prisma studio

  Prisma Studio akan terbuka di peramban pada alamat http://localhost:5555.


## 6. Pengisian Data Awal (Seeding)

Seed akan membuat data minimal agar aplikasi dapat langsung digunakan: satu sekolah, satu perusahaan mitra lengkap dengan koordinat dan radius geofence, dua kelas, serta empat akun pengguna (siswa, guru, mentor, dan hubin) dengan password yang sama.

Jalankan:

npm run seed

Setelah selesai, akun yang dapat digunakan untuk login adalah sebagai berikut. Password untuk keempat akun sama, yaitu gopkl123.

- siswa@gopkl.id   (role student, ditampilkan sebagai intern di frontend)
- guru@gopkl.id    (role teacher)
- mentor@gopkl.id  (role mentor)
- hubin@gopkl.id   (role hubin, berperan sebagai admin sekolah)


## 7. Menjalankan Aplikasi

Proyek menjalankan backend (Express pada port 5000) dan frontend (Vite pada port 5173) secara bersamaan melalui satu perintah:

npm run dev

Tunggu hingga terminal menampilkan pesan bahwa API berjalan di http://localhost:5000 dan Vite siap di http://localhost:5173. Buka http://localhost:5173 di peramban, lalu login menggunakan salah satu akun pada langkah 6.

Untuk menghentikan aplikasi, tekan Ctrl + C di terminal.


## 8. Catatan Khusus Pengguna Laragon

- Layanan MySQL harus dalam keadaan berjalan setiap kali Anda menjalankan aplikasi. Jika MySQL belum menyala, aplikasi akan gagal koneksi dengan pesan Can't reach database server at localhost:3306. Pastikan Laragon dalam状态 Start All sebelum menjalankan npm run dev.
- Port 3306 adalah port default MySQL di Laragon. Jika Anda pernah mengubah port MySQL di Laragon, sesuaikan angka 3306 pada DATABASE_URL dengan port yang berlaku.
- Jika terjadi konflik port 5000 (backend) atau 5173 (frontend) dengan aplikasi lain, ubah nilai PORT di file .env untuk backend, dan ubah konfigurasi port Vite untuk frontend.
- Prisma Studio (npx prisma studio) sangat berguna untuk memeriksa dan mengedit data secara manual selama pengembangan, misalnya menambahkan koordinat perusahaan atau memverifikasi hasil absensi.


## 9. Pemecahan Masalah Umum

Masalah: Can't reach database server at localhost:3306.
Penyebab: layanan MySQL Laragon belum berjalan.
Solusi: buka Laragon dan tekan Start All, pastikan indikator MySQL hijau, lalu jalankan ulang npm run dev.

Masalah: Access denied for user.
Penyebab: kredensial pada DATABASE_URL tidak cocok dengan pengguna MySQL yang ada.
Solusi: pastikan nama pengguna dan password di DATABASE_URL sama persis dengan yang dibuat pada langkah 1. Untuk pengguna root tanpa password di Laragon, gunakan bentuk mysql://root@localhost:3306/ujikom_go_pkl tanpa bagian password.

Masalah: Unknown database ujikom_go_pkl.
Penyebab: database belum dibuat.
Solusi: jalankan perintah CREATE DATABASE pada langkah 1 nomor 4.

Masalah: Error P2002 Unique constraint failed saat seeding.
Penyebab: data seed sudah pernah dimasukkan sebelumnya.
Solusi: jalankan npx prisma db push --force-reset untuk mengosongkan database, lalu ulangi npm run seed.

Masalah: Module not found atau error dependensi setelah menarik kode terbaru.
Penyebab: dependensi belum terpasang atau tidak sinkron.
Solusi: jalankan ulang npm install, kemudian npx prisma generate.

Masalah: Perubahan schema tidak tercermin di database.
Penyebab: perintah migrasi belum dijalankan setelah mengubah prisma/schema.prisma.
Solusi: jalankan npx prisma db push setelah setiap perubahan schema.


## 10. Ringkasan Urutan Perintah

Berikut urutan lengkap perintah dari awal hingga aplikasi berjalan, untuk referensi cepat:

1. Start All di Laragon (pastikan MySQL berjalan).
2. Buat database dan pengguna melalui mysql -u root (langkah 1).
3. cd ke folder proyek.
4. Buat dan isi file .env (langkah 2).
5. npm install
6. npx prisma generate
7. npx prisma db push
8. npm run seed
9. npm run dev
10. Buka http://localhost:5173 dan login dengan akun pada langkah 6.

Dengan mengikuti urutan di atas, lingkungan pengembangan Go-PKL berbasis MySQL Laragon di Windows akan siap digunakan.
