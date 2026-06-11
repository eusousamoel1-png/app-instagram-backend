/**
 * AuthContext — Estado global de autenticação
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { getAuthStatus, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await getAuthStatus();
      if (data.authenticated) {
        setUser({
          username: data.username,
          profilePicture: data.profilePicture,
          followersCount: data.followersCount,
          mediaCount: data.mediaCount,
          tokenExpiresAt: data.tokenExpiresAt,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, checkAuth }}>
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
