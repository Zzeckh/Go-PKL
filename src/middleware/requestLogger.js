/**
 * Log setiap request masuk — membantu debugging & monitoring.
 * Di production, bisa diganti Winston/Pino kalau butuh file logging.
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Skip log untuk endpoint yang terlalu sering dipanggil
  if (req.path === '/api/health') return next();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const color =
      res.statusCode < 300 ? '\x1b[32m' :
      res.statusCode < 400 ? '\x1b[36m' :
      res.statusCode < 500 ? '\x1b[33m' : '\x1b[31m';

    console.log(
      `${color}[${new Date().toISOString()}]\x1b[0m ` +
      `${req.method} ${req.originalUrl} ` +
      `${res.statusCode} ` +
      `${duration}ms` +
      (req.user ? ` (user:${req.user.id}|${req.user.role})` : '')
    );
  });

  next();
};