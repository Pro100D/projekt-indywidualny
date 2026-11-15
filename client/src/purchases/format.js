export const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'];

export const DEFAULT_CATEGORIES = ['AGD', 'Elektronika', 'Meble', 'Narzędzia', 'Ogród', 'Sport', 'Ubrania', 'Inne'];

const DAY = 24 * 60 * 60 * 1000;

function isFew(n) {
  const lastTwo = n % 100;
  const last = n % 10;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14);
}

export function purchasesText(n) {
  if (n === 1) return '1 zakup';
  return isFew(n) ? `${n} zakupy` : `${n} zakupów`;
}

export function belongsText(n) {
  return isFew(n) ? 'należą' : 'należy';
}

export function daysText(n) {
  return n === 1 ? '1 dzień' : `${n} dni`;
}

export function toInputDate(value) {
  return value ? String(value).slice(0, 10) : '';
}

export function todayInputDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pl-PL', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatPrice(price, currency = 'PLN') {
  if (price == null) return '—';
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(price);
}

export const EXPIRING_DAYS = 30;

export function daysUntil(day) {
  const today = new Date(`${todayInputDate()}T00:00:00.000Z`).getTime();
  return Math.round((new Date(day).getTime() - today) / DAY);
}

export function warrantyStatus(warrantyUntil) {
  if (!warrantyUntil) return { key: 'none', label: 'brak gwarancji', title: 'Ta rzecz nie ma gwarancji' };
  const days = daysUntil(warrantyUntil);
  const title = `Koniec gwarancji: ${formatDate(warrantyUntil)}`;
  if (days < 0) return { key: 'expired', label: 'wygasła', title, days };
  if (days === 0) return { key: 'expiring', label: 'kończy się dziś', title, days };
  if (days === 1) return { key: 'expiring', label: 'kończy się jutro', title, days };
  if (days <= EXPIRING_DAYS) return { key: 'expiring', label: `kończy się za ${daysText(days)}`, title, days };
  return { key: 'active', label: `jeszcze ${daysText(days)}`, title, days };
}
