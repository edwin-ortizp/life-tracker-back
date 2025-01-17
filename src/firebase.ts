// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

