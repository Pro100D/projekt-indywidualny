import Reminder from '../models/Reminder.js';
import Notification from '../models/Notification.js';
import { todayUtc } from './warrantyNotifications.js';

const DAY = 24 * 60 * 60 * 1000;
const NOTIFY_DAYS_BEFORE = 1;
const OVERDUE_CATCH_UP_DAYS = 7;

function formatDay(date) {
  return date.toLocaleDateString('pl-PL', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
}

function buildMessage(reminder, daysLeft) {
  const what = `„${reminder.title}”${reminder.purchaseName ? ` (${reminder.purchaseName})` : ''}`;
  if (daysLeft < 0) return `Minął termin przypomnienia ${what}: ${formatDay(reminder.dueDate)}.`;
  if (daysLeft === 0) return `Przypomnienie ${what} — termin dziś.`;
  return `Przypomnienie ${what} — termin jutro (${formatDay(reminder.dueDate)}).`;
}

export async function runReminderCheck({ userId, today = todayUtc() } = {}) {
  const filter = {
    isDone: false,
    purchaseId: { $ne: null },
    dueDate: {
      $gte: new Date(today.getTime() - OVERDUE_CATCH_UP_DAYS * DAY),
      $lte: new Date(today.getTime() + NOTIFY_DAYS_BEFORE * DAY),
    },
  };
  if (userId) filter.userId = userId;

  const reminders = await Reminder.find(filter).populate('purchaseId', 'name').lean();
  let created = 0;

  for (const reminder of reminders) {
    if (!reminder.purchaseId) continue;
    const daysLeft = Math.round((reminder.dueDate.getTime() - today.getTime()) / DAY);
    const message = buildMessage({ ...reminder, purchaseName: reminder.purchaseId.name }, daysLeft);
    try {
      const result = await Notification.updateOne(
        { reminderId: reminder._id, dueDate: reminder.dueDate },
        {
          $setOnInsert: {
            userId: reminder.userId,
            purchaseId: reminder.purchaseId._id,
            reminderId: reminder._id,
            dueDate: reminder.dueDate,
            type: 'reminder',
            message,
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

export async function forgetOldReminder(reminder) {
  await Notification.deleteMany({ reminderId: reminder._id, dueDate: { $ne: reminder.dueDate } });
  if (reminder.isDone) {
    await Notification.updateMany({ reminderId: reminder._id, isRead: false }, { isRead: true });
  }
}
