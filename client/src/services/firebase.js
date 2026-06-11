/**
 * Firebase Client SDK Configuration
 * Projeto: app-postagem-instagram
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBR3s-Tf3SNRYc2T8990RYG0kLYRzg4zJU",
  authDomain: "app-postagem-instagram.firebaseapp.com",
  projectId: "app-postagem-instagram",
  storageBucket: "app-postagem-instagram.firebasestorage.app",
  messagingSenderId: "784706463211",
  appId: "1:784706463211:web:1abc38f25d9fe842a065ae",
  measurementId: "G-XCF3M92DHZ",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
