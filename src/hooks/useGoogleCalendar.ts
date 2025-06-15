import { useEffect, useState } from 'react';
import {
  initGoogleClient,
  signInCalendar,
  signOutCalendar
} from '@/utils/googleCalendar';

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function useGoogleCalendar() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!apiKey || !clientId) return;
    initGoogleClient(apiKey, clientId)
      .then(() => {
        const gapi = (window as any).gapi;
        const auth = gapi.auth2.getAuthInstance();
        const updateStatus = () => setSignedIn(auth.isSignedIn.get());
        updateStatus();
        auth.isSignedIn.listen(updateStatus);
        setReady(true);
      })
      .catch((err) => {
        console.error('Google client init error', err);
      });
  }, []);

  const signIn = () => signInCalendar();
  const signOut = () => signOutCalendar();

  return { ready, signedIn, signIn, signOut };
}
