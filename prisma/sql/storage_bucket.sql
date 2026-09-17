-- =====================================================================
-- Supabase Storage: public bucket "uploads" + RLS policies
--
-- Bucket/policies TIDAK didukung `prisma migrate`, jadi file ini dieksekusi
-- langsung ke database:
--
--   npx prisma db execute --file prisma/sql/storage_bucket.sql --schema prisma/schema.prisma
--
-- (atau tempel di Supabase Dashboard → SQL Editor). Idempotent — aman
-- dijalankan ulang untuk project Supabase baru.
-- =====================================================================

-- 1. Public bucket "uploads" (idempotent)
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- 2. Public SELECT — siapa pun boleh membaca/men-render lampiran via public URL
drop policy if exists "Public read uploads" on storage.objects;
create policy "Public read uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');

-- 3. Tulis hanya lewat server (service_role) — klien TIDAK boleh upload langsung
drop policy if exists "Service role write uploads" on storage.objects;
create policy "Service role write uploads"
  on storage.objects for insert to service_role
  with check (bucket_id = 'uploads');

drop policy if exists "Service role update uploads" on storage.objects;
create policy "Service role update uploads"
  on storage.objects for update to service_role
  using (bucket_id = 'uploads')
  with check (bucket_id = 'uploads');

drop policy if exists "Service role delete uploads" on storage.objects;
create policy "Service role delete uploads"
  on storage.objects for delete to service_role
  using (bucket_id = 'uploads');
