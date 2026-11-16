import { Router } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import Purchase from '../models/Purchase.js';
import Address from '../models/Address.js';
import { parseDay, runWarrantyCheck, todayUtc } from '../jobs/warrantyNotifications.js';

const router = Router();

async function refresh(req) {
  await runWarrantyCheck({ userId: req.userId, today: parseDay(req.query.today) || todayUtc() });
}

function unreadCount(userId) {
  return Notification.countDocuments({ userId, isRead: false });
}

router.get('/', async (req, res) => {
  await refresh(req);

  const filter = { userId: req.userId };
  if (req.query.filter === 'unread') filter.isRead = false;
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 200);

  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  const purchaseIds = [...new Set(notifications.map((n) => String(n.purchaseId)))];
  const purchases = await Purchase.find({ _id: { $in: purchaseIds }, userId: req.userId })
    .select('name addressId')
    .lean();
  const addresses = await Address.find({ userId: req.userId }).select('label').lean();

  const purchaseById = new Map(purchases.map((p) => [String(p._id), p]));
  const labelById = new Map(addresses.map((a) => [String(a._id), a.label]));

  res.json({
    unreadCount: await unreadCount(req.userId),
    notifications: notifications.map((n) => {
      const purchase = purchaseById.get(String(n.purchaseId));
      return {
        ...n,
        purchaseName: purchase?.name || null,
        addressLabel: purchase ? labelById.get(String(purchase.addressId)) || null : null,
      };
    }),
  });
});

router.get('/unread-count', async (req, res) => {
  await refresh(req);
  res.json({ unreadCount: await unreadCount(req.userId) });
});

router.put('/read-all', async (req, res) => {
  const result = await Notification.updateMany({ userId: req.userId, isRead: false }, { isRead: true });
  res.json({ updated: result.modifiedCount, unreadCount: 0 });
});

router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Nie ma takiego powiadomienia' } });
  }
  const isRead = req.body?.isRead !== false;
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { isRead },
    { returnDocument: 'after' },
  );
  if (!notification) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Nie ma takiego powiadomienia' } });
  }
  res.json({ notification, unreadCount: await unreadCount(req.userId) });
});

export default router;
