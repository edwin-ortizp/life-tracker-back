import { useLocation, useNavigate } from 'react-router-dom'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { usePomodoroData } from '@/features/pomodoro/hooks/usePomodoroData'
import { 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  Timer,
  AlertCircle
} from 'lucide-react'

const AppFooter = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isOnline } = useNetworkStatus()
  const pomodoroData = usePomodoroData()
  const dataStatus = pomodoroData.status
  
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

  // Note: Active pomodoro functionality temporarily removed due to architecture mismatch
  const hasActivePomodoro = false
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getRemainingTime = () => {
    return 0
  }

  const isTimerRunning = false

  const getSyncStatus = () => {
    const statusMap = {
      'idle': 'Inactivo',
      'saving': 'Guardando...',
      'pending': 'Pendiente',
      'saved': 'Sincronizado',
      'error': 'Error'
    }
    return statusMap[dataStatus] || 'Sincronizado'
  }

  const getSyncIcon = () => {
    switch (dataStatus) {
      case 'saving':
      case 'pending':
        return <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
      case 'error':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <CheckCircle className="w-3 h-3" />
    }
  }

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
        
        {/* Sync Status */}
        <div className="flex items-center space-x-1">
          {getSyncIcon()}
          <span>{getSyncStatus()}</span>
        </div>
        
        {/* Pomodoro Status */}
        {hasActivePomodoro && (
          <button 
            onClick={() => navigate('/pomodoro')}
            className="flex items-center space-x-2 bg-[#005a9e] px-2 py-1 rounded hover:bg-[#007ACC] transition-colors"
          >
            <Timer className="w-3 h-3" />
            <span className="font-mono">{formatTime(getRemainingTime())}</span>
            <span className="text-xs">{isTimerRunning ? 'Corriendo' : 'Pausado'}</span>
          </button>
        )}
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
        {/* Pomodoro Quick Access */}
        {!hasActivePomodoro && (
          <button 
            onClick={() => navigate('/pomodoro')}
            className="flex items-center space-x-1 hover:bg-[#005a9e] px-2 py-1 rounded transition-colors"
          >
            <Timer className="w-3 h-3" />
            <span>Pomodoro</span>
          </button>
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
