import { Router } from 'express';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import { parseDay, todayUtc } from '../jobs/warrantyNotifications.js';

const router = Router();

const DAY = 24 * 60 * 60 * 1000;
const EXPIRING_DAYS = 30;
const NO_CATEGORY = 'Bez kategorii';

function round(value) {
  return Math.round(value * 100) / 100;
}

router.get('/summary', async (req, res) => {
  const { addressId } = req.query;
  const from = parseDay(req.query.from);
  const to = parseDay(req.query.to);
  const today = parseDay(req.query.today) || todayUtc();

  if (addressId && !mongoose.isValidObjectId(addressId)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Nieprawidłowy adres' } });
  }
  if (from && to && from > to) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Data „od” nie może być późniejsza niż „do”', fields: { from: 'Popraw okres' } },
    });
  }

  const base = { userId: new mongoose.Types.ObjectId(String(req.userId)) };
  if (addressId) base.addressId = new mongoose.Types.ObjectId(String(addressId));

  const match = { ...base };
  if (from || to) {
    match.purchaseDate = {};
    if (from) match.purchaseDate.$gte = from;
    if (to) match.purchaseDate.$lt = new Date(to.getTime() + DAY);
  }

  const [totals, categories, expiringWarranties] = await Promise.all([
    Purchase.aggregate([
      { $match: match },
      { $group: { _id: { $ifNull: ['$currency', 'PLN'] }, sum: { $sum: '$price' }, count: { $sum: 1 } } },
      { $sort: { count: -1, sum: -1 } },
    ]),
    Purchase.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            currency: { $ifNull: ['$currency', 'PLN'] },
            category: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$category', ''] } }, 0] }, '$category', NO_CATEGORY] },
          },
          sum: { $sum: '$price' },
          count: { $sum: 1 },
        },
      },
      { $sort: { sum: -1 } },
    ]),
    Purchase.countDocuments({ ...base, warrantyUntil: { $gte: today, $lte: new Date(today.getTime() + EXPIRING_DAYS * DAY) } }),
  ]);

  res.json({
    from: from ? from.toISOString().slice(0, 10) : null,
    to: to ? to.toISOString().slice(0, 10) : null,
    count: totals.reduce((n, t) => n + t.count, 0),
    totals: totals.map((t) => ({ currency: t._id, sum: round(t.sum), count: t.count })),
    categories: categories.map((c) => ({
      currency: c._id.currency,
      category: c._id.category,
      sum: round(c.sum),
      count: c.count,
    })),
    expiringWarranties,
  });
});

export default router;
