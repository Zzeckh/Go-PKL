/**
 * Go-PKL API — LOCAL DEV ONLY.
 *
 * Konstruksi Express app pindah ke `app.js`. File ini hanya membungkusnya
 * dengan HTTP listener; di Vercel, `api/index.js` yang menjadi entrypoint
 * serverless — tidak ada listener di production.
 */
import app from './app.js';

// "Run directly" check untuk ESM: jalankan listener HANYA saat file ini
// dieksekusi langsung (`node server.js`), bukan saat di-import (Vercel).
// Bandingkan path dari import.meta.url dengan argv[1] agar aman terhadap
// symlink/perbedaan casing.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Go-PKL API running on http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
