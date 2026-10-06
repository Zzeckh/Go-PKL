-- BACKUP database terlebih dahulu. Jalankan pada database Go-PKL yang benar.
-- Nama tabel diasumsikan `user`, sesuai struktur database proyek saat ini.
-- Jika nama tabel pada schema memakai @@map berbeda, sesuaikan nama tabelnya.
ALTER TABLE `user` ADD COLUMN `tefaCategory` VARCHAR(20) NULL;
