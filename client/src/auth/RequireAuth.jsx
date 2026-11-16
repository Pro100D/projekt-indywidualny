import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { AddressProvider } from '../addresses/AddressContext.jsx';
import { NotificationProvider } from '../notifications/NotificationContext.jsx';

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="loading">Ładowanie…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    <AddressProvider>
      <NotificationProvider>
        <Outlet />
      </NotificationProvider>
    </AddressProvider>
  );
}
