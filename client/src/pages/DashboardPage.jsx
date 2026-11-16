import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAddresses } from '../addresses/AddressContext.jsx';
import WarrantyBadge from '../purchases/WarrantyBadge.jsx';
import { formatDate, formatPrice, purchasesText, todayInputDate } from '../purchases/format.js';

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
        </>
      )}
    </section>
  );
}
