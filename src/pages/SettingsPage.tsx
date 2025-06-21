import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import PageLayout from '@/components/PageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/themes/ThemeProvider'
import { useUserSettings, UserSettings } from '@/hooks/useUserSettings'

const SettingsPage = () => {
  const { settings, saveSettings } = useUserSettings()
  const { setTheme } = useTheme()
  const { register, handleSubmit, reset } = useForm<UserSettings>()

  useEffect(() => {
    if (settings) {
      reset(settings)
    }
  }, [settings, reset])

  const onSubmit = async (data: UserSettings) => {
    await saveSettings(data)
    if (data.theme) setTheme(data.theme)
  }

  return (
    <PageLayout>
      <div className="space-y-4 max-w-md">
        <h1 className="text-2xl font-bold">Perfil</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
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
      </div>
    </PageLayout>
  )
}

export default SettingsPage
