import { NavLink } from 'react-router-dom';
import { useNotifications } from './NotificationContext.jsx';

export default function Bell() {
  const { unreadCount } = useNotifications();
  const label = unreadCount
    ? `Powiadomienia: ${unreadCount} nieprzeczytanych`
    : 'Powiadomienia: brak nowych';

  return (
    <NavLink to="/notifications" className="bell" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-1.7 1.7A1 1 0 0 0 4 19.4h16a1 1 0 0 0 .7-1.7L19 16Z"
        />
      </svg>
      {unreadCount > 0 && <span className="bell-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </NavLink>
  );
}
