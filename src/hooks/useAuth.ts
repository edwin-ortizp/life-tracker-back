// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { auth } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });
    setGoogleToken(localStorage.getItem('googleAccessToken'));

    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      setGoogleToken(token);
      if (token) localStorage.setItem('googleAccessToken', token);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setGoogleToken(null);
      localStorage.removeItem('googleAccessToken');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return { user, loading, googleToken, signIn, signOut };
}