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
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!notificationsSupported() || permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png', // Asegúrate de tener este ícono
        silent: !preferences.sound,
        // 'vibrate' is not a valid property for NotificationOptions in browsers
        ...options
      });

      // Manejar clic en la notificación
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [permission, preferences]);

  const showPersistentNotification = useCallback((title: string, body: string) => {
    if (!notificationsSupported() || permission !== 'granted') return;

    try {
      activeNotificationRef.current?.close();
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        silent: !preferences.sound,
        requireInteraction: true
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

  const stopPersistentNotification = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    if (activeNotificationRef.current) {
      activeNotificationRef.current.close();
      activeNotificationRef.current = null;
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