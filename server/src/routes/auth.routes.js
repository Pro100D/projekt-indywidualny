// Funkcja 1: Konto użytkownika
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Do frontu wysyłamy tylko te pola — nigdy hash hasła.
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

// Błąd walidacji: komunikat ogólny + komunikaty dla konkretnych pól formularza.
function validationError(res, fields) {
  return res.status(400).json({
    error: { code: 'VALIDATION_ERROR', message: 'Popraw zaznaczone pola', fields },
  });
}

router.post('/register', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  const fields = {};
  if (!name) fields.name = 'Podaj imię';
  if (!EMAIL_RE.test(email)) fields.email = 'Podaj poprawny adres e-mail';
  if (password.length < MIN_PASSWORD) fields.password = `Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków`;
  if (Object.keys(fields).length) return validationError(res, fields);

  if (await User.exists({ email })) {
    return validationError(res, { email: 'Konto z tym adresem e-mail już istnieje' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  res.status(201).json({ token: createToken(user), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  const user = email ? await User.findOne({ email }) : null;
  const ok = user && (await bcrypt.compare(password, user.passwordHash));

  // Ten sam komunikat dla złego e-maila i złego hasła — nie zdradzamy, czy konto istnieje.
  if (!ok) {
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Nieprawidłowy e-mail lub hasło' },
    });
  }

  res.json({ token: createToken(user), user: publicUser(user) });
});

// Dane zalogowanego użytkownika — front pyta o nie po odświeżeniu strony.
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Konto nie istnieje' } });
  }
  res.json({ user: publicUser(user) });
});

export default router;
