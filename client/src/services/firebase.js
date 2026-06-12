/**
 * Firebase Client SDK Configuration
 * Projeto: app-postagem-instagram
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCN6JEbIFJLVCoR3V6ZlbFENHhXj6yHl70",
  authDomain: "app-postagem-instagram.firebaseapp.com",
  projectId: "app-postagem-instagram",
  storageBucket: "app-postagem-instagram.firebasestorage.app",
  messagingSenderId: "784706463211",
  appId: "1:784706463211:web:1abc38f25d9fe842a065ae",
  measurementId: "G-XCF3M92DHZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };
export default app;
