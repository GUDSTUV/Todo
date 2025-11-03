import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { initGoogleAuth, handleGoogleSignup } from '../../../utils/googleAuth';
import api from '../../../api/client/client';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/button/Button';
import ErrorAlert from '../../../components/ui/errorAlert/ErrorAlert';
import GoogleAuthButton from '../../../components/ui/googleAuthButton/GoogleAuthButton';

const signupSchema = z
  .object({
    name: z.string().min(2, { message: 'Please enter your name' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      }),
    confirmPassword: z.string().min(6, { message: 'Confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginToStore = useAuthStore((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [invitedBy, setInvitedBy] = useState<string>('');
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // Pre-fill email from invitation link
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    const inviterName = searchParams.get('invitedBy');
    if (emailFromUrl) {
      setEmail(decodeURIComponent(emailFromUrl));
    }
    if (inviterName) {
      setInvitedBy(decodeURIComponent(inviterName));
    }
  }, [searchParams]);

  useEffect(() => {
    initGoogleAuth(async (credential) => {
      try {
        const resp = await api.post('/auth/google/verify', { credential });
        const { token, user } = resp.data as { token: string; user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
        loginToStore(user, token, true); // Default to remember me for new signups
        toast.success('Signed in with Google');
        navigate(redirectPath);
      } catch {
        toast.error('Google sign-in failed');
      }
    });
  }, [loginToStore, navigate, redirectPath]);

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
    setServerError(''); // Clear previous server errors
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/signup', { name, email, password });
      const { token, user } = response.data as { token: string; user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
      loginToStore(user, token, true); // Default to remember me for new signups
      toast.success('Account created successfully');
      navigate(redirectPath);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; details?: Array<{field: string; message: string}> }; status?: number }; message?: string };
      
      // Check if there are validation details from the server
      if (err?.response?.data?.details && Array.isArray(err.response.data.details)) {
        const message = err.response.data.details.map((d: {field: string; message: string}) => `${d.field}: ${d.message}`).join(', ');
        setServerError(message);
        toast.error(message);
      } else {
        const message = err?.response?.data?.error || 'Signup failed. Please try again.';
        setServerError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-center mb-1">Create an account</h1>
        
        {invitedBy && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  You've been invited!
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  <strong>{invitedBy}</strong> invited you to collaborate on Todu
                </p>
              </div>
            </div>
          </div>
        )}
        
        <h6 className="text-center mb-2">Already have an account?
         <Link to="/login" className="text-blue-600 hover:underline"> Sign in</Link></h6>
        <form onSubmit={handleSubmit} noValidate className="space-y-2">
          <Input
            id="name"
            type="text"
            label="Full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setServerError('');
              // Clear name error when user starts typing
              if (errors.name) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { name: _, ...rest } = errors;
                setErrors(rest);
              }
            }}
            onBlur={validate}
            error={errors.name}
            autoComplete="off"
          />

          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setServerError('');
              // Clear email error when user starts typing
              if (errors.email) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { email: _, ...rest } = errors;
                setErrors(rest);
              }
            }}
            onBlur={validate}
            error={errors.email}
            autoComplete="off"
          />

          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setServerError('');
              // Clear password errors when user starts typing
              if (errors.password || errors.confirmPassword) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password: _, confirmPassword: __, ...rest } = errors;
                setErrors(rest);
              }
            }}
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
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setServerError('');
              // Clear confirmPassword error when user starts typing
              if (errors.confirmPassword) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { confirmPassword: _, ...rest } = errors;
                setErrors(rest);
              }
            }}
            onBlur={validate}
            error={errors.confirmPassword}
            showPasswordToggle
            autoComplete="off"
          />
          
          {/* Server Error Message */}
          <ErrorAlert message={serverError} onDismiss={() => setServerError('')} />

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

          <GoogleAuthButton 
            onClick={() => handleGoogleSignup()}
            text="Sign up with Google"
          />
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
