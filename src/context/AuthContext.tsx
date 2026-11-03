import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { apiFetch, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginStaff: (username: string, password: string) => Promise<User>;
  loginGoogle: () => Promise<User>;
  switchDemoUser: (role: 'owner' | 'manager' | 'cashier') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch<{ user: User }>('/auth/me');
      setUser(res.user);
    } catch (err) {
      removeStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const loginStaff = async (username: string, password: string): Promise<User> => {
    const res = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const loginGoogle = async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await result.user.getIdToken();
    const res = await apiFetch<{ token: string; user: User }>('/auth/firebase-login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const switchDemoUser = async (role: 'owner' | 'manager' | 'cashier') => {
    const usernameMap = {
      owner: 'owner',
      manager: 'manajer',
      cashier: 'kasir1',
    };
    await loginStaff(usernameMap[role], 'kopi123');
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    removeStoredToken();
    setUser(null);
  };

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginStaff,
        loginGoogle,
        switchDemoUser,
        logout,
        refreshUser: fetchCurrentUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
