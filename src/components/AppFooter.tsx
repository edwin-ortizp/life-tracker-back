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
  
  // Hook de notificaciones para mostrar estado
  const { 
    supported: notificationsSupported,
    permission: notificationPermission,
    preferences: notificationPrefs,
    requestPermission,
    sendNotification,
    updatePreferences
  } = useNotifications()
  
  const getPageName = (pathname: string) => {
    const routes: Record<string, string> = {
      '/': 'Inicio',
      '/water': 'Hidratación',
      '/exercise': 'Ejercicio',
      '/habit': 'Hábitos',
      '/mood': 'Estado de Ánimo',
      '/journal': 'Diario',
      '/pomodoro': 'Pomodoro',
      '/meal': 'Comidas',
      '/task': 'Tareas',
      '/kanban': 'Kanban',
      '/stats': 'Estadísticas',
      '/negative': 'Hábitos Negativos',
      '/settings': 'Configuración'
    }
    return routes[pathname] || 'Life Tracker'
  }

  // Usar el hook global para detectar timer activo
  const hasActivePomodoro = isActive

  // Función para manejar prueba de notificaciones
  const handleTestNotification = async () => {
    if (!notificationsSupported) return
    
    if (notificationPermission === 'default') {
      const granted = await requestPermission()
      if (granted) {
        updatePreferences({ enabled: true })
        sendNotification('🔔 Notificaciones activadas', {
          body: 'Recibirás notificaciones cuando terminen los Pomodoros',
          requireInteraction: false
        })
      }
    } else if (notificationPermission === 'granted') {
      sendNotification('🧪 Prueba de notificación', {
        body: 'Las notificaciones están funcionando correctamente',
        requireInteraction: false
      })
    }
  }

  // Función para alternar sonido
  const toggleSound = () => {
    updatePreferences({ sound: !notificationPrefs.sound })
  }

  // Obtener estado y tooltip de notificaciones
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
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>En línea</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Sin conexión</span>
            </>
          )}
        </div>
      </div>
      
      {/* Center Section */}
      <div className="flex items-center space-x-4">
        {/* Current Page */}
        <div className="flex items-center space-x-1">
          <span className="font-medium">{getPageName(location.pathname)}</span>
        </div>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Pomodoro Status - Active Timer */}
        {hasActivePomodoro && (
          <button 
            type="button"
            onClick={() => navigate('/pomodoro')}
            className="flex items-center space-x-2 bg-[#005a9e] px-2 py-1 rounded hover:bg-[#007ACC] transition-colors"
          >
            <Timer className="w-3 h-3" />
            <span className="font-mono">{formattedTime}</span>
            <span className="text-xs">Transcurrido</span>
          </button>
        )}
        
        {/* Pomodoro Quick Access */}
        {!hasActivePomodoro && (
          <button 
            type="button"
            onClick={() => navigate('/pomodoro')}
            className="flex items-center space-x-1 hover:bg-[#005a9e] px-2 py-1 rounded transition-colors"
          >
            <Timer className="w-3 h-3" />
            <span>Pomodoro</span>
          </button>
        )}
        
        {/* Notification Status - Very Subtle */}
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
            
            {/* Sound Toggle - Only show if notifications are enabled */}
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
        
        {/* App Version */}
        <div className="flex items-center space-x-1">
          <span className="text-[#87CEEB]">Life Tracker v1.0</span>
        </div>
      </div>
    </footer>
  )
}

export default AppFooter
