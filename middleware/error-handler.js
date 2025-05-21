export function errorHandler(err, req, res) {
  const status = err.status || 500
  const message = err.message || 'Внутрішня помилка сервера'

  res.status(status).json({ message })
}
