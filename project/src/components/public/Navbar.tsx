import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, GraduationCap } from 'lucide-react';

import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { getUserDisplayName } from '../../utils/userDisplayName';

const navLinks = [
  { to: '/', label: 'Главная' },
  { to: '/about', label: 'О школе' },
  { to: '/programs', label: 'Курсы' },
  { to: '/questions', label: 'Вопросы' },
  { to: '/news', label: 'Новости' },
  { to: '/reviews', label: 'Отзывы' },
  { to: '/contacts', label: 'Контакты' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();

  const displayName = user
    ? getUserDisplayName(user)
    : 'Личный кабинет';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-lg border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">ВШП Студент</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center">
            {loading ? (
              <div
                className="h-10 w-10 animate-pulse rounded-full bg-gray-200"
                aria-label="Проверка авторизации"
              />
            ) : isAuthenticated && user ? (
              <Link
                to="/dashboard"
                title="Перейти в личный кабинет"
                aria-label={`Перейти в личный кабинет: ${displayName}`}
                className="group rounded-full ring-offset-2 transition hover:ring-2 hover:ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <UserAvatar
                  avatarUrl={user.avatar_url}
                  alt={displayName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-primary text-sm py-2.5"
              >
                Войти
              </Link>
            )}
          </div>

          <button
            className="lg:hidden p-2 -mr-2"
            onClick={() => setOpen(!open)}
            aria-label="Меню"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-b border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100">
              {loading ? (
                <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
              ) : isAuthenticated && user ? (
                <Link
                  to="/dashboard"
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <UserAvatar
                    avatarUrl={user.avatar_url}
                    alt={displayName}
                    className="h-9 w-9 rounded-full object-cover"
                  />

                  <span className="min-w-0">
                    <span className="block truncate">
                      {displayName}
                    </span>
                    <span className="block text-xs font-normal text-gray-500">
                      Перейти в личный кабинет
                    </span>
                  </span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary justify-center w-full"
                >
                  Войти
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
