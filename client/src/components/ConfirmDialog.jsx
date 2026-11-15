import Modal from './Modal.jsx';

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Potwierdź',
  cancelLabel = 'Anuluj',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} danger={danger} busy={busy} onClose={onCancel}>
      <div className="dialog-content">{children}</div>
      <div className="dialog-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy} autoFocus>
          {cancelLabel}
        </button>
        <button type="button" className={danger ? 'btn-danger-solid' : ''} onClick={onConfirm} disabled={busy}>
          {busy ? 'Chwileczkę…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
