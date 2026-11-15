import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAddresses } from '../addresses/AddressContext.jsx';
import WarrantyBadge from '../purchases/WarrantyBadge.jsx';
import { formatDate, formatPrice, todayInputDate } from '../purchases/format.js';

const TABS = [
  { key: 'active', label: 'Aktywne', empty: 'Brak rzeczy z gwarancją dłuższą niż 30 dni.' },
  { key: 'expiring', label: 'Kończące się', empty: 'Żadna gwarancja nie kończy się w ciągu 30 dni.' },
  { key: 'expired', label: 'Wygasłe', empty: 'Brak rzeczy z wygasłą gwarancją.' },
];

function itemsText(n) {
  return n === 1 ? '1 rzecz' : `${n} rzeczy`;
}

function usedPercent(purchaseDate, warrantyUntil) {
  const start = new Date(purchaseDate).getTime();
  const end = new Date(warrantyUntil).getTime();
  const now = new Date(`${todayInputDate()}T00:00:00.000Z`).getTime();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

export default function WarrantiesPage() {
  const { activeAddress, loading: addressesLoading } = useAddresses();
  const [params, setParams] = useSearchParams();
  const status = TABS.some((t) => t.key === params.get('status')) ? params.get('status') : 'expiring';
  const allAddresses = params.get('all') === '1';

  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const addressId = allAddresses ? '' : activeAddress?._id;

  function setParam(key, value) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  useEffect(() => {
    if (addressesLoading || (!allAddresses && !addressId)) return undefined;
    let ignore = false;
    const query = new URLSearchParams({ status, today: todayInputDate() });
    if (addressId) query.set('addressId', addressId);
    setState((s) => (s === 'ready' ? 'refreshing' : 'loading'));
    api(`/warranties?${query}`)
      .then((result) => {
        if (ignore) return;
        setData(result);
        setState('ready');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message);
        setState('error');
      });
    return () => {
      ignore = true;
    };
  }, [status, addressId, allAddresses, addressesLoading, refreshKey]);

  if (addressesLoading) return <p className="loading">Ładowanie…</p>;

  if (!activeAddress) {
    return (
      <section>
        <h1>Gwarancje</h1>
        <p className="empty">
          Nie masz jeszcze adresów ani zakupów. <Link to="/addresses">Dodaj pierwszy adres</Link>.
        </p>
      </section>
    );
  }

  const tab = TABS.find((t) => t.key === status);
  const counts = data?.counts;

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Gwarancje</h1>
          <p className="page-sub">
            {allAddresses ? <>Wszystkie adresy</> : <>Adres: <strong>{activeAddress.label}</strong></>}
            {counts && counts.none > 0 && <> · bez gwarancji: {itemsText(counts.none)}</>}
          </p>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={allAddresses} onChange={(e) => setParam('all', e.target.checked ? '1' : '')} />
          Pokaż wszystkie adresy
        </label>
      </div>

      <div className="tabs" role="tablist" aria-label="Status gwarancji">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={status === t.key}
            className={`tab tab-${t.key}${status === t.key ? ' is-active' : ''}`}
            onClick={() => setParam('status', t.key === 'expiring' ? '' : t.key)}
          >
            {t.label}
            {counts && <span className="tab-count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={tab.label}>
        {state === 'loading' && <p className="loading">Ładowanie gwarancji…</p>}

        {state === 'error' && (
          <div className="form-error">
            Nie udało się wczytać gwarancji: {error}{' '}
            <button type="button" className="btn-small" onClick={() => setRefreshKey((k) => k + 1)}>Spróbuj ponownie</button>
          </div>
        )}

        {(state === 'ready' || state === 'refreshing') && data.purchases.length === 0 && (
          <p className="empty">{tab.empty}</p>
        )}

        {(state === 'ready' || state === 'refreshing') && data.purchases.length > 0 && (
          <ul className={`warranty-list${state === 'refreshing' ? ' is-refreshing' : ''}`}>
            {data.purchases.map((p) => {
              const used = usedPercent(p.purchaseDate, p.warrantyUntil);
              return (
                <li key={p._id} className={`card warranty-item warranty-item-${status}`}>
                  <div className="warranty-item-head">
                    <Link to={`/purchases/${p._id}`} className="purchase-main">
                      <strong className="purchase-name">{p.name}</strong>
                      <span className="purchase-meta">
                        {[allAddresses && p.addressLabel, p.category, formatPrice(p.price, p.currency)].filter(Boolean).join(' · ')}
                      </span>
                    </Link>
                    <WarrantyBadge warrantyUntil={p.warrantyUntil} />
                  </div>
                  <div className="warranty-progress" role="img"
                    aria-label={`Minęło ${used}% okresu gwarancji`}>
                    <span style={{ width: `${used}%` }} />
                  </div>
                  <div className="warranty-dates">
                    <span>Zakup: {formatDate(p.purchaseDate)}</span>
                    <span>Koniec gwarancji: <strong>{formatDate(p.warrantyUntil)}</strong></span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
