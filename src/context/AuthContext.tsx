import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase.ts';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { loginAdmin } from '../services/api.ts';
import { AdminUser } from '../types.ts';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  loginWithCredentials: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session
    const savedToken = localStorage.getItem('admin_token');
    const savedUser = localStorage.getItem('admin_user');

    const handleExpired = () => {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener('auth:expired', handleExpired);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Verify with server
        fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
          .then((res) => {
            if (res.ok) {
              setToken(savedToken);
              setUser(parsedUser);
            } else {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              setToken(null);
              setUser(null);
            }
          })
          .catch(() => {
            // Keep cached if offline/network hiccup
            setToken(savedToken);
            setUser(parsedUser);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (e) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setToken(null);
        setUser(null);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('auth:expired', handleExpired);
    };
  }, []);

  const loginWithCredentials = async (email: string, pass: string) => {
    const res = await loginAdmin(email, pass);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('admin_token', res.token);
    localStorage.setItem('admin_user', JSON.stringify(res.user));
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth).catch(() => {});
    } catch (e) {
      // Ignore
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithCredentials,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
