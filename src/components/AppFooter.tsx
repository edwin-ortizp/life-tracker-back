import { useLocation, useNavigate } from 'react-router-dom'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useGlobalPomodoroTimer } from '@/hooks/useGlobalPomodoroTimer'
import { useNotifications } from '@/features/pomodoro/hooks/useNotifications'
import {
  Wifi,
  WifiOff,
  Timer,
  Bell,
  BellOff,
  Volume2,
  VolumeX
} from 'lucide-react'

const AppFooter = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isOnline } = useNetworkStatus()
  const { isActive, formattedTime } = useGlobalPomodoroTimer()

  const {
    supported: notificationsSupported,
    permission: notificationPermission,
    preferences: notificationPrefs,
    requestPermission,
    sendNotification,
    updatePreferences
  } = useNotifications()

  const getPageName = (pathname: string) => {
    const routeMatchers: Array<[string, string]> = [
      ['/water', 'Hidratacion'],
      ['/exercise', 'Ejercicio'],
      ['/habit', 'Habitos'],
      ['/mood', 'Estado de Animo'],
      ['/journal', 'Diario'],
      ['/pomodoro', 'Pomodoro'],
      ['/meal', 'Comidas'],
      ['/task', 'Tareas'],
      ['/negative', 'Habitos Negativos'],
      ['/settings', 'Configuracion']
    ]

    if (pathname === '/') return 'Inicio'

    const match = routeMatchers.find(([prefix]) => pathname.startsWith(prefix))
    return match?.[1] || 'Life Tracker'
  }

  const hasActivePomodoro = isActive

  const handleTestNotification = async () => {
    if (!notificationsSupported) return

    if (notificationPermission === 'default') {
      const granted = await requestPermission()
      if (granted) {
        updatePreferences({ enabled: true })
        sendNotification('🔔 Notificaciones activadas', {
          body: 'Recibiras notificaciones cuando terminen los Pomodoros',
          requireInteraction: false
        })
      }
    } else if (notificationPermission === 'granted') {
      sendNotification('🧪 Prueba de notificacion', {
        body: 'Las notificaciones estan funcionando correctamente',
        requireInteraction: false
      })
    }
  }

  const toggleSound = () => {
    updatePreferences({ sound: !notificationPrefs.sound })
  }

  const getNotificationState = () => {
    if (!notificationsSupported) {
      return { icon: BellOff, tooltip: 'Notificaciones no soportadas', color: 'text-gray-500' }
    }

    if (notificationPermission === 'denied') {
      return { icon: BellOff, tooltip: 'Notificaciones bloqueadas', color: 'text-red-400' }
    }

    if (notificationPermission === 'default') {
      return { icon: Bell, tooltip: 'Click para activar notificaciones', color: 'text-yellow-400' }
    }

    if (notificationPrefs.enabled) {
      return { icon: Bell, tooltip: 'Notificaciones activadas', color: 'text-green-400' }
    }

    return { icon: BellOff, tooltip: 'Notificaciones desactivadas', color: 'text-gray-400' }
  }

  const notificationState = getNotificationState()

  return (
    <footer className="hidden md:flex w-full h-6 bg-[#007ACC] text-white text-xs items-center justify-between px-4 border-t border-[#005a9e] select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>En linea</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Sin conexion</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <span className="font-medium">{getPageName(location.pathname)}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {hasActivePomodoro && (
          <button
            type="button"
            onClick={() => navigate('/pomodoro/view/timer')}
            className="flex items-center space-x-2 bg-[#005a9e] px-2 py-1 rounded hover:bg-[#007ACC] transition-colors"
          >
            <Timer className="w-3 h-3" />
            <span className="font-mono">{formattedTime}</span>
            <span className="text-xs">Transcurrido</span>
          </button>
        )}

        {!hasActivePomodoro && (
          <button
            type="button"
            onClick={() => navigate('/pomodoro/view/timer')}
            className="flex items-center space-x-1 hover:bg-[#005a9e] px-2 py-1 rounded transition-colors"
          >
            <Timer className="w-3 h-3" />
            <span>Pomodoro</span>
          </button>
        )}

        {notificationsSupported && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleTestNotification}
              className="flex items-center space-x-1 hover:bg-[#005a9e] px-1 py-0.5 rounded transition-colors group"
              title={notificationState.tooltip}
            >
              <notificationState.icon className={`w-3 h-3 ${notificationState.color}`} />
            </button>

            {notificationPermission === 'granted' && (
              <button
                type="button"
                onClick={toggleSound}
                className="flex items-center hover:bg-[#005a9e] px-1 py-0.5 rounded transition-colors"
                title={notificationPrefs.sound ? 'Sonido activado' : 'Sonido desactivado'}
              >
                {notificationPrefs.sound ? (
                  <Volume2 className="w-3 h-3 text-green-400" />
                ) : (
                  <VolumeX className="w-3 h-3 text-gray-400" />
                )}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center space-x-1">
          <span className="text-[#87CEEB]">Life Tracker v1.0</span>
        </div>
      </div>
    </footer>
  )
}

export default AppFooter
