import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    timezone: string;
    language: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token, rememberMe = true) => {
    // Store token and user based on rememberMe preference
    if (rememberMe) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authUser');
    } else {
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('authUser', JSON.stringify(user));
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    set({ user: null, token: null, isAuthenticated: false });
  },
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  initializeAuth: () => {
    // Check for stored auth data on app load
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch {
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
      }
    }
  },
}));
