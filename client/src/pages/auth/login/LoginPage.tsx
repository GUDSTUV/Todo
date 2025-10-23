import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { initGoogleAuth, handleGoogleLogin as triggerGoogleLogin } from '../../../utils/googleAuth';
import { login as apiLogin, saveAuthToken } from '../../../api/auth';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
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
    setFocused((prev) => ({ ...prev, [field]: false }));
    validate();
  };

  const handleFocus = (field: 'email' | 'password') => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await apiLogin({ email, password });
      saveAuthToken(response.token);
      // Success - redirect to dashboard
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrors({ email: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // register the google credential callback; backend wiring TBD
    initGoogleAuth(async (credential) => {
      // TODO: send credential to backend for verification / create session
      alert('Google credential received: ' + credential.slice(0, 20) + '...');
    });
  }, []);

  const handleGoogleLogin = () => {
    // trigger the Google credential chooser (defined in utils)
    triggerGoogleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center  px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-2">Login into your account</h1>
        <h6 className="text-center mb-5">don't have an account
         <Link to="/signup" className="text-blue-600 hover:underline"> Sign up</Link></h6>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email Input with Floating Label */}
      <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => {
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
                onFocus={() => handleFocus('email')}
                required
                autoComplete="off"
                className={`w-full px-4 pt-4 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all peer bg-transparent ${errors.email && touched.email ? 'border-red-500' : ''}`}
              />
            <label
              htmlFor="email"
              className={`absolute left-4 px-1 text-gray-500 pointer-events-none transition-all duration-200 origin-left ${focused.email || email ? 'top-2 text-sm translate-y-0 scale-90 text-blue-600' : 'top-1/2 -translate-y-1/2 text-base'} ${errors.email && touched.email ? 'text-red-500' : ''}`}
            >
              Email
            </label>
            {errors.email && touched.email && (
              <div className="text-xs text-red-500 mt-1">{errors.email}</div>
            )}
          </div>
          {/* Password Input with Floating Label */}
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => {
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
              onFocus={() => handleFocus('password')}
              required
              autoComplete="off"
              className={`w-full px-4 pt-4 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all peer bg-transparent ${errors.password && touched.password ? 'border-red-500' : ''}`}
              placeholder=" "
            />
            <label
              htmlFor="password"
              className={`absolute left-4 px-1 text-gray-500 pointer-events-none transition-all duration-200 origin-left ${focused.password || password ? 'top-2 text-sm translate-y-0 scale-90 text-blue-600' : 'top-1/2 -translate-y-1/2 text-base'} ${errors.password && touched.password ? 'text-red-500' : ''}`}
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
            {errors.password && touched.password && (
              <div className="text-xs text-red-500 mt-1">{errors.password}</div>
            )}
          </div>
          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <div>
            <input type="checkbox" id="rememberMe" name="rememberMe" className="mr-2" />
            <label htmlFor="rememberMe" className="text-sm">Remember Me</label>
            </div>
            <a href="/auth/forgetPassword" className="text-blue-600 hover:underline">Forget password</a>
          </div>
          {/* Submit Button */}
          <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          {/* Divider */}
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-300" />
            <span className="mx-2 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-300" />
          </div>
          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-900 hover:bg-gray-800 transition-colors duration-150 mb-1"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-medium text-white">Login with Google</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;