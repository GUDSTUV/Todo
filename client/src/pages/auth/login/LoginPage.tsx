import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { initGoogleAuth, handleGoogleLogin as triggerGoogleLogin } from '../../../utils/googleAuth';
import api from '../../../api/client/client';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/button/Button';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const loginToStore = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validate()) return;

    setIsLoading(true);
    try {
      console.log('Attempting login with:', { email, password: '***' });
      console.log('API base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      const { token, user } = response.data as { token: string; user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
      loginToStore(user, token);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Login error:', error);
      const err = error as { response?: { data?: { error?: string }; status?: number }; message?: string };
      console.error('Error details:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      const errorMessage = err?.response?.data?.error || 'Login failed. Please try again.';
      setErrors({ email: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Register the Google credential callback and exchange it for a JWT on our API
    initGoogleAuth(async (credential) => {
      try {
        console.log('[LoginPage] Google credential received, verifying...');
        const resp = await api.post('/auth/google/verify', { credential });
        const { token, user } = resp.data as { token: string; user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
        console.log('[LoginPage] Verification successful, user:', user);
        loginToStore(user, token);
        console.log('[LoginPage] Store updated, isAuthenticated should be true');
        toast.success('Logged in with Google');
        // Small delay to ensure Zustand persist completes
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('[LoginPage] Navigating to dashboard...');
        navigate('/dashboard');
      } catch (err) {
        console.error('Google login exchange failed:', err);
        toast.error('Google login failed');
      }
    });
  }, [loginToStore, navigate]);

  const handleGoogleLogin = () => {
    // trigger the Google credential chooser (defined in utils)
    triggerGoogleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-center mb-2">Login into your account</h1>
        <h6 className="text-center mb-5">don't have an account
         <Link to="/signup" className="text-blue-600 hover:underline"> Sign up</Link></h6>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              // live-validate email field
              const result = loginSchema.safeParse({ email: v, password });
              if (!result.success) {
                const fieldErrors: { email?: string; password?: string } = {};
                result.error.issues.forEach((err) => {
                  if (err.path[0] === 'email') fieldErrors.email = err.message;
                  if (err.path[0] === 'password') fieldErrors.password = err.message;
                });
                setErrors((prev) => ({ ...prev, email: fieldErrors.email }));
              } else {
                setErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            onBlur={() => handleBlur('email')}
            error={touched.email ? errors.email : undefined}
            required
            autoComplete="off"
          />

          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => {
              const v = e.target.value;
              setPassword(v);
              const result = loginSchema.safeParse({ email, password: v });
              if (!result.success) {
                const fieldErrors: { email?: string; password?: string } = {};
                result.error.issues.forEach((err) => {
                  if (err.path[0] === 'email') fieldErrors.email = err.message;
                  if (err.path[0] === 'password') fieldErrors.password = err.message;
                });
                setErrors((prev) => ({ ...prev, password: fieldErrors.password }));
              } else {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            onBlur={() => handleBlur('password')}
            error={touched.password ? errors.password : undefined}
            showPasswordToggle
            required
            autoComplete="off"
          />
          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <div>
            <input type="checkbox" id="rememberMe" name="rememberMe" className="mr-2" />
            <label htmlFor="rememberMe" className="text-sm">Remember Me</label>
            </div>
            <a href="/auth/forgetPassword" className="text-blue-600 hover:underline">Forget password</a>
          </div>
          
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isLoading}
            size="md"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            <span className="mx-2 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
          </div>
          
          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            fullWidth
            size="md"
            leftIcon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            }
          >
            Login with Google
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;