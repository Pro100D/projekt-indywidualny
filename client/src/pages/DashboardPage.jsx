import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAddresses } from '../addresses/AddressContext.jsx';
import WarrantyBadge from '../purchases/WarrantyBadge.jsx';
import ReminderRow from '../reminders/ReminderRow.jsx';
import { useNotifications } from '../notifications/NotificationContext.jsx';
import { formatDate, formatPrice, purchasesText, todayInputDate } from '../purchases/format.js';

const UPCOMING_LIMIT = 5;

function UpcomingReminders({ addressId }) {
  const { refreshCount } = useNotifications();
  const [reminders, setReminders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    api(`/reminders?addressId=${addressId}&status=upcoming&limit=${UPCOMING_LIMIT}`)
      .then((data) => {
        if (ignore) return;
        setReminders(data.reminders);
        setStatus('ready');
      })
      .catch(() => !ignore && setStatus('error'));
    return () => {
      ignore = true;
    };
  }, [addressId, reloadKey]);

  async function markDone(reminder) {
    setBusyId(reminder._id);
    try {
      await api(`/reminders/${reminder._id}`, { method: 'PUT', body: { isDone: !reminder.isDone } });
      setReloadKey((k) => k + 1);
      refreshCount();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <h2>Najbliższe przypomnienia</h2>
      {status === 'loading' && <p className="loading">Ładowanie…</p>}
      {status === 'error' && <p className="form-error">Nie udało się wczytać przypomnień.</p>}
      {status === 'ready' && reminders.length === 0 && (
        <p className="details-notes">Brak zaplanowanych przypomnień. Dodasz je w szczegółach zakupu.</p>
      )}
      {status === 'ready' && reminders.length > 0 && (
        <ul className="reminder-list">
          {reminders.map((r) => (
            <ReminderRow key={r._id} reminder={r} busy={busyId === r._id} onToggle={markDone} showPurchase />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeAddress, loading: addressesLoading } = useAddresses();
  const [recent, setRecent] = useState({ purchases: [], total: 0 });
  const [status, setStatus] = useState('loading');

  const [expiring, setExpiring] = useState(0);

  const addressId = activeAddress?._id;

  useEffect(() => {
    if (!addressId) return undefined;
    let ignore = false;
    api(`/warranties?status=expiring&addressId=${addressId}&today=${todayInputDate()}`)
      .then((data) => !ignore && setExpiring(data.counts.expiring))
      .catch(() => !ignore && setExpiring(0));
    return () => {
      ignore = true;
    };
  }, [addressId]);

  useEffect(() => {
    if (!addressId) return undefined;
    let ignore = false;
    setStatus('loading');
    api(`/purchases?addressId=${addressId}&sort=added&limit=5`)
      .then((data) => {
        if (ignore) return;
        setRecent(data);
        setStatus('ready');
      })
      .catch(() => !ignore && setStatus('error'));
    return () => {
      ignore = true;
    };
  }, [addressId]);

  return (
    <section>
      <h1>Cześć, {user.name}!</h1>

      {addressesLoading ? (
        <p className="loading">Ładowanie…</p>
      ) : !activeAddress ? (
        <div className="empty">
          <p>Zacznij od dodania adresu — do niego będziesz przypisywać zakupy.</p>
          <Link to="/addresses" className="btn">Dodaj pierwszy adres</Link>
        </div>
      ) : (
        <>
          <div className="page-head">
            <p className="page-sub">
              Adres: <strong>{activeAddress.label}</strong>
              {status === 'ready' && <> · {purchasesText(recent.total)}</>}
            </p>
            <Link to="/purchases/new" className="btn">+ Dodaj zakup</Link>
          </div>

          {expiring > 0 && (
            <Link to="/warranties" className="warning dashboard-banner">
              <strong>{expiring === 1 ? '1 rzecz' : `${expiring} rzeczy`} z kończącą się gwarancją</strong>
              <span>w ciągu 30 dni · Zobacz →</span>
            </Link>
          )}

          <div className="dashboard-grid">
            <UpcomingReminders addressId={addressId} />

            <div className="card">
              <h2>Ostatnio dodane</h2>
              {status === 'loading' && <p className="loading">Ładowanie…</p>}
              {status === 'error' && <p className="form-error">Nie udało się wczytać zakupów.</p>}
              {status === 'ready' && recent.purchases.length === 0 && (
                <p className="details-notes">Pod tym adresem nie ma jeszcze zakupów.</p>
              )}
              {status === 'ready' && recent.purchases.length > 0 && (
                <>
                  <ul className="recent-list">
                    {recent.purchases.map((p) => (
                      <li key={p._id}>
                        <Link to={`/purchases/${p._id}`} className="recent-item">
                          <span>
                            <strong>{p.name}</strong>
                            <small>{formatDate(p.purchaseDate)} · {formatPrice(p.price, p.currency)}</small>
                          </span>
                          <WarrantyBadge warrantyUntil={p.warrantyUntil} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link to="/purchases">Zobacz wszystkie zakupy →</Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
