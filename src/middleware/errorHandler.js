/**
 * Central error handler — semua error dari controller masuk ke sini.
 * Response selalu format: { error: string, details?: any }
 */
export const errorHandler = (err, req, res, next) => {
  // Default log: semua error
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
    message: err.message,
    code: err.code,
    status: err.status,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Prisma known errors — kasih pesan ramah
  if (err.code === 'P2002') {
    const fields = err.meta?.target?.join(', ') || 'unique field';
    return res.status(409).json({ error: `Data dengan ${fields} sudah terdaftar` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Data yang diupdate/delete tidak ditemukan' });
  }
  if (err.code?.startsWith('P')) {
    return res.status(400).json({ error: 'Error database: ' + err.message });
  }

  // JSON parse error (body request rusak)
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Body request tidak valid (JSON rusak)' });
  }

  // JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token sudah kedaluwarsa, silakan login ulang' });
  }

  // Fallback
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  });
};