import { runWarrantyCheck, todayUtc } from './warrantyNotifications.js';
import { runReminderCheck } from './reminderNotifications.js';

const DAY = 24 * 60 * 60 * 1000;

export async function runAllChecks({ userId, today = todayUtc() } = {}) {
  const [warranties, reminders] = await Promise.all([
    runWarrantyCheck({ userId, today }),
    runReminderCheck({ userId, today }),
  ]);
  return { warranties, reminders };
}

export function startScheduler() {
  const run = () =>
    runAllChecks()
      .then(({ warranties, reminders }) =>
        console.log(`Codzienne sprawdzanie: nowe powiadomienia — gwarancje: ${warranties}, przypomnienia: ${reminders}`),
      )
      .catch((err) => console.error('Błąd codziennego sprawdzania:', err.message));

  run();
  return setInterval(run, DAY);
}
