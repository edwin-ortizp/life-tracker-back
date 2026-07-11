// components/Auth.tsx
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '../hooks/useAuth';

const Auth = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm">
        {user.email}
      </span>
      <Button variant="outline" onClick={signOut}>
        Cerrar sesión
      </Button>
    </div>
  );
};

export default Auth;