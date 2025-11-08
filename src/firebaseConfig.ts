import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAi47EZpC3WORx8emgYKIZeV2LvF4HH9uE",
  authDomain: "oxeviajei-71faa.firebaseapp.com",
  projectId: "oxeviajei-71faa",
  storageBucket: "oxeviajei-71faa.firebasestorage.app",
  messagingSenderId: "753845230451",
  appId: "1:753845230451:web:27d43308ad43be4c680306",
  measurementId: "G-S9NR04K2N9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
