import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  GraduationCap,
  LogOut,
  Menu,
  Search,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  roleLabel: string;
  children: React.ReactNode;
}

function getDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  userName: string | null | undefined,
  phoneNumber: string | null | undefined
): string {
  const fullName = [firstName, lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (fullName) {
    return fullName;
  }

  if (userName?.trim()) {
    return userName.trim();
  }

  if (phoneNumber?.trim()) {
    return phoneNumber.trim();
  }

  return 'Пользователь';
}

function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  userName: string | null | undefined
): string {
  const firstInitial =
    firstName?.trim().charAt(0) ?? '';

  const lastInitial =
    lastName?.trim().charAt(0) ?? '';

  const fullNameInitials =
    `${firstInitial}${lastInitial}`.toUpperCase();

  if (fullNameInitials) {
    return fullNameInitials;
  }

  const normalizedUserName =
    userName?.trim() ?? '';

  if (!normalizedUserName) {
    return 'П';
  }

  const words = normalizedUserName
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`
      .toUpperCase();
  }

  return normalizedUserName
    .slice(0, 2)
    .toUpperCase();
}

function getRoleLabel(
  role: string | null | undefined,
  fallbackLabel: string
): string {
  const normalizedRole =
    role?.trim().toLowerCase();

  const roleLabels: Record<string, string> = {
    user: 'Студент',
    student: 'Студент',
    teacher: 'Преподаватель',
    parent: 'Родитель',
    admin: 'Администратор',
  };

  if (!normalizedRole) {
    return fallbackLabel;
  }

  return roleLabels[normalizedRole] ?? fallbackLabel;
}

export default function DashboardLayout({
  navItems,
  roleLabel,
  children,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const displayName = useMemo(
    () =>
      getDisplayName(
        user?.first_name,
        user?.last_name,
        user?.user_name,
        user?.phone_number
      ),
    [
      user?.first_name,
      user?.last_name,
      user?.user_name,
      user?.phone_number,
    ]
  );

  const initials = useMemo(
    () =>
      getInitials(
        user?.first_name,
        user?.last_name,
        user?.user_name
      ),
    [
      user?.first_name,
      user?.last_name,
      user?.user_name,
    ]
  );

  const displayedRole = useMemo(
    () =>
      getRoleLabel(
        user?.role,
        roleLabel
      ),
    [user?.role, roleLabel]
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 z-40 flex flex-col transition-transform duration-300 ${
          open
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>

            <span className="font-bold text-gray-900">
              ВШП Студент
            </span>
          </div>

          <button
            type="button"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-semibold">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>

              <p className="text-xs text-gray-400">
                {displayedRole}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.endsWith('/dashboard')}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? 'sidebar-link-active'
                  : 'sidebar-link'
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-link w-full text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Закрыть боковое меню"
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400" />

            <input
              type="search"
              placeholder="Поиск..."
              className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Уведомления"
            >
              <Bell className="w-5 h-5 text-gray-600" />

              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm">
                {initials}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}