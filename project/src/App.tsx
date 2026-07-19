import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './components/public/PublicLayout';
import AuthLayout from './components/auth/AuthLayout';
import DashboardRouter from './components/DashboardRouter';
import Home from './pages/public/Home';
import About from './pages/public/About';
import Programs from './pages/public/Programs';
import Teachers from './pages/public/Teachers';
import News from './pages/public/News';
import Reviews from './pages/public/Reviews';
import Contacts from './pages/public/Contacts';
import Privacy from './pages/public/Privacy';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/news" element={<News />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/privacy" element={<Privacy />} />
          </Route>

          {/* Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Dashboard */}
          <Route path="/dashboard/*" element={<DashboardRouter />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
