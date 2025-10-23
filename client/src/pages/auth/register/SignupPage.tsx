import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { initGoogleAuth, handleGoogleSignup } from '../../../utils/googleAuth';
import { signup as apiSignup, saveAuthToken } from '../../../api/auths/auth';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initGoogleAuth(async (credential) => {
      // TODO: send credential to backend for verification and account creation/login
      alert('Google credential received: ' + credential.slice(0, 20) + '...');
    });
  }, []);

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
      const response = await apiSignup({ name, email, password });
      saveAuthToken(response.token);
      // Success - redirect to dashboard
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      setErrors({ email: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-1">Create an account</h1>
        <h6 className="text-center mb-2">Already have an account?
         <Link to="/login" className="text-blue-600 hover:underline"> Sign in</Link></h6>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={validate}
              autoComplete="off"
              className="w-full px-4 pt-4 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-transparent"
            />
            <label htmlFor="name" className={`absolute left-4 px-1 pointer-events-none transition-all duration-200 origin-left ${name ? 'top-2 text-sm translate-y-0 scale-90 text-blue-600' : 'top-1/2 -translate-y-1/2 text-base text-gray-500'}`}>
              Full name
            </label>
            {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
          </div>

          <div className="relative mt-1">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={validate}
              autoComplete="off"
              className="w-full px-4 pt-4 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-transparent"
            />
            <label htmlFor="email" className={`absolute left-4 px-1 pointer-events-none transition-all duration-200 origin-left ${email ? 'top-2 text-sm translate-y-0 scale-90 text-blue-600' : 'top-1/2 -translate-y-1/2 text-base'} ${errors.email ? 'text-red-500' : 'text-gray-500'}`}>
              Email
            </label>
            {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
          </div>

          <div className="relative mt-1">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={validate}
              autoComplete="off"
              className="w-full px-4 pt-4 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-transparent"
            />
            <label htmlFor="password" className={`absolute left-4 px-1 pointer-events-none transition-all duration-200 origin-left ${password ? 'top-2 text-sm translate-y-0 scale-90 text-blue-600' : 'top-1/2 -translate-y-1/2 text-base'} ${errors.password ? 'text-red-500' : 'text-gray-500'}`}>
              Password
            </label>
            {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password}</div>}
          </div>

          <div className="relative mt-1">
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={validate}
              autoComplete="off"
              className="w-full px-4 pt-4 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-transparent"
            />
            <label htmlFor="confirmPassword" className={`absolute left-4 px-1 pointer-events-none transition-all duration-200 origin-left ${confirmPassword ? 'top-2 text-sm translate-y-0 scale-90 text-blue-600' : 'top-1/2 -translate-y-1/2 text-base'} ${errors.confirmPassword ? 'text-red-500' : 'text-gray-500'}`}>
              Confirm Password
            </label>
            {errors.confirmPassword && <div className="text-xs text-red-500 mt-1">{errors.confirmPassword}</div>}
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors duration-150">
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>

          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-300" />
            <span className="mx-2 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-300" />
          </div>

          <button type="button" onClick={() => handleGoogleSignup()} className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-900 hover:bg-gray-800 transition-colors duration-150 mb-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-medium text-white">Sign up with Google</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
