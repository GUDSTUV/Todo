import HomePage from "./pages/home/HomePage"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import SignupPageNew from "./pages/auth/register/SignupPageNew"
import LoginPageNew from "./pages/auth/login/LoginPageNew"
import Dashboard from "./pages/dashboard/Dashboard"
import TestPage from "./pages/TestPage"
import { Providers } from "./components/providers/Providers"
import { useEffect } from "react"
import { useThemeStore } from "./store/themeStore"

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    // Initialize theme on app mount
    initTheme();
  }, [initTheme]);

  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TestPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPageNew />} />
          <Route path="/signup" element={<SignupPageNew />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}

export default App
