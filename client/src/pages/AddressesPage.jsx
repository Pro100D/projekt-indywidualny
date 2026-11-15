import { useState } from 'react';
import { api } from '../api/client.js';
import { useAddresses } from '../addresses/AddressContext.jsx';
import AddressFields from '../addresses/AddressFields.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Modal from '../components/Modal.jsx';

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

function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  }

  return { values, setValues, errors, setErrors, onChange };
}

export default function AddressesPage() {
  const { addresses, activeAddress, reload, loading, error: loadError } = useAddresses();
  const [message, setMessage] = useState(null);

  const addForm = useFormState(EMPTY);
  const [adding, setAdding] = useState(false);

  const editForm = useFormState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function onAdd(e) {
    e.preventDefault();
    setAdding(true);
    setMessage(null);
    try {
      await api('/addresses', { method: 'POST', body: addForm.values });
      await reload();
      setMessage({ type: 'success', text: `Dodano adres „${addForm.values.label.trim()}”` });
      addForm.setValues(EMPTY);
    } catch (err) {
      if (Object.keys(err.fields).length) addForm.setErrors(err.fields);
      else setMessage({ type: 'error', text: err.message });
    } finally {
      setAdding(false);
    }
  }

  function startEdit(address) {
    editForm.setValues({
      label: address.label,
      street: address.street || '',
      city: address.city || '',
      isDefault: address.isDefault,
    });
    editForm.setErrors({});
    setEditError('');
    setMessage(null);
    setEditing(address);
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setEditError('');
    try {
      await api(`/addresses/${editing._id}`, { method: 'PUT', body: editForm.values });
      await reload();
      setMessage({ type: 'success', text: `Zapisano zmiany w adresie „${editForm.values.label.trim()}”` });
      setEditing(null);
    } catch (err) {
      if (Object.keys(err.fields).length) editForm.setErrors(err.fields);
      else setEditError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(address) {
    setMessage(null);
    try {
      await api(`/addresses/${address._id}`, { method: 'PUT', body: { isDefault: true } });
      await reload();
      setMessage({ type: 'success', text: `„${address.label}” jest teraz adresem domyślnym` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function confirmDelete() {
    const address = toDelete;
    const withPurchases = address.purchaseCount > 0;
    setDeleting(true);
    setMessage(null);
    try {
      await api(`/addresses/${address._id}${withPurchases ? '?withPurchases=true' : ''}`, { method: 'DELETE' });
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

      <form className="form card address-form" onSubmit={onAdd} noValidate>
        <h2>Nowy adres</h2>
        <AddressFields values={addForm.values} errors={addForm.errors} onChange={addForm.onChange} />
        <div className="form-actions">
          <button type="submit" disabled={adding}>{adding ? 'Dodawanie…' : 'Dodaj adres'}</button>
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

      <Modal
        open={Boolean(editing)}
        title="Edytuj adres"
        busy={saving}
        closeOnBackdrop={false}
        onClose={() => setEditing(null)}
      >
        <form className="form" onSubmit={onSaveEdit} noValidate>
          <AddressFields
            values={editForm.values}
            errors={editForm.errors}
            onChange={editForm.onChange}
            showDefault={!editing?.isDefault}
            autoFocus
          />
          {editError && <p className="form-error" role="alert">{editError}</p>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)} disabled={saving}>
              Anuluj
            </button>
            <button type="submit" disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz zmiany'}</button>
          </div>
        </form>
      </Modal>

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
