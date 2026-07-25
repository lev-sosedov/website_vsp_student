import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  NavLink,
  useNavigate,
} from 'react-router-dom';

import {
  GraduationCap,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

import {
  getUserUnreadCount,
} from '../../api/chatApi';

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
  role: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  userName: string | null | undefined,
  phoneNumber: string | null | undefined
): string {
  const normalizedRole =
    role?.trim().toLowerCase();

  let displayName = '';

  /*
   * Преподаватель, родитель и администратор:
   * user_name — имя;
   * last_name — отчество.
   *
   * Например: Антон Викторович.
   */
  if (
    normalizedRole === 'teacher' ||
    normalizedRole === 'parent' ||
    normalizedRole === 'admin'
  ) {
    displayName = [
      userName,
      lastName,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  /*
   * Студент:
   * first_name — фамилия;
   * user_name — имя.
   *
   * Например: Соседов Лев.
   */
  if (
    normalizedRole === 'student' ||
    normalizedRole === 'user'
  ) {
    displayName = [
      firstName,
      userName,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  /*
   * Запасной вариант для неизвестной роли.
   */
  if (!displayName) {
    displayName = [
      userName,
      lastName,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  if (displayName) {
    return displayName;
  }

  if (phoneNumber?.trim()) {
    return phoneNumber.trim();
  }

  return 'Пользователь';
}

function getInitials(
  displayName: string
): string {
  const words = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'П';
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`
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

function formatUnreadCount(
  unreadCount: number
): string {
  return unreadCount > 99
    ? '99+'
    : String(unreadCount);
}

export default function DashboardLayout({
  navItems,
  roleLabel,
  children,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [
    totalUnreadMessages,
    setTotalUnreadMessages,
  ] = useState(0);

  const displayName = useMemo(
    () =>
      getDisplayName(
        user?.role,
        user?.first_name,
        user?.last_name,
        user?.user_name,
        user?.phone_number
      ),
    [
      user?.role,
      user?.first_name,
      user?.last_name,
      user?.user_name,
      user?.phone_number,
    ]
  );

  const initials = useMemo(
    () => getInitials(displayName),
    [displayName]
  );

  const displayedRole = useMemo(
    () =>
      getRoleLabel(
        user?.role,
        roleLabel
      ),
    [user?.role, roleLabel]
  );

  useEffect(() => {
    if (user?.id == null) {
      setTotalUnreadMessages(0);
      return;
    }

    const userId: number = user.id;

    let isMounted = true;

    async function loadUnreadMessages(): Promise<void> {
      try {
        const response =
          await getUserUnreadCount(userId);

        if (isMounted) {
          setTotalUnreadMessages(
            Math.max(0, response.unread_count)
          );
        }
      } catch (requestError) {
        console.error(
          'Не удалось получить общий счётчик непрочитанных сообщений:',
          requestError
        );
      }
    }

    void loadUnreadMessages();

    const intervalId = window.setInterval(() => {
      void loadUnreadMessages();
    }, 5000);

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible'
      ) {
        void loadUnreadMessages();
      }
    };

    const handleWindowFocus = () => {
      void loadUnreadMessages();
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    window.addEventListener(
      'focus',
      handleWindowFocus
    );

    return () => {
      isMounted = false;

      window.clearInterval(intervalId);

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      window.removeEventListener(
        'focus',
        handleWindowFocus
      );
    };
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-100 bg-white transition-transform duration-300 lg:sticky ${
          open
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <NavLink
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            aria-label="Перейти на дашборд"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>

            <span className="font-bold text-gray-900">
              ВШП Студент
            </span>
          </NavLink>

          <button
            type="button"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 font-semibold text-red-600">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {displayName}
              </p>

              <p className="text-xs text-gray-400">
                {displayedRole}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isMessagesItem =
              item.to === '/dashboard/messages';

            return (
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
                <item.icon className="h-5 w-5 flex-shrink-0" />

                <span className="min-w-0 flex-1 truncate">
                  {item.label}
                </span>

                {isMessagesItem &&
                  totalUnreadMessages > 0 && (
                    <span
                      className="ml-auto inline-flex min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                      title={`${totalUnreadMessages} непрочитанных сообщений`}
                      aria-label={`${totalUnreadMessages} непрочитанных сообщений`}
                    >
                      {formatUnreadCount(
                        totalUnreadMessages
                      )}
                    </span>
                  )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-link w-full text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Закрыть боковое меню"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-gray-100 bg-white px-4 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-ml-2 rounded-lg p-2 transition-colors hover:bg-gray-100"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}