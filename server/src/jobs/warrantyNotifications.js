import Purchase from '../models/Purchase.js';
import Notification from '../models/Notification.js';

const DAY = 24 * 60 * 60 * 1000;
export const THRESHOLDS = [30, 7, 1];
export const EXPIRED = 0;
const EXPIRED_CATCH_UP_DAYS = 7;

export function parseDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function todayUtc() {
  return parseDay(new Date().toISOString().slice(0, 10));
}

function formatDay(date) {
  return date.toLocaleDateString('pl-PL', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
}

function daysWord(n) {
  return n === 1 ? '1 dzień' : `${n} dni`;
}

function buildNotification(purchase, daysLeft) {
  const date = formatDay(purchase.warrantyUntil);
  if (daysLeft < 0) {
    return {
      type: 'warranty_expired',
      threshold: EXPIRED,
      message: `Gwarancja na „${purchase.name}” wygasła ${date}.`,
    };
  }
  const threshold = [...THRESHOLDS].reverse().find((t) => daysLeft <= t);
  const when = daysLeft === 0 ? 'dziś' : daysLeft === 1 ? 'jutro' : `za ${daysWord(daysLeft)}`;
  return {
    type: 'warranty_expiring',
    threshold,
    message: `Gwarancja na „${purchase.name}” kończy się ${when} (${date}).`,
  };
}

export async function runWarrantyCheck({ userId, today = todayUtc() } = {}) {
  const filter = {
    warrantyUntil: {
      $gte: new Date(today.getTime() - EXPIRED_CATCH_UP_DAYS * DAY),
      $lte: new Date(today.getTime() + Math.max(...THRESHOLDS) * DAY),
    },
  };
  if (userId) filter.userId = userId;

  const purchases = await Purchase.find(filter).select('userId name warrantyUntil').lean();
  let created = 0;

  for (const purchase of purchases) {
    const daysLeft = Math.round((purchase.warrantyUntil.getTime() - today.getTime()) / DAY);
    const data = buildNotification(purchase, daysLeft);
    try {
      const result = await Notification.updateOne(
        { purchaseId: purchase._id, threshold: data.threshold, warrantyUntil: purchase.warrantyUntil },
        {
          $setOnInsert: {
            ...data,
            userId: purchase.userId,
            purchaseId: purchase._id,
            warrantyUntil: purchase.warrantyUntil,
            daysLeft,
            isRead: false,
          },
        },
        { upsert: true },
      );
      created += result.upsertedCount;
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }

  return created;
}

export async function forgetOldWarranty(purchase) {
  await Notification.deleteMany({
    purchaseId: purchase._id,
    threshold: { $exists: true },
    warrantyUntil: { $ne: purchase.warrantyUntil || null },
  });
}
