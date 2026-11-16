import { daysText, daysUntil, formatDate } from '../purchases/format.js';

export const REMINDER_TYPES = [
  ['service', 'Serwis'],
  ['filter', 'Wymiana filtra'],
  ['insurance', 'Ubezpieczenie'],
  ['other', 'Inne'],
];

export function typeLabel(type) {
  return REMINDER_TYPES.find(([key]) => key === type)?.[1] || 'Inne';
}

export function dueStatus(reminder) {
  const date = formatDate(reminder.dueDate);
  if (reminder.isDone) return { key: 'done', label: `wykonane · ${date}` };
  const days = daysUntil(reminder.dueDate);
  if (days < 0) return { key: 'overdue', label: `po terminie (${daysText(-days)}) · ${date}` };
  if (days === 0) return { key: 'today', label: `dziś · ${date}` };
  if (days === 1) return { key: 'soon', label: `jutro · ${date}` };
  if (days <= 7) return { key: 'soon', label: `za ${daysText(days)} · ${date}` };
  return { key: 'later', label: `za ${daysText(days)} · ${date}` };
}
