import { Link } from 'react-router-dom';
import { dueStatus, typeLabel } from './format.js';

export default function ReminderRow({ reminder, busy, onToggle, onEdit, onDelete, showPurchase = false }) {
  const status = dueStatus(reminder);
  return (
    <li className={`reminder reminder-${status.key}`}>
      <label className="reminder-check" title={reminder.isDone ? 'Oznacz jako niewykonane' : 'Oznacz jako wykonane'}>
        <input
          type="checkbox"
          checked={reminder.isDone}
          disabled={busy}
          onChange={() => onToggle(reminder)}
          aria-label={`${reminder.isDone ? 'Wykonane' : 'Do zrobienia'}: ${reminder.title}`}
        />
      </label>
      <div className="reminder-body">
        <span className="reminder-title">{reminder.title}</span>
        <span className="reminder-meta">
          <span className="reminder-type">{typeLabel(reminder.type)}</span>
          {showPurchase && reminder.purchaseName && (
            <Link to={`/purchases/${reminder.purchaseId}`}>{reminder.purchaseName}</Link>
          )}
          <span className="reminder-due">{status.label}</span>
        </span>
      </div>
      {(onEdit || onDelete) && (
        <div className="reminder-actions">
          {onEdit && <button type="button" className="btn-small btn-secondary" onClick={() => onEdit(reminder)}>Edytuj</button>}
          {onDelete && <button type="button" className="btn-small btn-danger" onClick={() => onDelete(reminder)}>Usuń</button>}
        </div>
      )}
    </li>
  );
}
