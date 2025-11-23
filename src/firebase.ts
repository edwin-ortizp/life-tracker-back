// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  clearIndexedDbPersistence,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';

const firebaseConfig = {
  // Aquí necesitarás poner tu configuración de Firebase
  apiKey: "AIzaSyA1UeSwJ_gjygFI5SL4ZANSDHWTnuOxD_o",
  authDomain: "lifetracker-9e171.firebaseapp.com",
  projectId: "lifetracker-9e171",
  storageBucket: "lifetracker-9e171.firebasestorage.app",
  messagingSenderId: "160072327627",
  appId: "1:160072327627:web:664a48e910b6eedd59964e"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence for Firestore only once
let persistenceInitialized = false;

// Función para limpiar la persistencia offline
export const clearOfflineCache = async (): Promise<void> => {
  try {
    await disableNetwork(db);
    await clearIndexedDbPersistence(db);
    await enableNetwork(db);
    // Recargar la página para reinicializar Firestore
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (error) {
    console.error('Error clearing Firestore offline cache:', error);
    throw error;
  }
};

// Función para detectar errores de estado interno de Firestore
export const isFirestoreInternalError = (error: any): boolean => {
  return error?.message?.includes('INTERNAL ASSERTION FAILED') || 
         error?.message?.includes('Unexpected state') ||
         error?.code === 'internal';
};

if (typeof window !== 'undefined' && !persistenceInitialized) {
  persistenceInitialized = true;
  enableIndexedDbPersistence(db, {
    forceOwnership: true // Forzar la propiedad para evitar conflictos
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
    } else if (err.code === 'unimplemented') {
    } else {
      console.error('Firestore persistence error', err);
    }
  });
}

