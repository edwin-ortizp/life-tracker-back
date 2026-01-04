import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import PageLayout from '@/components/PageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/themes/ThemeProvider'
import { useUserSettings, UserSettings } from '@/hooks/useUserSettings'
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'
import { useExternalCalendars } from '@/features/external-calendar/hooks/useExternalCalendars'
import { AddCalendarDialog } from '@/features/external-calendar/components/AddCalendarDialog'
import { CalendarListItem } from '@/features/external-calendar/components/CalendarListItem'
import { CalendarSyncButton } from '@/features/external-calendar/components/CalendarSyncButton'

const SettingsPage = () => {
  const { settings, saveSettings } = useUserSettings()
  const { setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, reset } = useForm<UserSettings>()

  // External calendars hook
  const {
    calendars,
    addCalendar,
    toggleCalendar,
    removeCalendar,
    syncCalendar,
    syncAllCalendars,
    syncStatus,
    lastSyncTime,
  } = useExternalCalendars()

  useEffect(() => {
    if (settings) {
      reset(settings)
    }
  }, [settings, reset])

  const onSubmit = async (data: UserSettings) => {
    await saveSettings(data)
    if (data.theme) setTheme(data.theme)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const getUserInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
  }

  return (
    <PageLayout>
      <div className="space-y-6 max-w-md">
        <h1 className="text-2xl font-bold">Perfil y Configuración</h1>
        
        {/* User Profile Section */}
        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-gray-200">
              {getUserInitials(user?.email || null)}
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800">
              {user?.email?.split('@')[0] || 'Usuario'}
            </h2>
            <p className="text-sm text-gray-600">
              {user?.email}
            </p>
          </div>
        </div>
        
        {/* Settings Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre</Label>
            <Input id="fullName" {...register('fullName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Fecha de nacimiento</Label>
            <Input id="birthDate" type="date" {...register('birthDate')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <select id="theme" className="border rounded-md p-2" {...register('theme')}>
              <option value="default">Default</option>
              <option value="programmer">Programador Claro</option>
            </select>
          </div>
          <Button type="submit">Guardar</Button>
        </form>

        {/* External Calendars Section */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Calendarios Externos</h2>
            <CalendarSyncButton
              onSync={syncAllCalendars}
              syncStatus={syncStatus}
              lastSyncTime={lastSyncTime}
              variant="outline"
              size="sm"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Sincroniza eventos de Google Calendar mediante URLs públicas en formato iCal.
          </p>

          {calendars.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                No hay calendarios configurados
              </p>
              <AddCalendarDialog onAdd={addCalendar} />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {calendars.map((calendar) => (
                  <CalendarListItem
                    key={calendar.id}
                    calendar={calendar}
                    onToggle={toggleCalendar}
                    onRemove={removeCalendar}
                    onSync={syncCalendar}
                    isSyncing={syncStatus === 'syncing'}
                  />
                ))}
              </div>
              <AddCalendarDialog onAdd={addCalendar} />
            </>
          )}
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}

export default SettingsPage
