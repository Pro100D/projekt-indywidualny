import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAddresses } from '../addresses/AddressContext.jsx';

const links = [
  { to: '/', label: 'Strona główna', end: true },
  { to: '/purchases', label: 'Zakupy' },
  { to: '/warranties', label: 'Gwarancje' },
  { to: '/stats', label: 'Statystyki' },
  { to: '/addresses', label: 'Adresy' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const {
    addresses,
    activeAddress,
    selectAddress,
    loading,
    error: addressError,
    reload: reloadAddresses,
  } = useAddresses();
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
          {!loading && !addressError && addresses.length === 0 ? (
            <Link to="/addresses" className="add-address-link">+ Dodaj adres</Link>
          ) : (
            <select
              aria-label="Aktywny adres"
              value={activeAddress?._id || ''}
              onChange={(e) => selectAddress(e.target.value)}
              disabled={loading}
            >
              {addresses.map((address) => (
                <option key={address._id} value={address._id}>
                  {address.label}{address.isDefault ? ' (domyślny)' : ''}
                </option>
              ))}
            </select>
          )}
          <NavLink to="/notifications">Powiadomienia</NavLink>
          <span className="user-name">{user.name}</span>
          <button type="button" className="btn-logout" onClick={onLogout}>
            Wyloguj
          </button>
        </div>
      </header>
      <main className="main">
        {addressError && addresses.length === 0 ? (
          <div className="form-error load-error">
            Nie udało się wczytać adresów: {addressError}{' '}
            <button type="button" className="btn-small" onClick={reloadAddresses}>Spróbuj ponownie</button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </>
  );
}
