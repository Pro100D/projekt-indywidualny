import { Router } from 'express';
import mongoose from 'mongoose';
import Reminder from '../models/Reminder.js';
import Purchase from '../models/Purchase.js';
import Address from '../models/Address.js';
import Notification from '../models/Notification.js';
import { parseDay } from '../jobs/warrantyNotifications.js';
import { forgetOldReminder, runReminderCheck } from '../jobs/reminderNotifications.js';

const router = Router();

const TYPES = ['service', 'filter', 'insurance', 'other'];

function notFound(res) {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Nie ma takiego przypomnienia' } });
}

function validationError(res, fields) {
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Popraw zaznaczone pola', fields } });
}

function readFields(body, partial) {
  const fields = {};
  const data = {};

  if (!partial || body?.title !== undefined) {
    data.title = String(body?.title ?? '').trim();
    if (!data.title) fields.title = 'Podaj, o czym przypomnieć';
    else if (data.title.length > 120) fields.title = 'Maksymalnie 120 znaków';
  }
  if (!partial || body?.type !== undefined) {
    data.type = body?.type || 'other';
    if (!TYPES.includes(data.type)) fields.type = 'Wybierz typ z listy';
  }
  if (!partial || body?.dueDate !== undefined) {
    data.dueDate = parseDay(String(body?.dueDate ?? ''));
    if (!data.dueDate) fields.dueDate = 'Podaj termin';
  }
  if (body?.isDone !== undefined) data.isDone = body.isDone === true;

  return { data, fields };
}

async function decorate(reminders, userId) {
  const purchaseIds = [...new Set(reminders.map((r) => String(r.purchaseId)))];
  const [purchases, addresses] = await Promise.all([
    Purchase.find({ _id: { $in: purchaseIds }, userId }).select('name addressId').lean(),
    Address.find({ userId }).select('label').lean(),
  ]);
  const purchaseById = new Map(purchases.map((p) => [String(p._id), p]));
  const labelById = new Map(addresses.map((a) => [String(a._id), a.label]));
  return reminders.map((r) => {
    const purchase = purchaseById.get(String(r.purchaseId));
    return {
      ...r,
      purchaseName: purchase?.name || null,
      addressLabel: purchase ? labelById.get(String(purchase.addressId)) || null : null,
    };
  });
}

async function findOwn(req) {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return Reminder.findOne({ _id: req.params.id, userId: req.userId });
}

router.get('/', async (req, res) => {
  const { purchaseId, addressId, status } = req.query;
  const filter = { userId: req.userId };

  if (purchaseId) {
    if (!mongoose.isValidObjectId(purchaseId)) return res.json({ reminders: [] });
    filter.purchaseId = purchaseId;
  }
  if (addressId) {
    if (!mongoose.isValidObjectId(addressId)) return res.json({ reminders: [] });
    const ids = await Purchase.find({ userId: req.userId, addressId }).distinct('_id');
    filter.purchaseId = purchaseId ? filter.purchaseId : { $in: ids };
  }
  if (status === 'upcoming') filter.isDone = false;
  if (status === 'done') filter.isDone = true;

  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 200, 1), 200);
  const reminders = await Reminder.find(filter).sort({ isDone: 1, dueDate: 1, createdAt: 1 }).limit(limit).lean();
  res.json({ reminders: await decorate(reminders, req.userId) });
});

router.post('/', async (req, res) => {
  const { data, fields } = readFields(req.body, false);
  const purchaseId = String(req.body?.purchaseId ?? '');
  const purchaseOk = mongoose.isValidObjectId(purchaseId) && (await Purchase.exists({ _id: purchaseId, userId: req.userId }));
  if (!purchaseOk) fields.purchaseId = 'Wybierz rzecz';
  if (Object.keys(fields).length) return validationError(res, fields);

  const reminder = await Reminder.create({ ...data, purchaseId, userId: req.userId });
  await runReminderCheck({ userId: req.userId });
  const [decorated] = await decorate([reminder.toObject()], req.userId);
  res.status(201).json({ reminder: decorated });
});

router.put('/:id', async (req, res) => {
  const reminder = await findOwn(req);
  if (!reminder) return notFound(res);

  const { data, fields } = readFields(req.body, true);
  if (Object.keys(fields).length) return validationError(res, fields);

  Object.assign(reminder, data);
  await reminder.save();
  await forgetOldReminder(reminder);
  await runReminderCheck({ userId: req.userId });
  const [decorated] = await decorate([reminder.toObject()], req.userId);
  res.json({ reminder: decorated });
});

router.delete('/:id', async (req, res) => {
  const reminder = await findOwn(req);
  if (!reminder) return notFound(res);
  await Notification.deleteMany({ userId: req.userId, reminderId: reminder._id });
  await reminder.deleteOne();
  res.status(204).end();
});

export default router;
