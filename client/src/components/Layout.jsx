import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const links = [
  { to: '/', label: 'Strona główna', end: true },
  { to: '/purchases', label: 'Zakupy' },
  { to: '/warranties', label: 'Gwarancje' },
  { to: '/stats', label: 'Statystyki' },
  { to: '/addresses', label: 'Adresy' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <header className="header">
        <span className="logo">HomeVault</span>
        <nav className="nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {/* TODO (funkcja 2): wybór aktywnego adresu */}
          <select disabled aria-label="Adres">
            <option>Wybierz adres</option>
          </select>
          {/* TODO (funkcja 8): dzwonek z licznikiem nieprzeczytanych */}
          <NavLink to="/notifications">Powiadomienia</NavLink>
          <span className="user-name">{user.name}</span>
          <button type="button" className="btn-logout" onClick={onLogout}>
            Wyloguj
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </>
  );
}
