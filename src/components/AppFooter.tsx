import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'

const AppFooter = () => {
  const navigate = useNavigate()
  return (
    <footer className="w-full py-4 flex justify-center border-t bg-white/80 backdrop-blur-md">
      <Button variant="ghost" onClick={() => navigate('/settings')} className="text-sm">
        <User className="w-4 h-4 mr-2" /> Perfil
      </Button>
    </footer>
  )
}

export default AppFooter
