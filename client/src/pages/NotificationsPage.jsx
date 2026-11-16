import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useNotifications } from '../notifications/NotificationContext.jsx';
import { formatDate, todayInputDate } from '../purchases/format.js';

function kindOf(n) {
  if (n.type === 'warranty_expired') return 'expired';
  if (n.type === 'warranty_expiring') return n.threshold === 30 ? 'soon' : 'urgent';
  return 'other';
}

function whenText(createdAt) {
  const created = new Date(createdAt);
  const local = new Date(created.getTime() - created.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10);
  const today = todayInputDate();
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (local === today) return 'dziś';
  if (local === yesterday) return 'wczoraj';
  return formatDate(`${local}T00:00:00.000Z`);
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const onlyUnread = params.get('filter') === 'unread';
  const { unreadCount, setUnreadCount } = useNotifications();

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    setStatus((s) => (s === 'ready' ? 'refreshing' : 'loading'));
    const query = new URLSearchParams({ today: todayInputDate() });
    if (onlyUnread) query.set('filter', 'unread');
    api(`/notifications?${query}`)
      .then((data) => {
        if (ignore) return;
        setItems(data.notifications);
        setUnreadCount(data.unreadCount);
        setStatus('ready');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message);
        setStatus('error');
      });
    return () => {
      ignore = true;
    };
  }, [onlyUnread, refreshKey, setUnreadCount]);

  async function setRead(n, isRead) {
    const data = await api(`/notifications/${n._id}`, { method: 'PUT', body: { isRead } });
    setUnreadCount(data.unreadCount);
    setItems((list) =>
      onlyUnread && isRead ? list.filter((x) => x._id !== n._id) : list.map((x) => (x._id === n._id ? { ...x, isRead } : x)),
    );
  }

  async function open(n) {
    if (!n.isRead) {
      try {
        await setRead(n, true);
      } catch {
        return navigate(`/purchases/${n.purchaseId}`);
      }
    }
    navigate(`/purchases/${n.purchaseId}`);
  }

  async function readAll() {
    setBusy(true);
    try {
      await api('/notifications/read-all', { method: 'PUT' });
      setUnreadCount(0);
      setItems((list) => (onlyUnread ? [] : list.map((x) => ({ ...x, isRead: true }))));
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Powiadomienia</h1>
          <p className="page-sub">
            {unreadCount ? <>Nieprzeczytane: <strong>{unreadCount}</strong></> : 'Wszystko przeczytane'}
          </p>
        </div>
        <button type="button" onClick={readAll} disabled={busy || unreadCount === 0}>
          Oznacz wszystkie jako przeczytane
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Filtr powiadomień">
        {[['', 'Wszystkie'], ['unread', 'Nieprzeczytane']].map(([key, label]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={(params.get('filter') || '') === key}
            className={`tab${(params.get('filter') || '') === key ? ' is-active' : ''}`}
            onClick={() => setParams(key ? { filter: key } : {}, { replace: true })}
          >
            {label}
            {key === 'unread' && unreadCount > 0 && <span className="tab-count tab-count-unread">{unreadCount}</span>}
          </button>
        ))}
      </div>

      {status === 'loading' && <p className="loading">Ładowanie powiadomień…</p>}

      {status === 'error' && (
        <div className="form-error">
          Nie udało się wczytać powiadomień: {error}{' '}
          <button type="button" className="btn-small" onClick={() => setRefreshKey((k) => k + 1)}>Spróbuj ponownie</button>
        </div>
      )}

      {(status === 'ready' || status === 'refreshing') && items.length === 0 && (
        <p className="empty">
          {onlyUnread
            ? 'Nie masz nieprzeczytanych powiadomień.'
            : 'Nie masz jeszcze powiadomień. Pojawią się 30, 7 i 1 dzień przed końcem gwarancji oraz po jej wygaśnięciu.'}
        </p>
      )}

      {(status === 'ready' || status === 'refreshing') && items.length > 0 && (
        <ul className={`notification-list${status === 'refreshing' ? ' is-refreshing' : ''}`}>
          {items.map((n) => (
            <li key={n._id} className={`card notification notification-${kindOf(n)}${n.isRead ? '' : ' is-unread'}`}>
              <button type="button" className="notification-main" onClick={() => open(n)}>
                <span className="notification-dot" aria-hidden="true" />
                <span className="notification-text">
                  <span className="notification-message">{n.message}</span>
                  <span className="notification-meta">
                    {[whenText(n.createdAt), n.addressLabel].filter(Boolean).join(' · ')}
                    {!n.isRead && <span className="sr-only"> · nieprzeczytane</span>}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="btn-small btn-secondary notification-toggle"
                onClick={() => setRead(n, !n.isRead).catch((err) => { setError(err.message); setStatus('error'); })}
              >
                {n.isRead ? 'Oznacz jako nieprzeczytane' : 'Oznacz jako przeczytane'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
