import HomePage from "./pages/home/HomePage"
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom"
// import SignupPageNew from "./pages/auth/register/SignupPageNew"
// import LoginPageNew from "./pages/auth/login/LoginPageNew"
import { Providers } from "./components/providers/Providers"
import { useEffect } from "react"
import Dashboard from "./pages/dashboard/Dashboard"
import LoginPage from "./pages/auth/login/LoginPage"
import SignupPage from "./pages/auth/register/SignupPage"
import { useAuthStore } from "./store/authStore"
import api from "./api/client/client"



function App() {
  // Theme initialization moved to themeStore with auto-init
  return (
    <Providers>
      <BrowserRouter>
        <AuthBootstrapper />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
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

    console.log('[AuthBootstrapper] Token detected in URL, processing OAuth redirect...');
    console.log('[AuthBootstrapper] Token value:', token);
    
    // Persist token so axios attaches it
    localStorage.setItem('authToken', token);
    console.log('[AuthBootstrapper] Token stored in localStorage');

    // Fetch current user profile, then complete login and clean URL
    (async () => {
      try {
        console.log('[AuthBootstrapper] Fetching user profile from /auth/me...');
        console.log('[AuthBootstrapper] Token from localStorage:', localStorage.getItem('authToken'));
        const resp = await api.get('/auth/me');
        const { user } = resp.data as { user: { id: string; name: string; email: string; preferences: { theme: 'light' | 'dark' | 'system'; timezone: string; language: string } } };
        console.log('[AuthBootstrapper] User profile fetched:', user);
        loginToStore(user, token);
        console.log('[AuthBootstrapper] Login complete, navigating to dashboard...');
        // Replace URL without the token param
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('[AuthBootstrapper] Failed to fetch user profile:', err);
        const axiosErr = err as { response?: { status?: number; data?: unknown } };
        console.error('[AuthBootstrapper] Error details - Status:', axiosErr.response?.status, 'Data:', axiosErr.response?.data);
        // If fetching profile fails, send to login
        navigate('/login', { replace: true });
      }
    })();
  }, [location.search, loginToStore, navigate]);

  return null;
}

export default App
