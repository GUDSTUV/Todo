import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only redirect to login if we're NOT already on login/auth pages
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/login') || 
                        currentPath.startsWith('/signup') || 
                        currentPath.startsWith('/forgot-password') || 
                        currentPath.startsWith('/reset-password');
      
      if (!isAuthPage) {
        // Unauthorized on protected page - clear token and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
