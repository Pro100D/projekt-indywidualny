// Tymczasowa odpowiedź dla endpointów, które nie są jeszcze zrobione.
export function notImplemented(req, res) {
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: `${req.method} ${req.originalUrl} — jeszcze nie zaimplementowane` },
  });
}
