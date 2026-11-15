import { useEffect, useId, useRef } from 'react';

export default function Modal({ open, title, danger = false, busy = false, closeOnBackdrop = true, onClose, children }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function onDialogCancel(e) {
    e.preventDefault();
    if (!busy) onClose();
  }

  function onBackdropClick(e) {
    if (closeOnBackdrop && e.target === ref.current && !busy) onClose();
  }

  return (
    <dialog
      ref={ref}
      className={danger ? 'dialog is-danger' : 'dialog'}
      aria-labelledby={titleId}
      onCancel={onDialogCancel}
      onClick={onBackdropClick}
    >
      {open && (
        <div className="dialog-body">
          <h2 id={titleId} className="dialog-title">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
