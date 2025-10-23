import HomePage from "./pages/home/HomePage"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import SignupPage from "./pages/auth/register/SignupPage"
import LoginPage from "./pages/auth/login/LoginPage"
import Dashboard from "./pages/dashboard/Dashboard"

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
   
  )
}

export default App
