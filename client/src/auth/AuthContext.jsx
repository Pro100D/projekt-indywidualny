// Funkcja 1: Konto użytkownika — wspólny stan logowania dla całej aplikacji
import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Na starcie sprawdzamy zapisany token, więc przez chwilę nie wiemy, kto jest zalogowany.
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => clearToken()) // token wygasł albo jest nieprawidłowy
      .finally(() => setLoading(false));
  }, []);

  function saveSession({ token, user }) {
    setToken(token);
    setUser(user);
  }

  async function login(email, password) {
    saveSession(await api('/auth/login', { method: 'POST', body: { email, password } }));
  }

  async function register(name, email, password) {
    saveSession(await api('/auth/register', { method: 'POST', body: { name, email, password } }));
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
