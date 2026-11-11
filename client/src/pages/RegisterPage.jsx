// Funkcja 1: Konto użytkownika
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import FormField from '../components/FormField.jsx';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: undefined }); // błąd znika przy poprawianiu
  };

  async function onSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError('');
    setFieldErrors({});
    try {
      await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      // Błędy konkretnych pól pokazujemy pod polami, inne — pod formularzem.
      if (Object.keys(err.fields).length) setFieldErrors(err.fields);
      else setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="auth-page">
      <h1>Rejestracja</h1>
      <form className="form" onSubmit={onSubmit} noValidate>
        <FormField label="Imię" name="name" autoComplete="given-name"
          value={form.name} onChange={onChange} error={fieldErrors.name} />
        <FormField label="E-mail" name="email" type="email" autoComplete="email"
          value={form.email} onChange={onChange} error={fieldErrors.email} />
        <FormField label="Hasło (min. 8 znaków)" name="password" type="password" autoComplete="new-password"
          value={form.password} onChange={onChange} error={fieldErrors.password} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={sending}>{sending ? 'Zakładanie konta…' : 'Załóż konto'}</button>
      </form>
      <p className="auth-switch">
        Masz już konto? <Link to="/login">Zaloguj się</Link>
      </p>
    </section>
  );
}
