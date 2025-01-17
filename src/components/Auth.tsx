// components/Auth.tsx
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';

const Auth = () => {
  const { user, signIn, signOut } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {user.email}
          </span>
          <Button variant="outline" onClick={signOut}>
            Cerrar sesión
          </Button>
        </div>
      ) : (
        <Button onClick={signIn}>
          Iniciar sesión con Google
        </Button>
      )}
    </div>
  );
};

export default Auth;