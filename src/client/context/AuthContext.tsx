import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Employee, UserRole } from '../types/index.js';
import { authService, ApiError } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('staffsync_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('staffsync_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authService.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          setEmployee(res.employee || null);
        } else {
          handleLogout();
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login({ email, password });
      if (res.success) {
        setUser(res.user);
        setEmployee(res.employee || null);
        setToken(res.token);
        localStorage.setItem('staffsync_token', res.token);
      }
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      let email = 'hr@staffsync.com';
      if (role === 'MANAGER') email = 'alex.morgan@staffsync.com';
      if (role === 'EMPLOYEE') email = 'john.doe@staffsync.com';

      await login(email, 'StaffSync@2025');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.register(data);
      if (res.success) {
        setUser(res.user);
        setEmployee(res.employee || null);
        setToken(res.token);
        localStorage.setItem('staffsync_token', res.token);
      }
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmployee(null);
    setToken(null);
    localStorage.removeItem('staffsync_token');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      handleLogout();
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setEmployee(res.employee || null);
      }
    } catch (err) {
      console.warn('Refresh user error:', err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        token,
        isLoading,
        error,
        isAuthenticated: !!user,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
