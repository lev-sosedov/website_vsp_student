export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface NewsItem {
  id: number;
  title: string;
  category: string;
  date: string;
  image: string;
  excerpt: string;
}

export interface Program {
  id: number;
  title: string;
  description: string;
  icon: string;
  duration: string;
  level: string;
}

export interface Teacher {
  id: number;
  name: string;
  specialization: string;
  experience: string;
  technologies: string[];
  photo: string;
}

export interface Review {
  id: number;
  name: string;
  course: string;
  rating: number;
  text: string;
  photo: string;
}
