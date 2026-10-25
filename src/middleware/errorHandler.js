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
    const target = err.meta?.target;
    const fields = Array.isArray(target) ? target.join(', ') : (target || 'unique field');
    return res.status(409).json({ error: `Data dengan ${fields} sudah terdaftar` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Data yang diupdate/delete tidak ditemukan' });
  }
  if (err.code?.startsWith('P')) {
    const friendlyMessages = {
      P2000: 'Nilai yang dikirim terlalu panjang.',
      P2001: 'Data yang dimaksud tidak ditemukan.',
      P2003: 'Data masih digunakan oleh data lain.',
      P2006: 'Nilai yang dikirim tidak valid.',
      P2011: 'Ada data wajib yang belum diisi.',
      P2012: 'Ada data wajib yang belum diisi.',
      P2013: 'Ada data wajib yang belum diisi.',
      P2014: 'Perubahan ini akan memutus relasi data yang masih dipakai.',
      P2015: 'Data terkait tidak ditemukan.',
      P2019: 'Nilai yang dikirim tidak valid.',
      P2020: 'Nilai yang dikirim di luar batas.',
      P2023: 'Format data tidak valid.',
    };

    const notFoundCodes = new Set(['P2001', 'P2015']);
    const conflictCodes = new Set(['P2003', 'P2014']);
    const clientErrorCodes = new Set([
      'P2000',
      'P2006',
      'P2011',
      'P2012',
      'P2013',
      'P2019',
      'P2020',
      'P2023',
    ]);

    let status = 500;

    if (notFoundCodes.has(err.code)) {
      status = 404;
    } else if (conflictCodes.has(err.code)) {
      status = 409;
    } else if (clientErrorCodes.has(err.code)) {
      status = 400;
    }

    // Detail teknis hanya masuk log server, tidak dikirim ke client.
    return res.status(status).json({
      error:
        friendlyMessages[err.code] || 'Internal server error',
    });
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
  const message =
    status >= 500
      ? 'Internal server error'
      : err.message || 'Terjadi kesalahan';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  });
};
