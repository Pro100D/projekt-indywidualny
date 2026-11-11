import { useState } from 'react';
import { api } from '../api/client.js';
import { useAddresses } from '../addresses/AddressContext.jsx';
import FormField from '../components/FormField.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const EMPTY = { label: '', street: '', city: '', isDefault: false };

function isFew(n) {
  const lastTwo = n % 100;
  const last = n % 10;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14);
}

function purchasesText(n) {
  if (n === 1) return '1 zakup';
  return isFew(n) ? `${n} zakupy` : `${n} zakupów`;
}

function belongsText(n) {
  return isFew(n) ? 'należą' : 'należy';
}

export default function AddressesPage() {
  const { addresses, activeAddress, reload, loading, error: loadError } = useAddresses();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [sending, setSending] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setFieldErrors({ ...fieldErrors, [name]: undefined });
  };

  function startEdit(address) {
    setEditingId(address._id);
    setForm({ label: address.label, street: address.street || '', city: address.city || '', isDefault: address.isDefault });
    setFieldErrors({});
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setFieldErrors({});
  }

  async function run(action, successText) {
    setSending(true);
    setMessage(null);
    try {
      await action();
      await reload();
      if (successText) setMessage({ type: 'success', text: successText });
      return true;
    } catch (err) {
      if (Object.keys(err.fields).length) setFieldErrors(err.fields);
      else setMessage({ type: 'error', text: err.message });
      return false;
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const ok = editingId
      ? await run(() => api(`/addresses/${editingId}`, { method: 'PUT', body: form }), 'Zapisano zmiany')
      : await run(() => api('/addresses', { method: 'POST', body: form }), 'Dodano adres');
    if (ok) cancelEdit();
  }

  function makeDefault(address) {
    run(() => api(`/addresses/${address._id}`, { method: 'PUT', body: { isDefault: true } }),
      `„${address.label}” jest teraz adresem domyślnym`);
  }

  async function confirmDelete() {
    const address = toDelete;
    const withPurchases = address.purchaseCount > 0;
    setDeleting(true);
    setMessage(null);
    try {
      await api(`/addresses/${address._id}${withPurchases ? '?withPurchases=true' : ''}`, { method: 'DELETE' });
      if (editingId === address._id) cancelEdit();
      setToDelete(null);
      await reload();
      setMessage({
        type: 'success',
        text: withPurchases
          ? `Usunięto adres „${address.label}” i ${purchasesText(address.purchaseCount)}`
          : `Usunięto adres „${address.label}”`,
      });
    } catch (err) {
      if (err.status === 409 && err.purchaseCount) {
        setToDelete({ ...address, purchaseCount: err.purchaseCount });
      } else {
        setToDelete(null);
        setMessage({ type: 'error', text: err.message });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <h1>Adresy</h1>

      <form className="form card address-form" onSubmit={onSubmit} noValidate>
        <h2>{editingId ? 'Edytuj adres' : 'Nowy adres'}</h2>
        <FormField label="Nazwa" name="label" placeholder="np. Mieszkanie Warszawa"
          value={form.label} onChange={onChange} error={fieldErrors.label} />
        <div className="form-row">
          <FormField label="Ulica" name="street" placeholder="np. Marszałkowska 10/5"
            value={form.street} onChange={onChange} />
          <FormField label="Miasto" name="city" placeholder="np. Warszawa"
            value={form.city} onChange={onChange} />
        </div>
        {!(editingId && addresses.find((a) => a._id === editingId)?.isDefault) && (
          <label className="checkbox">
            <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={onChange} />
            Ustaw jako adres domyślny
          </label>
        )}
        <div className="form-actions">
          <button type="submit" disabled={sending}>{editingId ? 'Zapisz zmiany' : 'Dodaj adres'}</button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={cancelEdit}>Anuluj</button>
          )}
        </div>
      </form>

      {message && (
        <p className={message.type === 'error' ? 'form-error' : 'form-success'} role="status">{message.text}</p>
      )}
      {loadError && <p className="form-error">{loadError}</p>}

      {loading ? (
        <p className="loading">Ładowanie…</p>
      ) : addresses.length === 0 ? (
        <p className="empty">Nie masz jeszcze żadnego adresu. Dodaj pierwszy — zostanie adresem domyślnym.</p>
      ) : (
        <ul className="address-list">
          {addresses.map((address) => (
            <li key={address._id} className={`card address-card${address._id === activeAddress?._id ? ' is-active' : ''}`}>
              <div className="address-title">
                <strong>{address.label}</strong>
                {address.isDefault && <span className="badge">domyślny</span>}
              </div>
              <p className="address-line">
                {[address.street, address.city].filter(Boolean).join(', ') || 'brak ulicy i miasta'}
              </p>
              <p className="address-count">
                {address.purchaseCount ? purchasesText(address.purchaseCount) : 'brak zakupów'}
              </p>
              <div className="card-actions">
                <button type="button" className="btn-small" onClick={() => startEdit(address)}>Edytuj</button>
                {!address.isDefault && (
                  <button type="button" className="btn-small btn-secondary" onClick={() => makeDefault(address)}>
                    Ustaw jako domyślny
                  </button>
                )}
                <button type="button" className="btn-small btn-danger" onClick={() => setToDelete(address)}>Usuń</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        busy={deleting}
        title={toDelete?.purchaseCount ? 'Usunąć adres razem z zakupami?' : 'Usunąć adres?'}
        confirmLabel={toDelete?.purchaseCount ? 'Usuń adres i zakupy' : 'Usuń adres'}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && (
          <>
            <p>
              Adres <strong>„{toDelete.label}”</strong> zostanie usunięty.
            </p>
            {toDelete.purchaseCount > 0 && (
              <p className="dialog-warning">
                Do tego adresu {belongsText(toDelete.purchaseCount)}{' '}
                <strong>{purchasesText(toDelete.purchaseCount)}</strong>.{' '}
                {toDelete.purchaseCount === 1 ? 'Zostanie usunięty' : 'Zostaną usunięte'} razem z adresem — wraz
                z dokumentami i przypomnieniami.
              </p>
            )}
            <p>Tej operacji nie można cofnąć.</p>
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
