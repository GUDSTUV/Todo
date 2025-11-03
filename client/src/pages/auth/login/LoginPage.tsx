import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { initGoogleAuth, handleGoogleLogin as triggerGoogleLogin } from '../../../utils/googleAuth';
import api from '../../../api/client/client';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/button/Button';
import ErrorAlert from '../../../components/ui/errorAlert/ErrorAlert';
import GoogleAuthButton from '../../../components/ui/googleAuthButton/GoogleAuthButton';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginToStore = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string>('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const redirectPath = searchParams.get('redirect') || '/dashboard';

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
    setServerError(''); // Clear previous server errors
    if (!validate()) return;

    setIsLoading(true);
    try {
      const resp = await api.post('/auth/login', { email, password });
      const { token, user } = resp.data as { token: string; user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
      loginToStore(user, token, rememberMe);
      toast.success('Login successful');
      navigate(redirectPath);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string }; status?: number }; message?: string };
      const errorMessage = err?.response?.data?.error || 'Login failed. Please try again.';
      setServerError(errorMessage); // Set server error separately
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Register the Google credential callback and exchange it for a JWT on our API
    initGoogleAuth(async (credential) => {
      try {
        const resp = await api.post('/auth/google/verify', { credential });
        const { token, user } = resp.data as { token: string; user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
        loginToStore(user, token, true); // Google login defaults to remember me
        toast.success('Logged in with Google');
        // Small delay to ensure state completes
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate(redirectPath);
      } catch {
        toast.error('Google login failed');
      }
    });
  }, [loginToStore, navigate, redirectPath]);

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
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              setServerError(''); // Clear server error when user starts typing
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
              setServerError(''); // Clear server error when user starts typing
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
          
          {/* Server Error Message */}
          <ErrorAlert message={serverError} onDismiss={() => setServerError('')} />
          
          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <div>
            <input 
              type="checkbox" 
              id="rememberMe" 
              name="rememberMe" 
              className="mr-2" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe" className="text-sm">Remember Me</label>
            </div>
            <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</Link>
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

          <GoogleAuthButton 
            onClick={handleGoogleLogin}
            text="Login with Google"
          />
        </form>
      </div>
    </div>
  );
};

export default LoginPage;