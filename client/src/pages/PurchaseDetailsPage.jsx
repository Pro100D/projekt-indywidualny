import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAddresses } from '../addresses/AddressContext.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import useFlash from '../components/useFlash.js';
import WarrantyBadge from '../purchases/WarrantyBadge.jsx';
import { formatDate, formatPrice } from '../purchases/format.js';

export default function PurchaseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reload: reloadAddresses } = useAddresses();
  const [message] = useFlash();

  const [purchase, setPurchase] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    api(`/purchases/${id}`)
      .then((data) => {
        if (ignore) return;
        setPurchase(data.purchase);
        setStatus('ready');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.status === 404 ? 'Nie znaleziono tego zakupu.' : err.message);
        setStatus('error');
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await api(`/purchases/${id}`, { method: 'DELETE' });
      await reloadAddresses();
      navigate('/purchases', { replace: true, state: { flash: { type: 'success', text: `Usunięto „${purchase.name}”` } } });
    } catch (err) {
      setDeleteError(err.message);
      setConfirmOpen(false);
      setDeleting(false);
    }
  }

  if (status === 'loading') return <p className="loading">Ładowanie…</p>;

  if (status === 'error') {
    return (
      <section>
        <h1>Szczegóły zakupu</h1>
        <p className="form-error">{error}</p>
        <Link to="/purchases">← Wróć do listy zakupów</Link>
      </section>
    );
  }

  const rows = [
    ['Kategoria', purchase.category],
    ['Data zakupu', formatDate(purchase.purchaseDate)],
    ['Cena', formatPrice(purchase.price, purchase.currency)],
    ['Adres', purchase.address?.label],
    ['Sklep', purchase.store],
    ['Numer seryjny', purchase.serialNumber],
    ['Koniec gwarancji', purchase.warrantyUntil ? formatDate(purchase.warrantyUntil) : 'brak gwarancji'],
  ];

  return (
    <section>
      <Link to="/purchases" className="back-link">← Wróć do listy</Link>

      <div className="page-head">
        <div>
          <h1>{purchase.name}</h1>
          <WarrantyBadge warrantyUntil={purchase.warrantyUntil} />
        </div>
        <div className="form-actions">
          <Link to={`/purchases/${id}/edit`} className="btn">Edytuj</Link>
          <button type="button" className="btn-danger" onClick={() => setConfirmOpen(true)}>Usuń</button>
        </div>
      </div>

      {message && (
        <p className={message.type === 'error' ? 'form-error' : 'form-success'} role="status">{message.text}</p>
      )}
      {deleteError && <p className="form-error">{deleteError}</p>}

      <div className="details-grid">
        <dl className="card details">
          {rows.map(([label, value]) => (
            <div key={label} className="details-row">
              <dt>{label}</dt>
              <dd>{value || '—'}</dd>
            </div>
          ))}
        </dl>

        <div className="details-side">
          <div className="card">
            <h2>Notatki</h2>
            <p className="details-notes">{purchase.notes || 'Brak notatek.'}</p>
          </div>
          <div className="card">
            <h2>Dokumenty</h2>
            {purchase.documents?.length ? (
              <ul className="doc-list">
                {purchase.documents.map((d) => <li key={d._id}>{d.fileName}</li>)}
              </ul>
            ) : (
              <p className="details-notes">Brak dokumentów.</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        danger
        busy={deleting}
        title="Usunąć zakup?"
        confirmLabel="Usuń zakup"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>
          Zakup <strong>„{purchase.name}”</strong> zostanie usunięty razem z dokumentami i przypomnieniami.
        </p>
        <p>Tej operacji nie można cofnąć.</p>
      </ConfirmDialog>
    </section>
  );
}
