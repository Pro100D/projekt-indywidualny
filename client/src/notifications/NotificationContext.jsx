import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { todayInputDate } from '../purchases/format.js';

const REFRESH_MS = 60 * 1000;

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { pathname } = useLocation();

  const refreshCount = useCallback(async () => {
    try {
      const data = await api(`/notifications/unread-count?today=${todayInputDate()}`);
      setUnreadCount(data.unreadCount);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [pathname, refreshCount]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshCount();
    }, REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && refreshCount();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
