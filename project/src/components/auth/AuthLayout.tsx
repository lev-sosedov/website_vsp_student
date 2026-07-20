import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import heroSchool from "../../assets/images/auth/auth-school.webp";


export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={heroSchool}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/80 to-red-900/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">ВШП Студент</span>
          </Link>
          <div>
            <h2 className="text-4xl font-bold mb-4 leading-tight text-balance">
              Образование, которое меняет карьеру
            </h2>
            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              Войдите в личный кабинет, чтобы получить доступ к расписанию, домашним заданиям, материалам и прогрессу.
            </p>
          </div>
          <p className="text-white/60 text-sm">© 2026 ВШП Студент</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">ВШП Студент</span>
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
