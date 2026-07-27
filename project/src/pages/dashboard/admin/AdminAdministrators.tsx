import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Lock,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  UserCheck,
  Users,
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
  createUser,
  getUsers,
  updateUserProfile,
  verifyUserAccount,
  verifyUserPhone,
  type UserProfile,
} from '../../../api/userApi';

import UserAvatar from '../../../components/common/UserAvatar';

import AdminStudentFormModal, {
  type AdminStudentFormValues,
} from '../../../components/dashboard/admin/AdminStudentFormModal';

import { useAuth } from '../../../context/AuthContext';

type StatusFilter =
  | 'all'
  | 'active'
  | 'blocked'
  | 'unverified';

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить операцию';
}

function getAdministratorName(
  administrator: UserProfile
): string {
  return (
    [
      administrator.first_name,
      administrator.user_name,
      administrator.last_name,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim() ||
    `Администратор №${administrator.id}`
  );
}

function formatDate(
  value: string
): string {
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

async function loadAllAdministrators(): Promise<
  UserProfile[]
> {
  const administrators: UserProfile[] = [];
  const pageSize = 100;
  let skip = 0;
  let total = Number.POSITIVE_INFINITY;

  while (skip < total) {
    const response = await getUsers({
      role: 'admin',
      skip,
      limit: pageSize,
    });

    administrators.push(...response.items);
    total = response.total;

    if (response.items.length === 0) {
      break;
    }

    skip += response.items.length;
  }

  return administrators
    .filter(
      (administrator) =>
        administrator.role
          .trim()
          .toLowerCase() === 'admin'
    )
    .sort(
      (first, second) =>
        new Date(
          second.created_at
        ).getTime() -
        new Date(
          first.created_at
        ).getTime()
    );
}

function StatusBadges({
  administrator,
  isCurrentUser,
}: {
  administrator: UserProfile;
  isCurrentUser: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          administrator.is_active
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}
      >
        {administrator.is_active
          ? 'Активен'
          : 'Заблокирован'}
      </span>

      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          administrator.is_account_verified
            ? 'bg-blue-50 text-blue-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {administrator.is_account_verified
          ? 'Аккаунт подтверждён'
          : 'Аккаунт не подтверждён'}
      </span>

      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          administrator.is_phone_verified
            ? 'bg-violet-50 text-violet-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {administrator.is_phone_verified
          ? 'Телефон подтверждён'
          : 'Телефон не подтверждён'}
      </span>

      {isCurrentUser && (
        <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">
          Это вы
        </span>
      )}
    </div>
  );
}

export default function AdminAdministrators() {
  const { user } = useAuth();

  const [
    administrators,
    setAdministrators,
  ] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null);

  const [searchValue, setSearchValue] =
    useState('');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');

  const [
    selectedAdministrator,
    setSelectedAdministrator,
  ] = useState<UserProfile | null>(null);

  const [isFormOpen, setIsFormOpen] =
    useState(false);
  const [
    editingAdministrator,
    setEditingAdministrator,
  ] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] =
    useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);

  const [activeAction, setActiveAction] =
    useState<string | null>(null);
  const [actionError, setActionError] =
    useState<string | null>(null);

  const loadAdministrators =
    useCallback(
      async (background = false) => {
        if (!background) {
          setIsLoading(true);
        }

        setError(null);

        try {
          const loadedAdministrators =
            await loadAllAdministrators();

          setAdministrators(
            loadedAdministrators
          );

          setSelectedAdministrator(
            (current) =>
              current
                ? loadedAdministrators.find(
                    (administrator) =>
                      administrator.id ===
                      current.id
                  ) ?? null
                : null
          );
        } catch (loadError) {
          setError(
            getErrorMessage(loadError)
          );
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadAdministrators();
  }, [loadAdministrators]);

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

  const statistics = useMemo(() => {
    const active = administrators.filter(
      (administrator) =>
        administrator.is_active
    ).length;

    const blocked =
      administrators.length - active;

    const unverified =
      administrators.filter(
        (administrator) =>
          !administrator
            .is_account_verified ||
          !administrator
            .is_phone_verified
      ).length;

    const thirtyDaysAgo =
      Date.now() -
      30 * 24 * 60 * 60 * 1000;

    const recentlyCreated =
      administrators.filter(
        (administrator) => {
          const time = new Date(
            administrator.created_at
          ).getTime();

          return (
            Number.isFinite(time) &&
            time >= thirtyDaysAgo
          );
        }
      ).length;

    return {
      active,
      blocked,
      unverified,
      recentlyCreated,
    };
  }, [administrators]);

  const filteredAdministrators =
    useMemo(() => {
      const search =
        searchValue
          .trim()
          .toLowerCase();

      return administrators.filter(
        (administrator) => {
          if (
            statusFilter === 'active' &&
            !administrator.is_active
          ) {
            return false;
          }

          if (
            statusFilter === 'blocked' &&
            administrator.is_active
          ) {
            return false;
          }

          if (
            statusFilter === 'unverified' &&
            administrator
              .is_account_verified &&
            administrator
              .is_phone_verified
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          return [
            getAdministratorName(
              administrator
            ),
            administrator.phone_number,
            administrator.email,
            administrator.about,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search);
        }
      );
    }, [
      administrators,
      searchValue,
      statusFilter,
    ]);

  const openCreateForm = () => {
    setEditingAdministrator(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (
    administrator: UserProfile
  ) => {
    setEditingAdministrator(
      administrator
    );
    setSelectedAdministrator(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingAdministrator(null);
    setFormError(null);
  };

  const handleFormSubmit = async (
    values: AdminStudentFormValues
  ) => {
    setIsSaving(true);
    setFormError(null);

    const payload = {
      phone_number:
        values.phoneNumber.trim(),
      first_name:
        values.firstName.trim() || null,
      user_name:
        values.userName.trim(),
      last_name:
        values.lastName.trim() || null,
      email:
        values.email.trim() || null,
      birthday:
        values.birthday || null,
      about:
        values.about.trim() || null,
    };

    try {
      if (editingAdministrator) {
        await updateUserProfile(
          editingAdministrator.id,
          payload
        );

        setSuccessMessage(
          'Данные администратора обновлены'
        );
      } else {
        await createUser({
          ...payload,
          role: 'admin',
        });

        setSuccessMessage(
          'Профиль администратора создан'
        );
      }

      setIsFormOpen(false);
      setEditingAdministrator(null);
      await loadAdministrators(true);
    } catch (saveError) {
      setFormError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runAction = async (
    actionName: string,
    action: (
      administratorId: number
    ) => Promise<unknown>,
    successText: string
  ) => {
    if (
      !selectedAdministrator ||
      activeAction
    ) {
      return;
    }

    setActiveAction(actionName);
    setActionError(null);

    try {
      await action(
        selectedAdministrator.id
      );

      await loadAdministrators(true);
      setSuccessMessage(successText);
    } catch (requestError) {
      setActionError(
        getErrorMessage(requestError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleRemoveAdminRole =
    async () => {
      if (
        !selectedAdministrator ||
        activeAction
      ) {
        return;
      }

      if (
        selectedAdministrator.id ===
        user?.id
      ) {
        setActionError(
          'Нельзя снять административную роль у собственной учётной записи'
        );
        return;
      }

      const confirmed = window.confirm(
        `Снять права администратора у «${getAdministratorName(
          selectedAdministrator
        )}»?\n\nПользователю будет назначена роль user.`
      );

      if (!confirmed) {
        return;
      }

      setActiveAction('remove-role');
      setActionError(null);

      try {
        await changeUserRole(
          selectedAdministrator.id,
          'user'
        );

        setSelectedAdministrator(null);
        await loadAdministrators(true);
        setSuccessMessage(
          'Административные права сняты'
        );
      } catch (requestError) {
        setActionError(
          getErrorMessage(requestError)
        );
      } finally {
        setActiveAction(null);
      }
    };

  const handleBlock = async () => {
    if (!selectedAdministrator) {
      return;
    }

    if (
      selectedAdministrator.id ===
      user?.id
    ) {
      setActionError(
        'Нельзя заблокировать собственную учётную запись'
      );
      return;
    }

    const confirmed = window.confirm(
      `Заблокировать администратора «${getAdministratorName(
        selectedAdministrator
      )}»?`
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      'block',
      blockUser,
      'Администратор заблокирован'
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <p>
            Загружаем администраторов...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
            <ShieldCheck className="h-4 w-4" />
            Контроль доступа
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Администраторы
          </h1>

          <p className="mt-1 text-gray-500">
            Учётные записи с полным доступом
            к управлению платформой
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              void loadAdministrators()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Создать администратора
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                void loadAdministrators()
              }
              className="mt-2 font-semibold underline"
            >
              Повторить
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Всего администраторов
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {administrators.length}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Активные
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {statistics.active}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Требуют подтверждения
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {statistics.unverified}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Заблокированные
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {statistics.blocked}
              </p>
            </div>

            <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
              <Lock className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Поиск
            </span>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Имя, телефон или email"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Статус
            </span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter
                )
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            >
              <option value="all">
                Все статусы
              </option>
              <option value="active">
                Активные
              </option>
              <option value="blocked">
                Заблокированные
              </option>
              <option value="unverified">
                Требуют подтверждения
              </option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">
            Список администраторов
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Показано:
            {' '}
            {filteredAdministrators.length}
          </p>
        </div>

        {filteredAdministrators.length ===
        0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <ShieldCheck className="h-12 w-12 text-gray-300" />

            <h3 className="mt-4 font-semibold text-gray-900">
              Администраторы не найдены
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Измените параметры поиска или
              создайте нового администратора.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAdministrators.map(
              (administrator) => {
                const isCurrentUser =
                  administrator.id ===
                  user?.id;

                return (
                  <div
                    key={administrator.id}
                    className="grid gap-4 p-5 xl:grid-cols-[minmax(280px,1.2fr)_minmax(260px,1fr)_minmax(220px,0.8fr)_auto] xl:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        avatarUrl={
                          administrator.avatar_url
                        }
                        alt={getAdministratorName(
                          administrator
                        )}
                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                      />

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {getAdministratorName(
                            administrator
                          )}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          ID:
                          {' '}
                          {administrator.id}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {administrator.phone_number}
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {administrator.email ||
                          'Email не указан'}
                      </div>
                    </div>

                    <StatusBadges
                      administrator={
                        administrator
                      }
                      isCurrentUser={
                        isCurrentUser
                      }
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAdministrator(
                          administrator
                        );
                        setActionError(null);
                      }}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Управление
                    </button>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {selectedAdministrator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <UserAvatar
                  avatarUrl={
                    selectedAdministrator
                      .avatar_url
                  }
                  alt={getAdministratorName(
                    selectedAdministrator
                  )}
                  className="h-14 w-14 rounded-full object-cover ring-1 ring-gray-200"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {getAdministratorName(
                      selectedAdministrator
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Управление учётной записью
                    администратора
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAdministrator(
                      null
                    )
                  }
                  disabled={Boolean(
                    activeAction
                  )}
                  className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
                >
                  Закрыть
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <StatusBadges
                administrator={
                  selectedAdministrator
                }
                isCurrentUser={
                  selectedAdministrator.id ===
                  user?.id
                }
              />

              <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-gray-500">
                    Создан
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatDate(
                      selectedAdministrator
                        .created_at
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">
                    Последнее обновление
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatDate(
                      selectedAdministrator
                        .updated_at
                    )}
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {actionError}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    openEditForm(
                      selectedAdministrator
                    )
                  }
                  disabled={Boolean(
                    activeAction
                  )}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Редактировать профиль
                </button>

                {!selectedAdministrator
                  .is_account_verified && (
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        'verify-account',
                        verifyUserAccount,
                        'Аккаунт подтверждён'
                      )
                    }
                    disabled={Boolean(
                      activeAction
                    )}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {activeAction ===
                    'verify-account' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Подтвердить аккаунт
                  </button>
                )}

                {!selectedAdministrator
                  .is_phone_verified && (
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        'verify-phone',
                        verifyUserPhone,
                        'Телефон подтверждён'
                      )
                    }
                    disabled={Boolean(
                      activeAction
                    )}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                  >
                    {activeAction ===
                    'verify-phone' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Smartphone className="h-4 w-4" />
                    )}
                    Подтвердить телефон
                  </button>
                )}

                {selectedAdministrator
                  .is_active ? (
                  <button
                    type="button"
                    onClick={() =>
                      void handleBlock()
                    }
                    disabled={
                      Boolean(activeAction) ||
                      selectedAdministrator.id ===
                        user?.id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {activeAction === 'block' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    Заблокировать
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        'activate',
                        activateUser,
                        'Администратор активирован'
                      )
                    }
                    disabled={Boolean(
                      activeAction
                    )}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    {activeAction ===
                    'activate' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    Активировать
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void handleRemoveAdminRole()
                  }
                  disabled={
                    Boolean(activeAction) ||
                    selectedAdministrator.id ===
                      user?.id
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeAction ===
                  'remove-role' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldOff className="h-4 w-4" />
                  )}
                  Снять права администратора
                </button>
              </div>

              {selectedAdministrator.id ===
                user?.id && (
                <p className="rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-500">
                  Для безопасности нельзя
                  заблокировать собственную
                  учётную запись или снять с неё
                  административную роль.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <AdminStudentFormModal
        isOpen={isFormOpen}
        student={editingAdministrator}
        entityLabel="администратора"
        aboutLabel="Об администраторе"
        isSaving={isSaving}
        error={formError}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
