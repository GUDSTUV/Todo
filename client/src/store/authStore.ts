import { create } from 'zustand';

interface User {
  _id?: string; // MongoDB ID (optional for backward compatibility)
  id: string;
  name: string;
  email: string;
  avatarUrl?: string; // Profile picture URL
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

export const useAuthStore = create<AuthState>()((set) => {
  // Initialize auth state immediately from storage
  const initializeAuthSync = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // Ensure user has required fields with defaults
        const userWithDefaults = {
          ...user,
          name: user.name || user.email || 'User',
          email: user.email || '',
        };
        
        return { user: userWithDefaults, token, isAuthenticated: true };
      } catch {
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
      }
    }
    return { user: null, token: null, isAuthenticated: false };
  };

  const initialState = initializeAuthSync();

  return {
    ...initialState,
    login: (user, token, rememberMe = false) => {
      // Ensure user has required fields with defaults
      const userWithDefaults = {
        ...user,
        name: user.name || user.email || 'User',
        email: user.email || '',
      };
      
      // Store token and user based on rememberMe preference
      if (rememberMe) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(userWithDefaults));
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
      } else {
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('authUser', JSON.stringify(userWithDefaults));
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
      
      set({ user: userWithDefaults, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authUser');
      set({ user: null, token: null, isAuthenticated: false });
    },
    updateUser: (updates) =>
      set((state) => {
        const newUser = state.user ? { ...state.user, ...updates } : null;
        // Persist to whichever storage currently holds the user
        try {
          if (newUser) {
            if (localStorage.getItem('authUser')) {
              localStorage.setItem('authUser', JSON.stringify(newUser));
            } else if (sessionStorage.getItem('authUser')) {
              sessionStorage.setItem('authUser', JSON.stringify(newUser));
            }
          }
        } catch {
          // Silent fail on persist error
        }
        return { user: newUser };
      }),
    initializeAuth: () => {
      // This is now a no-op since we initialize synchronously above
      // Kept for backwards compatibility
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const userStr = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true });
        } catch {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('authUser');
        }
      }
    },
  };
});
