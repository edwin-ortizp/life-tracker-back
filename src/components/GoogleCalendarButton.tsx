import React from 'react';
import { Button } from '@/components/ui/button';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const GoogleCalendarButton: React.FC = () => {
  const { ready, signedIn, signIn, signOut } = useGoogleCalendar();

  if (!ready) return null;

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
