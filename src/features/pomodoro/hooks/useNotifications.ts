// src/features/pomodoro/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import type { NotificationPreferences } from '../types';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationState>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    sound: true,
    vibration: true
  });

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
        vibrate: preferences.vibration ? [200, 100, 200] : undefined,
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

  // Cargar preferencias al inicio
  useEffect(() => {
    const savedPrefs = localStorage.getItem('pomodoroNotificationPrefs');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
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
    updatePreferences
  };
};