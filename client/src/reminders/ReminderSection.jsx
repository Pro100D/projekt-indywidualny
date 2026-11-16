import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Modal from '../components/Modal.jsx';
import { useNotifications } from '../notifications/NotificationContext.jsx';
import ReminderFields from './ReminderFields.jsx';
import ReminderRow from './ReminderRow.jsx';

const EMPTY = { title: '', type: 'service', dueDate: '' };

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Podaj, o czym przypomnieć';
  if (!values.dueDate) errors.dueDate = 'Podaj termin';
  return errors;
}

function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  function onChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  }
  return { values, setValues, errors, setErrors, onChange };
}

export default function ReminderSection({ purchaseId }) {
  const { refreshCount } = useNotifications();
  const [reminders, setReminders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const addForm = useForm(EMPTY);
  const [adding, setAdding] = useState(false);

  const editForm = useForm(EMPTY);
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const data = await api(`/reminders?purchaseId=${purchaseId}`);
      setReminders(data.reminders);
      setStatus('ready');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setStatus('error');
    }
  }

  useEffect(() => {
    setStatus('loading');
    load();
  }, [purchaseId]);

  async function onAdd(e) {
    e.preventDefault();
    const found = validate(addForm.values);
    if (Object.keys(found).length) return addForm.setErrors(found);
    setAdding(true);
    setMessage(null);
    try {
      await api('/reminders', { method: 'POST', body: { ...addForm.values, purchaseId } });
      addForm.setValues(EMPTY);
      await load();
      refreshCount();
      setMessage({ type: 'success', text: 'Dodano przypomnienie' });
    } catch (err) {
      if (Object.keys(err.fields).length) addForm.setErrors(err.fields);
      else setMessage({ type: 'error', text: err.message });
    } finally {
      setAdding(false);
    }
  }

  async function toggle(reminder) {
    setBusyId(reminder._id);
    try {
      await api(`/reminders/${reminder._id}`, { method: 'PUT', body: { isDone: !reminder.isDone } });
      await load();
      refreshCount();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(reminder) {
    editForm.setValues({ title: reminder.title, type: reminder.type, dueDate: String(reminder.dueDate).slice(0, 10) });
    editForm.setErrors({});
    setEditError('');
    setEditing(reminder);
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    const found = validate(editForm.values);
    if (Object.keys(found).length) return editForm.setErrors(found);
    setSaving(true);
    try {
      await api(`/reminders/${editing._id}`, { method: 'PUT', body: editForm.values });
      setEditing(null);
      await load();
      refreshCount();
      setMessage({ type: 'success', text: 'Zapisano przypomnienie' });
    } catch (err) {
      if (Object.keys(err.fields).length) editForm.setErrors(err.fields);
      else setEditError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api(`/reminders/${toDelete._id}`, { method: 'DELETE' });
      setToDelete(null);
      await load();
      refreshCount();
      setMessage({ type: 'success', text: 'Usunięto przypomnienie' });
    } catch (err) {
      setToDelete(null);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
    }
  }

  const open = reminders.filter((r) => !r.isDone);
  const done = reminders.filter((r) => r.isDone);

  return (
    <div className="card reminders">
      <h2>Przypomnienia</h2>

      {status === 'loading' && <p className="loading">Ładowanie…</p>}

      {status === 'ready' && reminders.length === 0 && (
        <p className="details-notes">Brak przypomnień. Dodaj np. serwis albo wymianę filtra.</p>
      )}

      {open.length > 0 && (
        <ul className="reminder-list">
          {open.map((r) => (
            <ReminderRow key={r._id} reminder={r} busy={busyId === r._id}
              onToggle={toggle} onEdit={startEdit} onDelete={setToDelete} />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <details className="reminders-done">
          <summary>Wykonane ({done.length})</summary>
          <ul className="reminder-list">
            {done.map((r) => (
              <ReminderRow key={r._id} reminder={r} busy={busyId === r._id}
                onToggle={toggle} onEdit={startEdit} onDelete={setToDelete} />
            ))}
          </ul>
        </details>
      )}

      {message && (
        <p className={message.type === 'error' ? 'form-error' : 'form-success'} role="status">{message.text}</p>
      )}

      <form className="form reminder-add" onSubmit={onAdd} noValidate>
        <h3>Nowe przypomnienie</h3>
        <ReminderFields values={addForm.values} errors={addForm.errors} onChange={addForm.onChange} />
        <div className="form-actions">
          <button type="submit" className="btn-small" disabled={adding}>{adding ? 'Dodawanie…' : 'Dodaj przypomnienie'}</button>
        </div>
      </form>

      <Modal open={Boolean(editing)} title="Edytuj przypomnienie" busy={saving} closeOnBackdrop={false}
        onClose={() => setEditing(null)}>
        <form className="form" onSubmit={onSaveEdit} noValidate>
          <ReminderFields values={editForm.values} errors={editForm.errors} onChange={editForm.onChange} autoFocus />
          {editError && <p className="form-error" role="alert">{editError}</p>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Anuluj</button>
            <button type="submit" disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        busy={deleting}
        title="Usunąć przypomnienie?"
        confirmLabel="Usuń"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && <p>Przypomnienie <strong>„{toDelete.title}”</strong> zostanie usunięte.</p>}
      </ConfirmDialog>
    </div>
  );
}
