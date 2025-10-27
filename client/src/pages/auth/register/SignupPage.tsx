import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { initGoogleAuth, handleGoogleSignup } from '../../../utils/googleAuth';
import api from '../../../api/client/client';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/button/Button';

const signupSchema = z
  .object({
    name: z.string().min(2, { message: 'Please enter your name' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(6, { message: 'Confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const loginToStore = useAuthStore((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initGoogleAuth(async (credential) => {
      try {
        const resp = await api.post('/auth/google/verify', { credential });
        const { token, user } = resp.data as { token: string; user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
        loginToStore(user, token);
        toast.success('Signed in with Google');
        navigate('/dashboard');
      } catch (err) {
        console.error('Google signup exchange failed:', err);
        toast.error('Google sign-in failed');
      }
    });
  }, [loginToStore, navigate]);

  const validate = () => {
    const result = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] || '');
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      console.log('Attempting signup with:', { name, email, password: '***' });
      console.log('API base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      
      const response = await api.post('/auth/signup', { name, email, password });
      console.log('Signup response:', response.data);
      
      const { token, user } = response.data as { token: string; user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
      loginToStore(user, token);
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      const err = error as { response?: { data?: { error?: string }; status?: number }; message?: string };
      console.error('Error details:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      const message = err?.response?.data?.error || 'Signup failed. Please try again.';
      setErrors({ email: message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-center mb-1">Create an account</h1>
        <h6 className="text-center mb-2">Already have an account?
         <Link to="/login" className="text-blue-600 hover:underline"> Sign in</Link></h6>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            id="name"
            type="text"
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={validate}
            error={errors.name}
            autoComplete="off"
          />

          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validate}
            error={errors.email}
            autoComplete="off"
          />

          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validate}
            error={errors.password}
            showPasswordToggle
            autoComplete="off"
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={validate}
            error={errors.confirmPassword}
            showPasswordToggle
            autoComplete="off"
          />

          <Button 
            type="submit" 
            fullWidth 
            isLoading={isLoading}
            size="md"
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </Button>

          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            <span className="mx-2 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
          </div>

          <Button
            type="button"
            onClick={() => handleGoogleSignup()}
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
            Sign up with Google
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
