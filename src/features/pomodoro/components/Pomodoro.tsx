// src/features/pomodoro/components/Pomodoro.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePomodoroTimer, usePomodoroData } from '../hooks';
import { useNotifications } from '../hooks/useNotifications';
import { PomodoroCounter } from './PomodoroCounter';
import { PomodoroHistory } from './PomodoroHistory';
import { PomodoroTimer } from './PomodoroTimer';
import { PomodoroProgress } from './PomodoroProgress';
import { PomodoroEditModal } from './PomodoroEditModal';
import { DailyProgress } from './DailyProgress';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { formatTime } from '../utils/formatTime';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PomodoroSession } from '../types';

const POMODORO_DURATION = 30 * 60; // 30 minutos en segundos

interface PomodoroProps {
  selectedDate?: Date;
}

export const Pomodoro = ({ selectedDate }: PomodoroProps) => {
  const { user } = useAuth();
  const dailyGoal = 300; // 5 horas en minutos
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PomodoroSession | null>(null);
  
  const {
    supported: notificationsSupported,
    permission: notificationPermission,
    preferences: notificationPrefs,
    requestPermission,
    sendNotification,
    updatePreferences,
    startPersistentNotification,
    stopPersistentNotification
  } = useNotifications();

  const { 
    count,
    sessions,
    status,
    error,
    saveSession,
    deleteSession,
    editSession,
    addManualSession,
    resync
  } = usePomodoroData(selectedDate);
  const { isOnline } = useNetworkStatus();

  const handleComplete = useCallback(async (duration: number) => {
    await saveSession(duration, true);
    
    if (notificationPrefs.enabled && notificationPermission === 'granted') {
      sendNotification('¡Pomodoro completado! 🎉', {
        body: 'Has completado exitosamente tu sesión de concentración',
        requireInteraction: true
      });
    }
  }, [saveSession, notificationPrefs, notificationPermission, sendNotification]);

  const handleStop = useCallback(async (duration: number) => {
    await saveSession(duration, false, {
      description: 'Sesión interrumpida manualmente'
    });
  }, [saveSession]);

  const { 
    time,
    isActive,
    formattedTime,
    startTimer,
    stopTimer
  } = usePomodoroTimer({
    onComplete: handleComplete,
    onCancel: handleStop,
    selectedDate
  });

  // Calcular el progreso
  const progress = ((POMODORO_DURATION - time) / POMODORO_DURATION) * 100;

  const handleNotificationToggle = async () => {
    if (!notificationsSupported) return;

    if (notificationPrefs.enabled) {
      updatePreferences({ enabled: false });
    } else {
      if (notificationPermission === 'default') {
        setShowNotificationDialog(true);
      } else if (notificationPermission === 'granted') {
        updatePreferences({ enabled: true });
      }
    }
  };

  const handleNotificationPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      updatePreferences({ enabled: true });
    }
    setShowNotificationDialog(false);
  };

  const handleIncrement = async () => {
    if (status === 'saving' || !isOnline) return;
    await addManualSession();
  };

  const handleEditSession = (session: PomodoroSession) => {
    setSelectedSession(session);
  };

  const handleEditSave = async (oldSession: PomodoroSession, updatedSession: Partial<PomodoroSession>) => {
    await editSession(oldSession, updatedSession);
    setSelectedSession(null);
  };

  const timeRef = useRef(time);
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    if (!notificationsSupported || !notificationPrefs.enabled || notificationPermission !== 'granted') {
      return;
    }

    if (isActive) {
      startPersistentNotification('Pomodoro en progreso', () => `Tiempo restante: ${formatTime(Math.ceil(timeRef.current))}`);
    } else {
      stopPersistentNotification();
    }
  }, [isActive, notificationsSupported, notificationPrefs.enabled, notificationPermission, startPersistentNotification, stopPersistentNotification]);

  useEffect(() => {
    return () => {
      stopPersistentNotification();
    };
  }, [stopPersistentNotification]);

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para usar el temporizador Pomodoro</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progreso Diario */}
      <DailyProgress 
        sessions={sessions}
        dailyGoal={dailyGoal}
      />
      
      {/* Timer y Controles */}
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <h2 className="text-lg font-medium">Pomodoro Timer</h2>
            </div>

              {notificationsSupported && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNotificationToggle}
                  className="flex items-center gap-2"
                  aria-label={notificationPrefs.enabled ? "Desactivar notificaciones" : "Activar notificaciones"}
                >
                  {notificationPrefs.enabled ? (
                    <>
                      <Bell className="w-4 h-4" />
                      <span className="hidden sm:inline"></span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4" />
                      <span className="hidden sm:inline"></span>
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <PomodoroCounter
              count={count}
              onIncrement={handleIncrement}
              disabled={status === 'saving' || !isOnline}
              status={status}
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            {status === 'saving' && (
              <span className="text-blue-500">Guardando...</span>
            )}
            {status === 'pending' && (
              <span className="text-yellow-600">Pendiente de sincronizar</span>
            )}
            {status === 'saved' && (
              <span className="text-green-600">Sincronizado</span>
            )}
            {status === 'error' && (
              <span className="text-red-600">Error de sincronización</span>
            )}
            {!isOnline && <span className="text-orange-600">Offline</span>}
            <Button onClick={resync} variant="link" className="p-0 h-auto">Reintentar</Button>
          </div>

          {/* Timer y Progreso */}
          <div className="space-y-6">
            <PomodoroTimer
              time={formattedTime}
              isActive={isActive}
              onStart={startTimer}
              onStop={stopTimer}
              disabled={status === 'saving' || !isOnline}
            />

            <PomodoroProgress
              progress={progress}
              currentTime={formattedTime}
              totalTime={formatTime(POMODORO_DURATION)}
              isActive={isActive}
            />
          </div>

          {/* Historial */}
          <div className="mt-6">
            <PomodoroHistory 
              sessions={sessions}
              onEditSession={handleEditSession}
              onDeleteSession={deleteSession}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      {selectedSession && (
        <PomodoroEditModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Diálogo de permisos de notificación */}
      <AlertDialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activar notificaciones</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Te gustaría recibir notificaciones cuando se complete un Pomodoro? 
              Esto te ayudará a mantenerte informado incluso cuando el navegador esté en segundo plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, gracias</AlertDialogCancel>
            <AlertDialogAction onClick={handleNotificationPermission}>
              Activar notificaciones
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Pomodoro;