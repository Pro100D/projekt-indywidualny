import jwt from 'jsonwebtoken';

// Sprawdza nagłówek "Authorization: Bearer <token>" i zapisuje id użytkownika w req.userId.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Brak tokenu' } });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Nieprawidłowy lub wygasły token' } });
  }
}
