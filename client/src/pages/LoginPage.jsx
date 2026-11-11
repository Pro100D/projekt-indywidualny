// Funkcja 1: Konto użytkownika
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import FormField from '../components/FormField.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Po zalogowaniu wracamy na stronę, na którą użytkownik chciał wejść.
  const backTo = location.state?.from?.pathname || '/';

  if (user) return <Navigate to={backTo} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Podaj e-mail i hasło');
      return;
    }
    setSending(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate(backTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="auth-page">
      <h1>Logowanie</h1>
      <form className="form" onSubmit={onSubmit} noValidate>
        <FormField label="E-mail" name="email" type="email" autoComplete="email"
          value={form.email} onChange={onChange} />
        <FormField label="Hasło" name="password" type="password" autoComplete="current-password"
          value={form.password} onChange={onChange} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={sending}>{sending ? 'Logowanie…' : 'Zaloguj się'}</button>
      </form>
      <p className="auth-switch">
        Nie masz konta? <Link to="/register">Zarejestruj się</Link>
      </p>
    </section>
  );
}
