import {
  AlertCircle,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Layers,
  Loader2,
  MessageSquare,
  Newspaper,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../context/AuthContext';
import {
  getAdminDashboardUserName,
  loadAdminDashboard,
  type AdminDashboardData,
  type AdminDashboardRole,
} from '../../../services/adminDashboardService';

type CardTone =
  | 'red'
  | 'blue'
  | 'violet'
  | 'amber'
  | 'green'
  | 'slate';

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  to: string;
  icon: LucideIcon;
  tone: CardTone;
}

interface AttentionItemProps {
  title: string;
  description: string;
  value: number | null;
  to: string;
  tone?: 'amber' | 'red' | 'blue';
}

interface QuickLinkProps {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

const TONE_CLASSES: Record<
  CardTone,
  {
    icon: string;
    background: string;
  }
> = {
  red: {
    icon: 'text-red-600',
    background: 'bg-red-50',
  },
  blue: {
    icon: 'text-blue-600',
    background: 'bg-blue-50',
  },
  violet: {
    icon: 'text-violet-600',
    background: 'bg-violet-50',
  },
  amber: {
    icon: 'text-amber-600',
    background: 'bg-amber-50',
  },
  green: {
    icon: 'text-green-600',
    background: 'bg-green-50',
  },
  slate: {
    icon: 'text-slate-600',
    background: 'bg-slate-100',
  },
};

const ROLE_LABELS: Record<
  AdminDashboardRole,
  string
> = {
  user: 'Новая регистрация',
  parent: 'Родитель',
  student: 'Студент',
  teacher: 'Преподаватель',
  admin: 'Администратор',
};

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось загрузить дашборд';
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    'ru-RU'
  ).format(value);
}

function formatDateTime(
  value: string
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Дата не указана';
  }

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

function normalizeRole(
  role: string
): AdminDashboardRole {
  const normalized =
    role.trim().toLowerCase();

  return (
    normalized === 'parent' ||
    normalized === 'student' ||
    normalized === 'teacher' ||
    normalized === 'admin'
  )
    ? normalized
    : 'user';
}

function getInitials(
  name: string
): string {
  const parts = name
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getLessonStatusLabel(
  status: string
): string {
  switch (
    status.trim().toLowerCase()
  ) {
    case 'completed':
      return 'Завершено';

    case 'rescheduled':
      return 'Перенесено';

    case 'scheduled':
    default:
      return 'Запланировано';
  }
}

function StatCard({
  title,
  value,
  subtitle,
  to,
  icon: Icon,
  tone,
}: StatCardProps) {
  const toneClasses =
    TONE_CLASSES[tone];

  return (
    <Link
      to={to}
      className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNumber(value)}
          </p>
        </div>

        <div
          className={`rounded-xl p-2.5 ${toneClasses.background}`}
        >
          <Icon
            className={`h-5 w-5 ${toneClasses.icon}`}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-gray-500">
          {subtitle}
        </p>

        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-red-500" />
      </div>
    </Link>
  );
}

function AttentionItem({
  title,
  description,
  value,
  to,
  tone = 'amber',
}: AttentionItemProps) {
  const toneClasses = {
    amber:
      'border-amber-200 bg-amber-50 text-amber-800',
    red:
      'border-red-200 bg-red-50 text-red-800',
    blue:
      'border-blue-200 bg-blue-50 text-blue-800',
  }[tone];

  return (
    <Link
      to={to}
      className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${toneClasses}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {title}
          </p>

          <p className="mt-1 text-xs opacity-75">
            {description}
          </p>
        </div>

        <span className="text-2xl font-bold">
          {value === null
            ? '—'
            : formatNumber(value)}
        </span>
      </div>
    </Link>
  );
}

function QuickLink({
  label,
  description,
  to,
  icon: Icon,
  badge,
}: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:border-red-200 hover:bg-red-50"
    >
      <div className="rounded-lg bg-gray-100 p-2 text-gray-500 transition group-hover:bg-white group-hover:text-red-600">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">
          {label}
        </p>

        <p className="truncate text-xs text-gray-500">
          {description}
        </p>
      </div>

      {badge !== undefined && (
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 group-hover:bg-white group-hover:text-red-600">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function AdminDashboard() {
  const {
    user,
  } = useAuth();

  const adminId =
    Number(user?.id);

  const [
    data,
    setData,
  ] = useState<
    AdminDashboardData | null
  >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const [
    _updatedAt,
    setUpdatedAt,
  ] = useState<Date | null>(
    null
  );

  const loadDashboard =
    useCallback(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result =
          await loadAdminDashboard(
            adminId
          );

        setData(result);
        setUpdatedAt(new Date());
      } catch (loadError) {
        setData(null);
        setError(
          getErrorMessage(
            loadError
          )
        );
      } finally {
        setIsLoading(false);
      }
    }, [adminId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalAttention =
    useMemo(() => {
      if (!data) {
        return 0;
      }

      return (
        data.roleStats.user.total +
        data.unverifiedUsers +
        data.groupsWithoutTeacher +
        (
          data.parentsWithoutChildren ??
          0
        )
      );
    }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />

          <p>
            Собираем сводку платформы...
          </p>
        </div>
      </div>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="flex-1">
            <h2 className="font-bold text-red-800">
              Не удалось загрузить дашборд
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error ??
                'Данные не получены'}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards: StatCardProps[] = [
    {
      title: 'Студенты',
      value:
        data.roleStats.student.total,
      subtitle:
        `Активных: ${data.roleStats.student.active} · в группах: ${data.studentsInGroups}`,
      to: '/dashboard/students',
      icon: Users,
      tone: 'red',
    },
    {
      title: 'Преподаватели',
      value:
        data.roleStats.teacher.total,
      subtitle:
        `Активных: ${data.roleStats.teacher.active}`,
      to: '/dashboard/teachers',
      icon: GraduationCap,
      tone: 'blue',
    },
    {
      title: 'Родители',
      value:
        data.roleStats.parent.total,
      subtitle:
        `Активных: ${data.roleStats.parent.active}`,
      to: '/dashboard/parents',
      icon: UserCog,
      tone: 'violet',
    },
    {
      title: 'Группы',
      value:
        data.activeGroups,
      subtitle:
        `Всего: ${data.totalGroups}`,
      to: '/dashboard/groups',
      icon: Layers,
      tone: 'amber',
    },
    {
      title: 'Филиалы',
      value:
        data.activeBranches,
      subtitle:
        `Всего: ${data.totalBranches}`,
      to: '/dashboard/branches',
      icon: Building2,
      tone: 'green',
    },
    {
      title: 'Учебные программы',
      value:
        data.activePrograms,
      subtitle:
        `Всего: ${data.totalPrograms}`,
      to: '/dashboard/programs',
      icon: BookOpen,
      tone: 'slate',
    },
  ];

  const quickLinks: QuickLinkProps[] = [
    {
      label: 'Администраторы',
      description:
        'Полный доступ',
      to: '/dashboard/administrators',
      icon: ShieldCheck,
      badge: String(
        data.roleStats.admin.total
      ),
    },
    {
      label: 'Расписание',
      description:
        'Занятия и шаблоны',
      to: '/dashboard/schedule',
      icon: CalendarDays,
      badge: String(
        data.todayLessons.length
      ),
    },
    {
      label: 'Новости',
      description:
        'Публикации школы',
      to: '/dashboard/news',
      icon: Newspaper,
      badge:
        data.publishedNews === null
          ? '—'
          : String(
              data.publishedNews
            ),
    },
    {
      label: 'Роли',
      description:
        'Назначение доступа',
      to: '/dashboard/roles',
      icon: ShieldAlert,
      badge: String(
        data.roleStats.user.total
      ),
    },
    {
      label: 'Аналитика',
      description:
        'Подробная статистика',
      to: '/dashboard/progress',
      icon: TrendingUp,
    },
    {
      label: 'Уведомления',
      description:
        'События платформы',
      to: '/dashboard/notifications',
      icon: Bell,
      badge:
        data.unreadNotifications ===
        null
          ? '—'
          : String(
              data.unreadNotifications
            ),
    },
    {
      label: 'Сообщения',
      description:
        'Чаты пользователей',
      to: '/dashboard/messages',
      icon: MessageSquare,
    },
    {
      label: 'Настройки',
      description:
        'Профиль администратора',
      to: '/dashboard/profile',
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
            <CheckCircle2 className="h-4 w-4" />
            Состояние платформы
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Панель администратора
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Краткая сводка по текущим данным
            системы
          </p>
        </div>
      </div>

      {data.warnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Часть дополнительных данных
              недоступна
            </p>

            <p className="mt-1 text-xs leading-5">
              {data.warnings.join(' ')}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            {...card}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />

            <h2 className="font-bold text-gray-900">
              Требуют внимания
            </h2>
          </div>

          <p className="text-sm text-gray-500">
            Всего задач:
            {' '}
            <span className="font-bold text-gray-900">
              {formatNumber(
                totalAttention
              )}
            </span>
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AttentionItem
            title="Без назначенной роли"
            description="Новые пользователи с ролью user"
            value={
              data.roleStats.user.total
            }
            to="/dashboard/roles"
            tone="amber"
          />

          <AttentionItem
            title="Не подтверждены"
            description="Аккаунт или телефон требуют проверки"
            value={
              data.unverifiedUsers
            }
            to="/dashboard/roles"
            tone="blue"
          />

          <AttentionItem
            title="Группы без преподавателя"
            description="Нужно назначить преподавателя"
            value={
              data.groupsWithoutTeacher
            }
            to="/dashboard/groups"
            tone="red"
          />

          <AttentionItem
            title="Родители без детей"
            description="Нет активной привязки к студенту"
            value={
              data.parentsWithoutChildren
            }
            to="/dashboard/parents"
            tone="amber"
          />
        </div>

        {data.blockedUsers > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Заблокированных учётных записей:
            {' '}
            <span className="font-semibold text-gray-700">
              {data.blockedUsers}
            </span>
          </p>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-red-600" />

                <h2 className="font-bold text-gray-900">
                  Сегодня
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Занятий:
                {' '}
                {data.todayLessons.length}
              </p>
            </div>

            <Link
              to="/dashboard/schedule"
              className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Расписание
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {data.todayLessons.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
              <CalendarDays className="h-10 w-10 text-gray-300" />

              <p className="mt-3 font-semibold text-gray-800">
                На сегодня занятий нет
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Создать или проверить расписание
                можно в отдельном разделе.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.todayLessons
                .slice(0, 5)
                .map((lesson) => (
                  <Link
                    key={lesson.id}
                    to="/dashboard/schedule"
                    className="grid gap-3 px-5 py-3.5 transition hover:bg-gray-50 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                      <Clock3 className="h-4 w-4" />

                      {lesson.startTime.slice(
                        0,
                        5
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {lesson.topic}
                      </p>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {lesson.groupName}
                        {' · '}
                        {lesson.teacherName}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      {getLessonStatusLabel(
                        lesson.status
                      )}
                    </span>
                  </Link>
                ))}

              {data.todayLessons.length >
                5 && (
                <div className="px-5 py-3 text-center text-sm text-gray-500">
                  Ещё занятий:
                  {' '}
                  {data.todayLessons.length -
                    5}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />

                <h2 className="font-bold text-gray-900">
                  Последние регистрации
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Последние пять пользователей
              </p>
            </div>

            <Link
              to="/dashboard/roles"
              className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Роли
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {data.recentUsers.length === 0 ? (
            <div className="flex min-h-52 items-center justify-center px-5 py-10 text-sm text-gray-500">
              Пользователи пока не зарегистрированы
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recentUsers.map(
                (recentUser) => {
                  const role =
                    normalizeRole(
                      recentUser.role
                    );

                  const name =
                    getAdminDashboardUserName(
                      recentUser
                    );

                  return (
                    <div
                      key={recentUser.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-600">
                        {getInitials(name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {formatDateTime(
                            recentUser.created_at
                          )}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          role === 'user'
                            ? 'bg-amber-50 text-amber-700'
                            : recentUser.is_active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ROLE_LABELS[role]}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-bold text-gray-900">
          Быстрый переход
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <QuickLink
              key={item.to}
              {...item}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
