import { Router } from 'express';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import Address from '../models/Address.js';

const router = Router();

const DAY = 24 * 60 * 60 * 1000;
const EXPIRING_DAYS = 30;
const STATUSES = ['active', 'expiring', 'expired'];

function parseDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function todayUtc() {
  return parseDay(new Date().toISOString().slice(0, 10));
}

function rangeFor(status, today) {
  const limit = new Date(today.getTime() + EXPIRING_DAYS * DAY);
  if (status === 'expired') return { $lt: today };
  if (status === 'expiring') return { $gte: today, $lte: limit };
  return { $gt: limit };
}

router.get('/', async (req, res) => {
  const status = STATUSES.includes(req.query.status) ? req.query.status : 'expiring';
  const today = parseDay(req.query.today) || todayUtc();

  const base = { userId: req.userId };
  if (req.query.addressId) {
    if (!mongoose.isValidObjectId(req.query.addressId)) {
      return res.json({ status, purchases: [], counts: { active: 0, expiring: 0, expired: 0, none: 0 } });
    }
    base.addressId = req.query.addressId;
  }

  const [purchases, active, expiring, expired, none, addresses] = await Promise.all([
    Purchase.find({ ...base, warrantyUntil: rangeFor(status, today) })
      .sort({ warrantyUntil: status === 'expired' ? -1 : 1, name: 1 })
      .select('name category purchaseDate price currency warrantyUntil addressId')
      .lean(),
    Purchase.countDocuments({ ...base, warrantyUntil: rangeFor('active', today) }),
    Purchase.countDocuments({ ...base, warrantyUntil: rangeFor('expiring', today) }),
    Purchase.countDocuments({ ...base, warrantyUntil: rangeFor('expired', today) }),
    Purchase.countDocuments({ ...base, warrantyUntil: null }),
    Address.find({ userId: req.userId }).select('label').lean(),
  ]);

  const labels = new Map(addresses.map((a) => [String(a._id), a.label]));

  res.json({
    status,
    today: today.toISOString().slice(0, 10),
    counts: { active, expiring, expired, none },
    purchases: purchases.map((p) => ({ ...p, addressLabel: labels.get(String(p.addressId)) || null })),
  });
});

export default router;
