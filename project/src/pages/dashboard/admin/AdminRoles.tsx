import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  activateUser,
  blockUser,
  changeUserRole,
  deleteUser,
  getUsers,
  type UserProfile,
} from '../../../api/userApi';
import UserAvatar from '../../../components/common/UserAvatar';
import { useAuth } from '../../../context/AuthContext';

type UserRole =
  | 'user'
  | 'parent'
  | 'student'
  | 'teacher'
  | 'admin';

type RoleFilter = UserRole | 'all';

const ROLE_OPTIONS: Array<{
  value: UserRole;
  label: string;
  description: string;
}> = [
  {
    value: 'user',
    label: 'Новые пользователи',
    description: 'Зарегистрированы, роль ещё не назначена',
  },
  {
    value: 'parent',
    label: 'Родители',
    description: 'Имеют доступ к данным своих детей',
  },
  {
    value: 'student',
    label: 'Студенты',
    description: 'Участники учебных групп',
  },
  {
    value: 'teacher',
    label: 'Преподаватели',
    description: 'Ведут группы и занятия',
  },
  {
    value: 'admin',
    label: 'Администраторы',
    description: 'Имеют полный доступ к системе',
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Новый пользователь',
  parent: 'Родитель',
  student: 'Студент',
  teacher: 'Преподаватель',
  admin: 'Администратор',
};

const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  user: 'bg-amber-50 text-amber-700 ring-amber-200',
  parent: 'bg-violet-50 text-violet-700 ring-violet-200',
  student: 'bg-blue-50 text-blue-700 ring-blue-200',
  teacher: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  admin: 'bg-red-50 text-red-700 ring-red-200',
};

function normalizeRole(role: string): UserRole {
  const normalized = role.trim().toLowerCase();

  return ROLE_OPTIONS.some(
    (item) => item.value === normalized
  )
    ? (normalized as UserRole)
    : 'user';
}

function getUserName(user: UserProfile): string {
  const fullName = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    fullName ||
    user.user_name ||
    `Пользователь #${user.id}`
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Дата не указана';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить операцию';
}

async function loadAllUsers(): Promise<UserProfile[]> {
  const pageSize = 100;
  let skip = 0;
  let total = Number.POSITIVE_INFINITY;
  const users: UserProfile[] = [];

  while (skip < total) {
    const response = await getUsers({
      skip,
      limit: pageSize,
    });

    users.push(...response.items);
    total = response.total;

    if (response.items.length === 0) {
      break;
    }

    skip += response.items.length;
  }

  return users.sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime()
  );
}

export default function AdminRoles() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] =
    useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] =
    useState<RoleFilter>('user');
  const [searchValue, setSearchValue] =
    useState('');
  const [
    changingUserId,
    setChangingUserId,
  ] = useState<number | null>(null);
  const [
    statusChangingUserId,
    setStatusChangingUserId,
  ] = useState<number | null>(null);
  const [
    userToDelete,
    setUserToDelete,
  ] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] =
    useState(false);
  const [pendingRoles, setPendingRoles] =
    useState<Record<number, UserRole>>({});

  const loadUsers = useCallback(
    async (background = false) => {
      if (!background) {
        setIsLoading(true);
      }

      setError(null);

      try {
        const loadedUsers =
          await loadAllUsers();

        setUsers(loadedUsers);
        setPendingRoles(
          Object.fromEntries(
            loadedUsers.map((user) => [
              user.id,
              normalizeRole(user.role),
            ])
          )
        );
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timerId = window.setTimeout(
      () => setSuccessMessage(null),
      4000
    );

    return () =>
      window.clearTimeout(timerId);
  }, [successMessage]);

  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      user: 0,
      parent: 0,
      student: 0,
      teacher: 0,
      admin: 0,
    };

    users.forEach((user) => {
      counts[normalizeRole(user.role)] += 1;
    });

    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const search = searchValue
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const role = normalizeRole(user.role);

      if (
        activeFilter !== 'all' &&
        role !== activeFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        getUserName(user),
        user.user_name,
        user.phone_number,
        user.email,
        ROLE_LABELS[role],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [activeFilter, searchValue, users]);

  const handleRoleChange = async (
    user: UserProfile,
    nextRole: UserRole
  ) => {
    const currentRole =
      normalizeRole(user.role);

    setPendingRoles((current) => ({
      ...current,
      [user.id]: nextRole,
    }));

    if (nextRole === currentRole) {
      return;
    }

    setChangingUserId(user.id);
    setError(null);

    try {
      const updatedUser =
        await changeUserRole(
          user.id,
          nextRole
        );

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                ...updatedUser,
                role: nextRole,
              }
            : item
        )
      );

      setSuccessMessage(
        `${getUserName(user)}: назначена роль «${ROLE_LABELS[nextRole]}»`
      );
    } catch (changeError) {
      setPendingRoles((current) => ({
        ...current,
        [user.id]: currentRole,
      }));
      setError(
        getErrorMessage(changeError)
      );
    } finally {
      setChangingUserId(null);
    }
  };

  const handleStatusChange = async (
    user: UserProfile
  ) => {
    if (currentUser?.id === user.id) {
      setError(
        'Нельзя заблокировать собственную учётную запись'
      );
      return;
    }

    setStatusChangingUserId(user.id);
    setError(null);

    try {
      const updatedUser = user.is_active
        ? await blockUser(user.id)
        : await activateUser(user.id);

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                ...updatedUser,
              }
            : item
        )
      );

      setSuccessMessage(
        user.is_active
          ? `${getUserName(user)}: доступ заблокирован`
          : `${getUserName(user)}: доступ восстановлен`
      );
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setStatusChangingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    if (currentUser?.id === userToDelete.id) {
      setError(
        'Нельзя удалить собственную учётную запись'
      );
      setUserToDelete(null);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteUser(userToDelete.id);

      setUsers((current) =>
        current.filter(
          (item) => item.id !== userToDelete.id
        )
      );

      setPendingRoles((current) => {
        const next = { ...current };
        delete next[userToDelete.id];
        return next;
      });

      setSuccessMessage(
        `${getUserName(userToDelete)}: пользователь удалён`
      );
      setUserToDelete(null);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <p>Загружаем пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
            <ShieldCheck className="h-4 w-4" />
            Управление доступом
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Роли пользователей
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            После регистрации пользователь
            попадает в раздел новых пользователей
            с ролью «user». Назначьте ему одну
            основную роль — после сохранения он
            автоматически перейдёт в
            соответствующий список.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <Clock3 className="h-4 w-4" />
            Ожидают назначения:
            {' '}
            {roleCounts.user}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void loadUsers()}
              className="mt-2 font-semibold underline underline-offset-2"
            >
              Повторить загрузку
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ROLE_OPTIONS.map((role) => {
          const isActive =
            activeFilter === role.value;

          return (
            <button
              key={role.value}
              type="button"
              onClick={() =>
                setActiveFilter(role.value)
              }
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? 'border-red-300 bg-red-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {role.label}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {role.description}
                  </p>
                </div>

                <span className="rounded-full bg-white px-2.5 py-1 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-gray-200">
                  {roleCounts[role.value]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              {activeFilter === 'all'
                ? 'Все пользователи'
                : ROLE_OPTIONS.find(
                    (role) =>
                      role.value ===
                      activeFilter
                  )?.label}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Найдено пользователей:
              {' '}
              {filteredUsers.length}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Имя, телефон или email"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setActiveFilter('all')
              }
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Показать всех
            </button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Users className="h-11 w-11 text-gray-300" />

            <h3 className="mt-4 font-semibold text-gray-900">
              Пользователи не найдены
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              В выбранной роли пока никого нет
              или пользователи не соответствуют
              поиску.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => {
              const currentRole =
                normalizeRole(user.role);
              const isChanging =
                changingUserId === user.id;
              const isStatusChanging =
                statusChangingUserId === user.id;
              const isCurrentUser =
                currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(260px,1fr)_minmax(180px,0.55fr)_minmax(220px,0.75fr)_minmax(190px,0.65fr)] lg:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      avatarUrl={user.avatar_url}
                      alt={getUserName(user)}
                      className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {getUserName(user)}
                      </p>

                      <p className="truncate text-sm text-gray-500">
                        {user.phone_number}
                        {user.email
                          ? ` · ${user.email}`
                          : ''}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Регистрация:
                        {' '}
                        {formatDate(
                          user.created_at
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${ROLE_BADGE_CLASSES[currentRole]}`}
                    >
                      {ROLE_LABELS[currentRole]}
                    </span>

                    {!user.is_active && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                        Заблокирован
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`role-${user.id}`}
                      className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      <UserCog className="h-4 w-4" />
                      Назначить роль
                    </label>

                    <div className="relative">
                      <select
                        id={`role-${user.id}`}
                        value={
                          pendingRoles[user.id] ??
                          currentRole
                        }
                        disabled={isChanging}
                        onChange={(event) =>
                          void handleRoleChange(
                            user,
                            event.target
                              .value as UserRole
                          )
                        }
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-wait disabled:bg-gray-50"
                      >
                        {ROLE_OPTIONS.map(
                          (role) => (
                            <option
                              key={role.value}
                              value={role.value}
                            >
                              {
                                ROLE_LABELS[
                                  role.value
                                ]
                              }
                            </option>
                          )
                        )}
                      </select>

                      {isChanging && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-red-600" />
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Действия
                    </p>

                    <div className="flex flex-col gap-2">
                      {currentRole !== 'user' && (
                        <button
                          type="button"
                          disabled={
                            isStatusChanging ||
                            isCurrentUser
                          }
                          onClick={() =>
                            void handleStatusChange(user)
                          }
                          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.is_active
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                          title={
                            isCurrentUser
                              ? 'Нельзя заблокировать собственную учётную запись'
                              : undefined
                          }
                        >
                          {isStatusChanging ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.is_active ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}

                          {user.is_active
                            ? 'Заблокировать'
                            : 'Активировать'}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isCurrentUser}
                        onClick={() =>
                          setUserToDelete(user)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title={
                          isCurrentUser
                            ? 'Нельзя удалить собственную учётную запись'
                            : undefined
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        {currentRole === 'user'
                          ? 'Удалить навсегда'
                          : 'Удалить'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isDeleting
            ) {
              setUserToDelete(null);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>

                <div>
                  <h2
                    id="delete-user-title"
                    className="text-lg font-bold text-gray-900"
                  >
                    Удалить пользователя?
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {getUserName(userToDelete)}
                    {' · '}
                    {userToDelete.phone_number}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  setUserToDelete(null)
                }
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {normalizeRole(userToDelete.role) ===
              'user' ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
                  Новый пользователь будет удалён
                  без сохранения профиля. Это
                  действие нельзя отменить.
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    У пользователя уже назначена
                    роль. Обычно его лучше
                    заблокировать, чтобы сохранить
                    учебную историю, связи и
                    документы.
                  </div>

                  <p className="text-sm leading-6 text-gray-600">
                    При продолжении будет вызвано
                    окончательное удаление через
                    endpoint пользователя.
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  setUserToDelete(null)
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Отмена
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  void handleDeleteUser()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
