/**
 * Go-PKL API — LOCAL DEV ONLY.
 *
 * Konstruksi Express app berada di `app.js`.
 * File ini hanya membungkusnya dengan HTTP listener.
 *
 * Di Vercel, `api/index.js` menjadi entrypoint serverless,
 * sehingga tidak ada listener production dari file ini.
 */

import app from './app.js';

// "Run directly" check untuk ESM.
// Listener hanya dijalankan ketika file ini dieksekusi langsung
// (`node server.js`), bukan ketika di-import oleh Vercel.
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