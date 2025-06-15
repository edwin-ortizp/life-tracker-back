import React from 'react';
import { Button } from '@/components/ui/button';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const GoogleCalendarButton: React.FC = () => {
  const { ready, signedIn, signIn, signOut, available } = useGoogleCalendar();

  if (!available) {
    return (
      <Button size="sm" variant="outline" disabled title="Configura las variables de Google Calendar">
        Calendar no disponible
      </Button>
    );
  }

  if (!ready) {
    return (
      <Button size="sm" variant="outline" disabled>
        Cargando...
      </Button>
    );
  }

  return signedIn ? (
    <Button size="sm" variant="outline" onClick={signOut}>
      Desconectar Calendar
    </Button>
  ) : (
    <Button size="sm" variant="outline" onClick={signIn}>
      Conectar Calendar
    </Button>
  );
};

export default GoogleCalendarButton;
