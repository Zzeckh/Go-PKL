/**
 * Vercel Serverless Function entrypoint.
 *
 * Sebuah Express app adalah handler `(req, res)` yang valid, jadi cukup
 * diekspor apa adanya. `vercel.json` me-rewrite `/api/:path*` ke function ini,
 * sehingga SEMUA route lama (`/api/auth`, `/api/absensi`, dst.) tetap sama
 * persis tanpa perubahan kode.
 */
import app from '../app.js';

export default app;
