import { Router } from 'express';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import Address from '../models/Address.js';
import Reminder from '../models/Reminder.js';
import Notification from '../models/Notification.js';

const router = Router();

const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'];

const SORTS = {
  date_desc: { purchaseDate: -1, createdAt: -1 },
  date_asc: { purchaseDate: 1, createdAt: 1 },
  price_desc: { price: -1, purchaseDate: -1 },
  price_asc: { price: 1, purchaseDate: -1 },
  name_asc: { name: 1 },
  added: { createdAt: -1 },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function text(value) {
  return String(value ?? '').trim();
}

function notFound(res) {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Nie ma takiego zakupu' } });
}

async function readPurchase(body, userId) {
  const fields = {};
  const data = {
    name: text(body?.name),
    category: text(body?.category),
    store: text(body?.store),
    serialNumber: text(body?.serialNumber),
    notes: text(body?.notes),
    currency: text(body?.currency) || 'PLN',
  };

  if (!data.name) fields.name = 'Podaj nazwę rzeczy';

  data.purchaseDate = parseDay(body?.purchaseDate);
  if (!data.purchaseDate) fields.purchaseDate = 'Podaj datę zakupu';

  const rawPrice = String(body?.price ?? '').replace(/\s/g, '').replace(',', '.');
  const price = Number(rawPrice);
  if (!rawPrice) fields.price = 'Podaj cenę';
  else if (!Number.isFinite(price)) fields.price = 'Wpisz cenę liczbą, np. 199,99';
  else if (price <= 0) fields.price = 'Cena musi być większa od 0';
  else data.price = Math.round(price * 100) / 100;

  if (!CURRENCIES.includes(data.currency)) fields.currency = 'Wybierz walutę z listy';

  const rawWarranty = text(body?.warrantyUntil);
  data.warrantyUntil = null;
  if (rawWarranty) {
    data.warrantyUntil = parseDay(rawWarranty);
    if (!data.warrantyUntil) fields.warrantyUntil = 'Nieprawidłowa data';
    else if (data.purchaseDate && data.warrantyUntil < data.purchaseDate) {
      fields.warrantyUntil = 'Koniec gwarancji nie może być wcześniej niż data zakupu';
    }
  }

  const addressId = text(body?.addressId);
  const addressOk = mongoose.isValidObjectId(addressId) && (await Address.exists({ _id: addressId, userId }));
  if (!addressOk) fields.addressId = 'Wybierz adres';
  else data.addressId = addressId;

  return { data, fields };
}

function validationError(res, fields) {
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Popraw zaznaczone pola', fields } });
}

async function findOwn(req) {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return Purchase.findOne({ _id: req.params.id, userId: req.userId });
}

async function withAddress(purchase) {
  const address = await Address.findById(purchase.addressId).select('label').lean();
  return { ...purchase.toObject(), address: address ? { _id: address._id, label: address.label } : null };
}

router.get('/', async (req, res) => {
  const { addressId, from, to, category, search, sort, limit } = req.query;
  const base = { userId: req.userId };

  if (addressId) {
    if (!mongoose.isValidObjectId(addressId)) return res.json({ purchases: [], total: 0, categories: [] });
    base.addressId = addressId;
  }

  const filter = { ...base };
  const fromDay = parseDay(from);
  const toDay = parseDay(to);
  if (fromDay || toDay) {
    filter.purchaseDate = {};
    if (fromDay) filter.purchaseDate.$gte = fromDay;
    if (toDay) filter.purchaseDate.$lt = new Date(toDay.getTime() + 24 * 60 * 60 * 1000);
  }
  if (text(category)) filter.category = text(category);
  if (text(search)) {
    const re = new RegExp(escapeRegex(text(search)), 'i');
    filter.$or = [{ name: re }, { store: re }, { serialNumber: re }];
  }

  const max = Math.min(Math.max(Number.parseInt(limit, 10) || 500, 1), 500);

  const [purchases, total, categories] = await Promise.all([
    Purchase.find(filter).sort(SORTS[sort] || SORTS.date_desc).limit(max).select('-documents.s3Key').lean(),
    Purchase.countDocuments(base),
    Purchase.distinct('category', base),
  ]);

  res.json({
    purchases,
    total,
    categories: categories.filter(Boolean).sort((a, b) => a.localeCompare(b, 'pl')),
  });
});

router.post('/', async (req, res) => {
  const { data, fields } = await readPurchase(req.body, req.userId);
  if (Object.keys(fields).length) return validationError(res, fields);

  const purchase = await Purchase.create({ ...data, userId: req.userId });
  res.status(201).json({ purchase: await withAddress(purchase) });
});

router.get('/:id', async (req, res) => {
  const purchase = await findOwn(req);
  if (!purchase) return notFound(res);
  res.json({ purchase: await withAddress(purchase) });
});

router.put('/:id', async (req, res) => {
  const purchase = await findOwn(req);
  if (!purchase) return notFound(res);

  const { data, fields } = await readPurchase(req.body, req.userId);
  if (Object.keys(fields).length) return validationError(res, fields);

  Object.assign(purchase, data);
  await purchase.save();
  res.json({ purchase: await withAddress(purchase) });
});

router.delete('/:id', async (req, res) => {
  const purchase = await findOwn(req);
  if (!purchase) return notFound(res);

  await Promise.all([
    Reminder.deleteMany({ userId: req.userId, purchaseId: purchase._id }),
    Notification.deleteMany({ userId: req.userId, purchaseId: purchase._id }),
  ]);
  await purchase.deleteOne();
  res.status(204).end();
});

export default router;
