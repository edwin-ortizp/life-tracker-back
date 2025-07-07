import { useLocation } from 'react-router-dom'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Activity
} from 'lucide-react'

const AppFooter = () => {
  const location = useLocation()
  const { isOnline } = useNetworkStatus()
  
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

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
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
          <CheckCircle className="w-3 h-3" />
          <span>Sincronizado</span>
        </div>
        
        {/* Activity Status */}
        <div className="flex items-center space-x-1">
          <Activity className="w-3 h-3" />
          <span>Activo</span>
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
        {/* Current Time */}
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{getCurrentTime()}</span>
        </div>
        
        {/* App Version */}
        <div className="flex items-center space-x-1">
          <span className="text-[#87CEEB]">Life Tracker v1.0</span>
        </div>
      </div>
    </footer>
  )
}

export default AppFooter
