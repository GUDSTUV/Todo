import HomePage from "./pages/home/HomePage"
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom"
// import SignupPageNew from "./pages/auth/register/SignupPageNew"
// import LoginPageNew from "./pages/auth/login/LoginPageNew"
import { Providers } from "./components/providers/Providers"
import { useEffect } from "react"
import Dashboard from "./pages/dashboard/Dashboard"
import LoginPage from "./pages/auth/login/LoginPage"
import SignupPage from "./pages/auth/register/SignupPage"
import ForgotPasswordPage from "./pages/auth/forgotPassword/ForgotPasswordPage"
import ResetPasswordPage from "./pages/auth/resetPassword/ResetPasswordPage"
import SettingsPage from "./pages/settings/SettingsPage"
import MessagesPage from "./pages/messages/MessagesPage"
import InvitePage from "./pages/invite/InvitePage"
import { DebugPage } from "./pages/debug/DebugPage"
import { useAuthStore } from "./store/authStore"
import api from "./api/client/client"



function App() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  
  // Initialize auth state from storage on app load
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Theme initialization moved to themeStore with auto-init
  return (
    <Providers>
      <BrowserRouter>
        <AuthBootstrapper />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/debug" element={<DebugPage />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}

// Captures OAuth redirect tokens like /dashboard?token=... and finalizes login
const AuthBootstrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const loginToStore = useAuthStore((s) => s.login);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) return;

    // Fetch current user profile, then complete login and clean URL
    (async () => {
      try {
        // Temporarily set token for this request
        localStorage.setItem('authToken', token);
        const resp = await api.get('/auth/me');
        const { user } = resp.data as { user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
        loginToStore(user, token, true); // Token from URL, remember the user (OAuth login defaults to remember)
        // Replace URL without the token param
        navigate('/dashboard', { replace: true });
      } catch {
        // If fetching profile fails, send to login
        navigate('/login', { replace: true });
      }
    })();
  }, [location.search, loginToStore, navigate]);

  return null;
}

export default App
