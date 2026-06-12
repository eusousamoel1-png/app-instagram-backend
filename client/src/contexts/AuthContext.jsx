/**
 * AuthContext — Estado global de autenticação
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { getAuthStatus } from '../services/api';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase user
  const [instagramData, setInstagramData] = useState(null); // Instagram config from backend
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // User logged in via Firebase, now check if they have Instagram linked
        await checkInstagramAuth(firebaseUser);
      } else {
        setUser(null);
        setInstagramData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function checkInstagramAuth(firebaseUser) {
    try {
      // The API call should now use the Firebase token to identify the user
      const data = await getAuthStatus();
      if (data.authenticated) {
        setInstagramData({
          username: data.username,
          profilePicture: data.profilePicture,
          followersCount: data.followersCount,
          mediaCount: data.mediaCount,
          tokenExpiresAt: data.tokenExpiresAt,
        });
      } else {
        setInstagramData(null);
      }
    } catch (error) {
      console.error('Erro ao verificar instagram auth:', error);
      setInstagramData(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, instagramData, loading, logout, checkInstagramAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
