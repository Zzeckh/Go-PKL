/**
 * Supabase Storage helper — pengganti disk `uploads/` (disk serverless itu
 * ephemeral). Semua file upload dikirim ke bucket "uploads" dan disimpan
 * sebagai FULL PUBLIC URL di kolom database.
 *
 * Env (lihat .env.example):
 *   SUPABASE_URL               — Project URL (https://[REF].supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY  — service_role secret (server-side only)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const BUCKET_NAME = 'uploads';

/* Admin client (service_role) — dibuat lazy + di-cache agar reuse antar
 * invocation serverless tanpa error saat env belum lengkap di local dev. */
let adminClient = null;

export function getStorageAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Konfigurasi Supabase Storage belum lengkap: set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/**
 * Sanitize nama file asli → aman sebagai path object Storage.
 * Contoh: "Surat Izin (1).jpg" → "surat-izin-1.jpg"
 */
export function safeFileName(originalname) {
  const base = String(originalname || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  // Slice dari belakang agar ekstensi tetap ada (meniru perilaku lama).
  return base.slice(-40) || 'file';
}

/**
 * Upload buffer ke bucket `uploads` dan KEMBALIKAN FULL PUBLIC URL.
 *
 * Path: `<category>/<timestamp>-<safeName>`
 * URL : https://<ref>.supabase.co/storage/v1/object/public/uploads/<path>
 */
export async function uploadToSupabase(buffer, { category = 'misc', originalname, contentType }) {
  const supabase = getStorageAdmin();

  const objectPath = `${category}/${Date.now()}-${safeFileName(originalname)}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(objectPath, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
  });

  if (error) {
    throw new Error(`Gagal mengunggah file ke Supabase Storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(objectPath);
  if (!data?.publicUrl) {
    throw new Error('Gagal mendapatkan public URL dari Supabase Storage.');
  }

  return data.publicUrl;
}
