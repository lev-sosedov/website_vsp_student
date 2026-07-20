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
import Terms from './pages/public/Terms';
import PersonalData from './pages/public/PersonalData';
import License from './pages/public/License';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import SoftwareEngineering from './pages/public/SoftwareEngineering';
import WebDevelopment from './pages/public/WebDevelopment';
import SystemAdministration from './pages/public/SystemAdministration';
import GraphicDesign3D from './pages/public/GraphicDesign3D';
import ThreeDPrinting from './pages/public/ThreeDPrinting';
import SummerITCamp from './pages/public/SummerITCamp';


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
            <Route path="/terms" element={<Terms />} />
            <Route path="/personal-data" element={<PersonalData />} />
            <Route path="/license" element={<License />} />
            <Route path="/programs/software-engineering" element={<SoftwareEngineering />}/>
            <Route path="/programs/web-development" element={<WebDevelopment />}/>
            <Route path="/programs/system-administration" element={<SystemAdministration />}/>
            <Route path="/programs/graphic-design-3d" element={<GraphicDesign3D />}/>
            <Route path="/programs/3d-printing" element={<ThreeDPrinting />}/>
            <Route path="/programs/summer-it-camp" element={<SummerITCamp />}/>
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
