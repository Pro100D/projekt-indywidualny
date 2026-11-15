import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAddresses } from '../addresses/AddressContext.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import useFlash from '../components/useFlash.js';
import WarrantyBadge from '../purchases/WarrantyBadge.jsx';
import { formatDate, formatPrice, purchasesText } from '../purchases/format.js';

const SORT_OPTIONS = [
  ['date_desc', 'Najnowsze'],
  ['date_asc', 'Najstarsze'],
  ['price_desc', 'Najdroższe'],
  ['price_asc', 'Najtańsze'],
  ['name_asc', 'Nazwa A–Z'],
];

const FILTER_KEYS = ['from', 'to', 'category', 'q', 'sort'];

export default function PurchasesPage() {
  const { activeAddress, reload: reloadAddresses, loading: addressesLoading } = useAddresses();
  const [params, setParams] = useSearchParams();
  const [message, setMessage] = useFlash();

  const [data, setData] = useState({ purchases: [], total: 0, categories: [] });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState(params.get('q') || '');

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'date_desc';
  const addressId = activeAddress?._id;
  const hasFilters = Boolean(from || to || category || q);

  function setParam(key, value) {
    const next = new URLSearchParams(window.location.search);
    if (value && !(key === 'sort' && value === 'date_desc')) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    if (search.trim() === q) return undefined;
    const timer = setTimeout(() => setParam('q', search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!addressId) return undefined;
    let ignore = false;
    const query = new URLSearchParams({ addressId, sort });
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    if (category) query.set('category', category);
    if (q) query.set('search', q);

    setStatus((s) => (s === 'ready' ? 'refreshing' : 'loading'));
    api(`/purchases?${query}`)
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
  }, [addressId, from, to, category, q, sort, refreshKey]);

  function clearFilters() {
    setSearch('');
    const next = new URLSearchParams(window.location.search);
    FILTER_KEYS.filter((k) => k !== 'sort').forEach((k) => next.delete(k));
    setParams(next, { replace: true });
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api(`/purchases/${toDelete._id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: `Usunięto „${toDelete.name}”` });
      setToDelete(null);
      setRefreshKey((k) => k + 1);
      reloadAddresses();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (addressesLoading) return <p className="loading">Ładowanie…</p>;

  if (!activeAddress) {
    return (
      <section>
        <h1>Zakupy</h1>
        <p className="empty">
          Zakupy są przypisane do adresów, a nie masz jeszcze żadnego. <Link to="/addresses">Dodaj pierwszy adres</Link>.
        </p>
      </section>
    );
  }

  const categories = category && !data.categories.includes(category) ? [...data.categories, category] : data.categories;

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Zakupy</h1>
          <p className="page-sub">Adres: <strong>{activeAddress.label}</strong></p>
        </div>
        <Link to="/purchases/new" className="btn">+ Dodaj zakup</Link>
      </div>

      {message && (
        <p className={message.type === 'error' ? 'form-error' : 'form-success'} role="status">{message.text}</p>
      )}

      <div className="card filters" role="search">
        <label className="field filter-search">
          <span>Szukaj</span>
          <input type="search" placeholder="Nazwa, sklep lub numer seryjny" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="field">
          <span>Od</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setParam('from', e.target.value)} />
        </label>
        <label className="field">
          <span>Do</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setParam('to', e.target.value)} />
        </label>
        <label className="field">
          <span>Kategoria</span>
          <select value={category} onChange={(e) => setParam('category', e.target.value)}>
            <option value="">Wszystkie</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Sortuj</span>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <div className="filters-footer">
          <span className="filters-count" aria-live="polite">
            {status === 'ready' || status === 'refreshing'
              ? hasFilters
                ? `Znaleziono: ${data.purchases.length} z ${data.total}`
                : `Razem: ${purchasesText(data.total)}`
              : ''}
          </span>
          <button type="button" className="btn-small btn-secondary" onClick={clearFilters} disabled={!hasFilters}>
            Wyczyść filtry
          </button>
        </div>
      </div>

      {status === 'loading' && <p className="loading">Ładowanie zakupów…</p>}

      {status === 'error' && (
        <div className="form-error">
          Nie udało się wczytać zakupów: {error}{' '}
          <button type="button" className="btn-small" onClick={() => setRefreshKey((k) => k + 1)}>Spróbuj ponownie</button>
        </div>
      )}

      {(status === 'ready' || status === 'refreshing') && data.total === 0 && (
        <div className="empty">
          <p>Brak zakupów pod adresem „{activeAddress.label}”.</p>
          <Link to="/purchases/new" className="btn">Dodaj zakup</Link>
        </div>
      )}

      {(status === 'ready' || status === 'refreshing') && data.total > 0 && data.purchases.length === 0 && (
        <div className="empty">
          <p>Nic nie znaleziono dla wybranych filtrów.</p>
          <button type="button" className="btn-secondary" onClick={clearFilters}>Wyczyść filtry</button>
        </div>
      )}

      {data.purchases.length > 0 && status !== 'loading' && status !== 'error' && (
        <ul className={`purchase-list${status === 'refreshing' ? ' is-refreshing' : ''}`}>
          {data.purchases.map((p) => (
            <li key={p._id} className="card purchase-row">
              <Link to={`/purchases/${p._id}`} className="purchase-main">
                <strong className="purchase-name">{p.name}</strong>
                <span className="purchase-meta">
                  {[p.category, formatDate(p.purchaseDate), p.store].filter(Boolean).join(' · ')}
                </span>
              </Link>
              <span className="purchase-price">{formatPrice(p.price, p.currency)}</span>
              <WarrantyBadge warrantyUntil={p.warrantyUntil} />
              <button type="button" className="btn-small btn-danger" onClick={() => setToDelete(p)}
                aria-label={`Usuń ${p.name}`}>
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        busy={deleting}
        title="Usunąć zakup?"
        confirmLabel="Usuń zakup"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && (
          <>
            <p>
              Zakup <strong>„{toDelete.name}”</strong> zostanie usunięty razem z dokumentami i przypomnieniami.
            </p>
            <p>Tej operacji nie można cofnąć.</p>
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
