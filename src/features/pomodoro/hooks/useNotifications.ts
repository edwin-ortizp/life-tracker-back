// src/features/pomodoro/hooks/useNotifications.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { NotificationPreferences } from '../types';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    sound: true,
    vibration: true
  });

  const activeNotificationRef = useRef<Notification | null>(null);
  const intervalRef = useRef<number>();

  // Verificar soporte de notificaciones
  const notificationsSupported = useCallback(() => {
    return 'Notification' in window;
  }, []);

  // Solicitar permisos
  const requestPermission = useCallback(async () => {
    if (!notificationsSupported()) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Enviar notificación
  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!notificationsSupported() || permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, {
            icon: '/icon-192x192.png',
            silent: !preferences.sound,
            ...options
          });
          return;
        }
      }

      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        silent: !preferences.sound,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [permission, preferences, notificationsSupported]);

  const showPersistentNotification = useCallback(async (title: string, body: string) => {
    if (!notificationsSupported() || permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, {
            body,
            icon: '/icon-192x192.png',
            silent: !preferences.sound,
            requireInteraction: true,
            tag: 'pomodoro-active'
          });
          return;
        }
      }

      activeNotificationRef.current?.close();
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        silent: !preferences.sound,
        requireInteraction: true,
        tag: 'pomodoro-active'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      activeNotificationRef.current = notification;
    } catch (error) {
      console.error('Error sending persistent notification:', error);
    }
  }, [permission, preferences, notificationsSupported]);

  const startPersistentNotification = useCallback(
    (title: string, getBody: () => string, intervalMs = 60000) => {
      showPersistentNotification(title, getBody());
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        showPersistentNotification(title, getBody());
      }, intervalMs);
    },
    [showPersistentNotification]
  );

  const stopPersistentNotification = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    if (activeNotificationRef.current) {
      activeNotificationRef.current.close();
      activeNotificationRef.current = null;
    }

    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const notifs = await reg.getNotifications({ tag: 'pomodoro-active' });
          notifs.forEach(n => n.close());
        }
      } catch (err) {
        console.error('Error closing persistent notification:', err);
      }
    }
  }, []);

  // Cargar preferencias al inicio
  useEffect(() => {
    const savedPrefs = localStorage.getItem('pomodoroNotificationPrefs');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch {
        console.warn('Invalid pomodoro prefs in storage');
      }
    }
    
    if (notificationsSupported()) {
      setPermission(Notification.permission);
    }
  }, []);

  // Guardar preferencias cuando cambien
  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem('pomodoroNotificationPrefs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    supported: notificationsSupported(),
    permission,
    preferences,
    requestPermission,
    sendNotification,
    updatePreferences,
    startPersistentNotification,
    stopPersistentNotification
  };
};