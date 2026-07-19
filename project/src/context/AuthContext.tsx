import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, RegisterData } from '../types';

const AuthContext = createContext<AuthState | null>(null);

const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    email: 'student@vshp.kz',
    password: '123456',
    firstName: 'Александр',
    lastName: 'Иванов',
    role: 'student',
    phone: '+7 700 123 45 67',
  },
  {
    id: '2',
    email: 'parent@vshp.kz',
    password: '123456',
    firstName: 'Ольга',
    lastName: 'Иванова',
    role: 'parent',
    phone: '+7 700 234 56 78',
  },
  {
    id: '3',
    email: 'teacher@vshp.kz',
    password: '123456',
    firstName: 'Анна',
    lastName: 'Петрова',
    role: 'teacher',
    phone: '+7 700 345 67 89',
  },
  {
    id: '4',
    email: 'admin@vshp.kz',
    password: '123456',
    firstName: 'Михаил',
    lastName: 'Сидоров',
    role: 'admin',
    phone: '+7 700 456 78 90',
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('vshp_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('vshp_user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) {
      return { success: false, error: 'Неверный email или пароль' };
    }
    const { password: _, ...userData } = found;
    setUser(userData);
    localStorage.setItem('vshp_user', JSON.stringify(userData));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vshp_user');
  };

  const register = async (data: RegisterData) => {
    const exists = MOCK_USERS.find((u) => u.email === data.email);
    if (exists) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    const newUser: User = {
      id: String(Date.now()),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'student',
      phone: data.phone,
    };
    setUser(newUser);
    localStorage.setItem('vshp_user', JSON.stringify(newUser));
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
