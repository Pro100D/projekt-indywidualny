import { useEffect, useRef } from 'react';

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
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function onDialogCancel(e) {
    e.preventDefault();
    if (!busy) onCancel();
  }

  function onBackdropClick(e) {
    if (e.target === ref.current && !busy) onCancel();
  }

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={onDialogCancel}
      onClick={onBackdropClick}
    >
      {open && (
        <div className="dialog-body">
          <h2 id="dialog-title" className={danger ? 'dialog-title is-danger' : 'dialog-title'}>{title}</h2>
          <div className="dialog-content">{children}</div>
          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy} autoFocus>
              {cancelLabel}
            </button>
            <button type="button" className={danger ? 'btn-danger-solid' : ''} onClick={onConfirm} disabled={busy}>
              {busy ? 'Chwileczkę…' : confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
