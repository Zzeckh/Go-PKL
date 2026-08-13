export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Terjadi kesalahan server";

  res.status(status).json({ error: message });
};
