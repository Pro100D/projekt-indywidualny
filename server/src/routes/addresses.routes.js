import { Router } from 'express';
import mongoose from 'mongoose';
import Address from '../models/Address.js';
import Purchase from '../models/Purchase.js';
import Reminder from '../models/Reminder.js';
import Notification from '../models/Notification.js';

const router = Router();

function readAddress(body) {
  return {
    label: String(body?.label ?? '').trim(),
    street: String(body?.street ?? '').trim(),
    city: String(body?.city ?? '').trim(),
  };
}

function validate(res, data) {
  if (data.label) return false;
  res.status(400).json({
    error: { code: 'VALIDATION_ERROR', message: 'Popraw zaznaczone pola', fields: { label: 'Podaj nazwę adresu' } },
  });
  return true;
}

function notFound(res) {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Nie ma takiego adresu' } });
}

async function findOwn(req) {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return Address.findOne({ _id: req.params.id, userId: req.userId });
}

async function makeOnlyDefault(userId, addressId) {
  await Address.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
  await Address.updateOne({ _id: addressId }, { isDefault: true });
}

async function listFor(userId) {
  const [addresses, counts] = await Promise.all([
    Address.find({ userId }).sort({ isDefault: -1, createdAt: 1 }).lean(),
    Purchase.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(String(userId)) } },
      { $group: { _id: '$addressId', count: { $sum: 1 } } },
    ]),
  ]);
  const byAddress = new Map(counts.map((c) => [String(c._id), c.count]));
  return addresses.map((a) => ({ ...a, purchaseCount: byAddress.get(String(a._id)) || 0 }));
}

router.get('/', async (req, res) => {
  res.json({ addresses: await listFor(req.userId) });
});

router.post('/', async (req, res) => {
  const data = readAddress(req.body);
  if (validate(res, data)) return;

  const isFirst = !(await Address.exists({ userId: req.userId }));
  const address = await Address.create({ ...data, userId: req.userId, isDefault: isFirst });
  if (!isFirst && req.body?.isDefault === true) await makeOnlyDefault(req.userId, address._id);

  res.status(201).json({ address: await Address.findById(address._id) });
});

router.get('/:id', async (req, res) => {
  const address = await findOwn(req);
  if (!address) return notFound(res);
  res.json({ address });
});

router.put('/:id', async (req, res) => {
  const address = await findOwn(req);
  if (!address) return notFound(res);

  const data = readAddress({ ...address.toObject(), ...req.body });
  if (validate(res, data)) return;

  Object.assign(address, data);
  await address.save();
  if (req.body?.isDefault === true) await makeOnlyDefault(req.userId, address._id);

  res.json({ address: await Address.findById(address._id) });
});

router.delete('/:id', async (req, res) => {
  const address = await findOwn(req);
  if (!address) return notFound(res);

  const filter = { userId: req.userId, addressId: address._id };
  const purchases = await Purchase.countDocuments(filter);
  const withPurchases = req.query.withPurchases === 'true';

  if (purchases > 0 && !withPurchases) {
    return res.status(409).json({
      error: {
        code: 'ADDRESS_IN_USE',
        message: `Do adresu „${address.label}” należą zakupy (${purchases}). Usuń je razem z adresem.`,
        purchaseCount: purchases,
      },
    });
  }

  if (purchases > 0) {
    const purchaseIds = await Purchase.find(filter).distinct('_id');
    await Promise.all([
      Reminder.deleteMany({ userId: req.userId, purchaseId: { $in: purchaseIds } }),
      Notification.deleteMany({ userId: req.userId, purchaseId: { $in: purchaseIds } }),
    ]);
    await Purchase.deleteMany(filter);
  }

  await address.deleteOne();

  if (address.isDefault) {
    const next = await Address.findOne({ userId: req.userId }).sort({ createdAt: 1 });
    if (next) await makeOnlyDefault(req.userId, next._id);
  }

  res.json({ deletedPurchases: purchases });
});

export default router;
