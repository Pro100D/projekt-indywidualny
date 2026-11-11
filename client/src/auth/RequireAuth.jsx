import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Wpuszcza tylko zalogowanych. Niezalogowanego przenosi na /login
// i zapamiętuje, dokąd chciał wejść, żeby po zalogowaniu tam wrócił.
export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="loading">Ładowanie…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
