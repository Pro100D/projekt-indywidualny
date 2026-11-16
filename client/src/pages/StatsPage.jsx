import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAddresses } from '../addresses/AddressContext.jsx';
import CategoryChart from '../stats/CategoryChart.jsx';
import { formatDate, formatPrice, todayInputDate } from '../purchases/format.js';

const PERIODS = [
  ['month', 'Ten miesiąc'],
  ['3m', 'Ostatnie 3 miesiące'],
  ['year', 'Ten rok'],
  ['lastyear', 'Poprzedni rok'],
  ['all', 'Cały czas'],
  ['custom', 'Własny okres'],
];

function shiftDay(day, days) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function rangeFor(period, params) {
  const today = todayInputDate();
  const [y, m] = today.split('-');
  if (period === 'month') return { from: `${y}-${m}-01`, to: today };
  if (period === '3m') {
    const d = new Date(Date.UTC(Number(y), Number(m) - 4, Number(today.slice(8)) + 1));
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  if (period === 'lastyear') return { from: `${Number(y) - 1}-01-01`, to: `${Number(y) - 1}-12-31` };
  if (period === 'all') return { from: '', to: '' };
  if (period === 'custom') return { from: params.get('from') || '', to: params.get('to') || '' };
  return { from: `${y}-01-01`, to: today };
}

function itemsText(n) {
  return n === 1 ? '1 rzecz' : `${n} rzeczy`;
}

function periodText(from, to) {
  if (!from && !to) return 'cały czas';
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  return from ? `od ${formatDate(from)}` : `do ${formatDate(to)}`;
}

export default function StatsPage() {
  const { activeAddress, loading: addressesLoading } = useAddresses();
  const [params, setParams] = useSearchParams();
  const period = PERIODS.some(([k]) => k === params.get('period')) ? params.get('period') : 'year';
  const allAddresses = params.get('all') === '1';
  const { from, to } = rangeFor(period, params);

  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const addressId = allAddresses ? '' : activeAddress?._id;

  function update(changes) {
    const next = new URLSearchParams(window.location.search);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  }

  function choosePeriod(key) {
    if (key === 'custom') update({ period: 'custom', from: from || shiftDay(todayInputDate(), -30), to: to || todayInputDate() });
    else update({ period: key === 'year' ? '' : key, from: '', to: '' });
  }

  useEffect(() => {
    if (addressesLoading || (!allAddresses && !addressId)) return undefined;
    let ignore = false;
    const query = new URLSearchParams({ today: todayInputDate() });
    if (addressId) query.set('addressId', addressId);
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    setStatus((s) => (s === 'ready' ? 'refreshing' : 'loading'));
    api(`/stats/summary?${query}`)
      .then((result) => {
        if (ignore) return;
        setData(result);
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
  }, [addressId, allAddresses, addressesLoading, from, to, refreshKey]);

  if (addressesLoading) return <p className="loading">Ładowanie…</p>;

  if (!activeAddress) {
    return (
      <section>
        <h1>Statystyki</h1>
        <p className="empty">
          Nie masz jeszcze adresów ani zakupów. <Link to="/addresses">Dodaj pierwszy adres</Link>.
        </p>
      </section>
    );
  }

  const [main, ...others] = data?.totals || [];
  const shownCurrency = data?.totals.some((t) => t.currency === currency) ? currency : main?.currency || 'PLN';
  const rows = (data?.categories || []).filter((c) => c.currency === shownCurrency);

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Statystyki</h1>
          <p className="page-sub">
            {allAddresses ? 'Wszystkie adresy' : <>Adres: <strong>{activeAddress.label}</strong></>} · {periodText(from, to)}
          </p>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={allAddresses} onChange={(e) => update({ all: e.target.checked ? '1' : '' })} />
          Pokaż wszystkie adresy
        </label>
      </div>

      <div className="card period-bar">
        <div className="period-chips" role="group" aria-label="Okres">
          {PERIODS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={period === key}
              className={`chip${period === key ? ' is-active' : ''}`} onClick={() => choosePeriod(key)}>
              {label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="period-custom">
            <label className="field">
              <span>Od</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => update({ from: e.target.value })} />
            </label>
            <label className="field">
              <span>Do</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => update({ to: e.target.value })} />
            </label>
          </div>
        )}
      </div>

      {status === 'loading' && <p className="loading">Ładowanie statystyk…</p>}

      {status === 'error' && (
        <div className="form-error">
          Nie udało się wczytać statystyk: {error}{' '}
          <button type="button" className="btn-small" onClick={() => setRefreshKey((k) => k + 1)}>Spróbuj ponownie</button>
        </div>
      )}

      {data && status !== 'loading' && status !== 'error' && (
        <div className={status === 'refreshing' ? 'is-refreshing' : ''}>
          <div className="stat-tiles">
            <div className="card stat-tile">
              <span className="stat-label">Wydatki</span>
              <span className="stat-value">{main ? formatPrice(main.sum, main.currency) : formatPrice(0, 'PLN')}</span>
              {others.length > 0 && (
                <span className="stat-extra">
                  {others.map((t) => `+ ${formatPrice(t.sum, t.currency)}`).join(' ')}
                </span>
              )}
            </div>
            <div className="card stat-tile">
              <span className="stat-label">Kupione rzeczy</span>
              <span className="stat-value">{data.count}</span>
              <span className="stat-extra">w wybranym okresie</span>
            </div>
            <Link to={`/warranties${allAddresses ? '?all=1' : ''}`} className="card stat-tile stat-tile-link">
              <span className="stat-label">Kończące się gwarancje</span>
              <span className="stat-value">{data.expiringWarranties}</span>
              <span className="stat-extra">w ciągu 30 dni · zobacz →</span>
            </Link>
          </div>

          <div className="card chart-card">
            <div className="chart-head">
              <h2>Wydatki według kategorii</h2>
              {data.totals.length > 1 && (
                <div className="period-chips" role="group" aria-label="Waluta">
                  {data.totals.map((t) => (
                    <button key={t.currency} type="button" aria-pressed={shownCurrency === t.currency}
                      className={`chip${shownCurrency === t.currency ? ' is-active' : ''}`} onClick={() => setCurrency(t.currency)}>
                      {t.currency}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {data.totals.length > 1 && (
              <p className="chart-note">Każda waluta ma osobny wykres — kwot w różnych walutach nie sumujemy.</p>
            )}

            {data.count === 0 ? (
              <div className="empty">
                <p>Brak zakupów w wybranym okresie.</p>
                <Link to="/purchases/new" className="btn">Dodaj zakup</Link>
              </div>
            ) : (
              <>
                <p className="chart-sub">
                  {itemsText(rows.reduce((n, r) => n + r.count, 0))} · razem {formatPrice(rows.reduce((s, r) => s + r.sum, 0), shownCurrency)}
                </p>
                <CategoryChart rows={rows} currency={shownCurrency} />
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
