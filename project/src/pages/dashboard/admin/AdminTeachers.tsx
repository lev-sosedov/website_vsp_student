import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  UserCheck,
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
  useNavigate,
} from 'react-router-dom';

import {
  activateUser,
  blockUser,
  createUser,
  deleteUser,
  updateUserProfile,
  verifyUserAccount,
  verifyUserPhone,
  type UserProfile,
} from '../../../api/userApi';

import UserAvatar from '../../../components/common/UserAvatar';
import AdminStudentDetailsModal from '../../../components/dashboard/admin/AdminStudentDetailsModal';

import AdminStudentFormModal, {
  type AdminStudentFormValues,
} from '../../../components/dashboard/admin/AdminStudentFormModal';

import {
  getAdminTeacherName,
  loadAdminTeachers,
  type AdminTeacherAssignmentInfo,
  type AdminTeacherItem,
} from '../../../services/adminTeachersService';

interface FilterOption {
  value: string;
  label: string;
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить операцию';
}

function formatCreatedDate(
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
  }).format(date);
}

function createFilterOptions(
  assignments: AdminTeacherAssignmentInfo[],
  idSelector: (
    assignment: AdminTeacherAssignmentInfo
  ) => number | null,
  labelSelector: (
    assignment: AdminTeacherAssignmentInfo
  ) => string
): FilterOption[] {
  const values = new Map<number, string>();

  assignments.forEach((assignment) => {
    const id = idSelector(assignment);

    if (id) {
      values.set(
        id,
        labelSelector(assignment)
      );
    }
  });

  return Array.from(values.entries())
    .map(([id, label]) => ({
      value: String(id),
      label,
    }))
    .sort((first, second) =>
      first.label.localeCompare(
        second.label,
        'ru'
      )
    );
}

function StatusBadges({
  profile,
}: {
  profile: UserProfile;
}) {
  return (
    <div className="flex min-w-[145px] flex-col items-start gap-1.5">
      <span
        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
          profile.is_active
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}
      >
        {profile.is_active
          ? 'Активен'
          : 'Заблокирован'}
      </span>

      {(!profile.is_account_verified ||
        !profile.is_phone_verified) && (
        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
          Требуется подтверждение
        </span>
      )}
    </div>
  );
}

export default function AdminTeachers() {
  const navigate = useNavigate();

  const [teachers, setTeachers] =
    useState<AdminTeacherItem[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [searchValue, setSearchValue] =
    useState('');
  const [branchFilter, setBranchFilter] =
    useState('all');
  const [
    directionFilter,
    setDirectionFilter,
  ] = useState('all');
  const [groupFilter, setGroupFilter] =
    useState('all');

  const [
    selectedTeacher,
    setSelectedTeacher,
  ] = useState<AdminTeacherItem | null>(
    null
  );

  const [isFormOpen, setIsFormOpen] =
    useState(false);
  const [
    editingTeacher,
    setEditingTeacher,
  ] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] =
    useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);
  const [activeAction, setActiveAction] =
    useState<string | null>(null);
  const [actionError, setActionError] =
    useState<string | null>(null);
  const loadTeachers = useCallback(
    async (background = false) => {
      if (!background) {
        setIsLoading(true);
      }

      setError(null);

      try {
        const loadedTeachers =
          await loadAdminTeachers();

        setTeachers(loadedTeachers);
        setSelectedTeacher((current) =>
          current
            ? loadedTeachers.find(
                (item) =>
                  item.profile.id ===
                  current.profile.id
              ) ?? null
            : null
        );

        return loadedTeachers;
      } catch (loadError) {
        setError(getErrorMessage(loadError));
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timerId = window.setTimeout(
      () => setSuccessMessage(null),
      4_000
    );

    return () =>
      window.clearTimeout(timerId);
  }, [successMessage]);

  const allAssignments = useMemo(
    () =>
      teachers.flatMap(
        (teacher) => teacher.study
      ),
    [teachers]
  );

  const branchOptions = useMemo(
    () =>
      createFilterOptions(
        allAssignments,
        (assignment) =>
          assignment.branchId,
        (assignment) =>
          assignment.branchName
      ),
    [allAssignments]
  );

  const directionOptions = useMemo(
    () =>
      createFilterOptions(
        allAssignments,
        (assignment) =>
          assignment.directionId,
        (assignment) =>
          assignment.directionName
      ),
    [allAssignments]
  );

  const groupOptions = useMemo(
    () =>
      createFilterOptions(
        allAssignments,
        (assignment) =>
          assignment.groupId,
        (assignment) =>
          assignment.groupName
      ),
    [allAssignments]
  );

  const filteredTeachers = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const profile = teacher.profile;
      const searchableText = [
        getAdminTeacherName(profile),
        profile.phone_number,
        profile.email,
        ...teacher.study.flatMap(
          (assignment) => [
            assignment.groupName,
            assignment.branchName,
            assignment.directionName,
          ]
        ),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (
        normalizedSearch &&
        !searchableText.includes(
          normalizedSearch
        )
      ) {
        return false;
      }

      const matchesFilter = (
        filter: string,
        selector: (
          assignment: AdminTeacherAssignmentInfo
        ) => number | null
      ) =>
        filter === 'all' ||
        (filter === 'none'
          ? (
              teacher.study.length === 0 ||
              teacher.study.every(
                (assignment) =>
                  selector(assignment) === null
              )
            )
          : teacher.study.some(
              (assignment) =>
                String(
                  selector(assignment)
                ) === filter
            ));

      return (
        matchesFilter(
          branchFilter,
          (assignment) =>
            assignment.branchId
        ) &&
        matchesFilter(
          directionFilter,
          (assignment) =>
            assignment.directionId
        ) &&
        matchesFilter(
          groupFilter,
          (assignment) =>
            assignment.groupId
        )
      );
    });
  }, [
    teachers,
    searchValue,
    branchFilter,
    directionFilter,
    groupFilter,
  ]);

  const activeTeachersCount = useMemo(
    () =>
      teachers.filter(
        (teacher) =>
          teacher.profile.is_active
      ).length,
    [teachers]
  );

  const pendingVerificationCount = useMemo(
    () =>
      teachers.filter(
        (teacher) =>
          !teacher.profile
            .is_account_verified ||
          !teacher.profile.is_phone_verified
      ).length,
    [teachers]
  );

  const teachersWithoutGroupsCount =
    useMemo(
      () =>
        teachers.filter(
          (teacher) =>
            teacher.study.length === 0
        ).length,
      [teachers]
    );

  const resetFilters = () => {
    setSearchValue('');
    setBranchFilter('all');
    setDirectionFilter('all');
    setGroupFilter('all');
  };

  const openCreateForm = () => {
    setEditingTeacher(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (
    profile: UserProfile
  ) => {
    setSelectedTeacher(null);
    setEditingTeacher(profile);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (
    values: AdminStudentFormValues
  ) => {
    setIsSaving(true);
    setFormError(null);

    const data = {
      phone_number:
        values.phoneNumber.trim(),
      first_name:
        values.firstName.trim() || null,
      user_name: values.userName.trim(),
      last_name:
        values.lastName.trim() || null,
      email: values.email.trim() || null,
      birthday: values.birthday || null,
      about: values.about.trim() || null,
    };

    try {
      if (editingTeacher) {
        await updateUserProfile(
          editingTeacher.id,
          data
        );
        setSuccessMessage(
          'Данные преподавателя обновлены'
        );
      } else {
        await createUser({
          ...data,
          role: 'teacher',
        });
        setSuccessMessage(
          'Профиль преподавателя создан'
        );
      }

      setIsFormOpen(false);
      setEditingTeacher(null);
      await loadTeachers(true);
    } catch (saveError) {
      setFormError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runTeacherAction = async (
    actionName: string,
    action: (
      userId: number
    ) => Promise<unknown>,
    successText: string
  ) => {
    if (!selectedTeacher || activeAction) {
      return;
    }

    setActiveAction(actionName);
    setActionError(null);

    try {
      await action(
        selectedTeacher.profile.id
      );
      await loadTeachers(true);
      setSuccessMessage(successText);
    } catch (requestError) {
      setActionError(
        getErrorMessage(requestError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeacher || activeAction) {
      return;
    }

    setActiveAction('delete');
    setActionError(null);

    try {
      await deleteUser(
        selectedTeacher.profile.id
      );
      setSelectedTeacher(null);
      await loadTeachers(true);
      setSuccessMessage(
        'Преподаватель удалён'
      );
    } catch (deleteError) {
      setActionError(
        getErrorMessage(deleteError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const openTeacherMessage = useCallback(
    (teacher: AdminTeacherItem) => {
      const query = new URLSearchParams({
        contactUserId: String(
          teacher.profile.id
        ),
        contactRole: 'teacher',
      });

      navigate(
        `/dashboard/messages?${query.toString()}`
      );
    },
    [navigate]
  );

  const selectClassName =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100';

  const filtersAreActive =
    searchValue.trim() !== '' ||
    branchFilter !== 'all' ||
    directionFilter !== 'all' ||
    groupFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Преподаватели
          </h1>

          <p className="mt-1 text-gray-500">
            Сотрудники, группы и управление доступом
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Создать преподавателя
        </button>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadTeachers()
            }
            className="text-sm font-semibold text-red-700"
          >
            Повторить
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {successMessage}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="stat-card">
          <GraduationCap className="h-5 w-5 text-red-500" />
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {teachers.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Всего преподавателей
          </p>
        </div>

        <div className="stat-card">
          <UserCheck className="h-5 w-5 text-green-500" />
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {activeTeachersCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Активных
          </p>
        </div>

        <div className="stat-card">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {pendingVerificationCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Ждут подтверждения
          </p>
        </div>

        <div className="stat-card">
          <Users className="h-5 w-5 text-blue-500" />
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {teachersWithoutGroupsCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Пока без групп
          </p>
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              Поиск
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-100">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="ФИО, телефон или email"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              Филиал
            </span>
            <select
              value={branchFilter}
              onChange={(event) =>
                setBranchFilter(
                  event.target.value
                )
              }
              className={selectClassName}
            >
              <option value="all">
                Все филиалы
              </option>
              <option value="none">
                Без назначенного филиала
              </option>
              {branchOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              Направление
            </span>
            <select
              value={directionFilter}
              onChange={(event) =>
                setDirectionFilter(
                  event.target.value
                )
              }
              className={selectClassName}
            >
              <option value="all">
                Все направления
              </option>
              {directionOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              Группа
            </span>
            <select
              value={groupFilter}
              onChange={(event) =>
                setGroupFilter(
                  event.target.value
                )
              }
              className={selectClassName}
            >
              <option value="all">
                Все группы
              </option>
              <option value="none">
                Без группы
              </option>
              {groupOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtersAreActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <X className="h-3.5 w-3.5" />
            Сбросить фильтры
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">
            Список преподавателей
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Показано: {filteredTeachers.length}
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-red-600" />
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
            <GraduationCap className="h-9 w-9 text-gray-300" />
            <p className="mt-3 font-medium text-gray-700">
              Преподаватели не найдены
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Измените фильтры или создайте нового преподавателя.
            </p>
          </div>
        ) : (
          <div className="max-h-[748px] overflow-auto overscroll-contain">
            <table className="w-full min-w-[1260px] text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="px-5 py-3 font-medium">
                    Преподаватель
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Контакты
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Группы
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Филиалы
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Направления
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Статус
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Действия
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredTeachers.map(
                  (teacher) => {
                    const profile =
                      teacher.profile;

                    const branchNames = [
                      ...new Set(
                        teacher.study.map(
                          (assignment) =>
                            assignment.branchName
                        )
                      ),
                    ];

                    const directionNames = [
                      ...new Set(
                        teacher.study.map(
                          (assignment) =>
                            assignment.directionName
                        )
                      ),
                    ];

                    return (
                      <tr
                        key={profile.id}
                        className="h-[70px] transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null);
                              setSelectedTeacher(
                                teacher
                              );
                            }}
                            className="flex items-center gap-3 text-left"
                          >
                            <UserAvatar
                              avatarUrl={
                                profile.avatar_url
                              }
                              alt={getAdminTeacherName(
                                profile
                              )}
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />

                            <span>
                              <span className="block font-semibold text-gray-900 hover:text-red-600">
                                {getAdminTeacherName(
                                  profile
                                )}
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-400">
                                Добавлен{' '}
                                {formatCreatedDate(
                                  profile.created_at
                                )}
                              </span>
                            </span>
                          </button>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-gray-700">
                            {profile.phone_number}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {profile.email ||
                              'Email не указан'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-gray-700">
                          {teacher.study.length > 0
                            ? teacher.study
                                .map(
                                  (assignment) =>
                                    assignment.groupName
                                )
                                .join(', ')
                            : 'Без групп'}
                        </td>

                        <td className="px-4 py-3.5 text-gray-600">
                          {branchNames.length > 0
                            ? branchNames.join(', ')
                            : 'Не назначен'}
                        </td>

                        <td className="px-4 py-3.5 text-gray-600">
                          {directionNames.length > 0
                            ? directionNames.join(', ')
                            : 'Не назначено'}
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadges
                            profile={profile}
                          />
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openTeacherMessage(
                                  teacher
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Написать
                            </button>

                            {profile.phone_number && (
                              <a
                                href={`tel:${profile.phone_number}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                Позвонить
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setSelectedTeacher(
                                  teacher
                                );
                              }}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              Управление
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminStudentFormModal
        isOpen={isFormOpen}
        student={editingTeacher}
        entityLabel="преподавателя"
        aboutLabel="О преподавателе"
        isSaving={isSaving}
        error={formError}
        onClose={() => {
          if (!isSaving) {
            setIsFormOpen(false);
            setEditingTeacher(null);
            setFormError(null);
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <AdminStudentDetailsModal
        student={selectedTeacher}
        roleLabel="Преподаватель"
        assignmentTitle="Назначенные группы"
        emptyAssignmentText="Преподаватель пока не назначен ни в одну группу"
        deleteEntityLabel="преподавателя"
        activeAction={activeAction}
        error={actionError}
        onClose={() => {
          if (!activeAction) {
            setSelectedTeacher(null);
            setActionError(null);
          }
        }}
        onEdit={() => {
          if (selectedTeacher) {
            openEditForm(
              selectedTeacher.profile
            );
          }
        }}
        onMessage={() => {
          if (selectedTeacher) {
            openTeacherMessage(
              selectedTeacher
            );
          }
        }}
        onVerifyAccount={() =>
          void runTeacherAction(
            'verify-account',
            verifyUserAccount,
            'Аккаунт преподавателя подтверждён'
          )
        }
        onVerifyPhone={() =>
          void runTeacherAction(
            'verify-phone',
            verifyUserPhone,
            'Телефон преподавателя подтверждён'
          )
        }
        onToggleActive={() =>
          void runTeacherAction(
            'toggle-active',
            selectedTeacher?.profile
              .is_active
              ? blockUser
              : activateUser,
            selectedTeacher?.profile
              .is_active
              ? 'Преподаватель заблокирован'
              : 'Преподаватель активирован'
          )
        }
        onDelete={() =>
          void handleDelete()
        }
      />
    </div>
  );
}
