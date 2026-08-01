import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageCircle,
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

import { useNavigate } from 'react-router-dom';

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
  getAdminStudentName,
  loadAdminStudents,
  type AdminStudentItem,
  type AdminStudentStudyInfo,
} from '../../../services/adminStudentsService';

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

function isCreatedThisMonth(
  profile: UserProfile
): boolean {
  const createdAt = new Date(
    profile.created_at
  );
  const now = new Date();

  return (
    !Number.isNaN(createdAt.getTime()) &&
    createdAt.getFullYear() ===
      now.getFullYear() &&
    createdAt.getMonth() === now.getMonth()
  );
}

function createFilterOptions(
  studyItems: AdminStudentStudyInfo[],
  idSelector: (
    item: AdminStudentStudyInfo
  ) => number | null,
  labelSelector: (
    item: AdminStudentStudyInfo
  ) => string
): FilterOption[] {
  const values = new Map<number, string>();

  studyItems.forEach((item) => {
    const id = idSelector(item);

    if (id) {
      values.set(id, labelSelector(item));
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

export default function AdminStudents() {
  const navigate = useNavigate();

  const [students, setStudents] =
    useState<AdminStudentItem[]>([]);
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
  const [
    educationPlanFilter,
    setEducationPlanFilter,
  ] = useState('all');
  const [groupFilter, setGroupFilter] =
    useState('all');

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState<AdminStudentItem | null>(
    null
  );

  const [isFormOpen, setIsFormOpen] =
    useState(false);
  const [
    editingStudent,
    setEditingStudent,
  ] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] =
    useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);
  const [activeAction, setActiveAction] =
    useState<string | null>(null);
  const [actionError, setActionError] =
    useState<string | null>(null);

  const loadStudents = useCallback(
    async (background = false) => {
      if (!background) {
        setIsLoading(true);
      }

      setError(null);

      try {
        const loadedStudents =
          await loadAdminStudents();

        setStudents(loadedStudents);
        setSelectedStudent((current) =>
          current
            ? loadedStudents.find(
                (item) =>
                  item.profile.id ===
                  current.profile.id
              ) ?? null
            : null
        );

        return loadedStudents;
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
    void loadStudents();
  }, [loadStudents]);

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

  const allStudyItems = useMemo(
    () =>
      students.flatMap(
        (student) => student.study
      ),
    [students]
  );

  const branchOptions = useMemo(
    () =>
      createFilterOptions(
        allStudyItems,
        (item) => item.branchId,
        (item) => item.branchName
      ),
    [allStudyItems]
  );

  const directionOptions = useMemo(
    () =>
      createFilterOptions(
        allStudyItems,
        (item) => item.directionId,
        (item) => item.directionName
      ),
    [allStudyItems]
  );

  const educationPlanOptions = useMemo(
    () =>
      createFilterOptions(
        allStudyItems,
        (item) => item.educationPlanId,
        (item) => item.educationPlanName
      ),
    [allStudyItems]
  );

  const groupOptions = useMemo(
    () =>
      createFilterOptions(
        allStudyItems,
        (item) => item.groupId,
        (item) => item.groupName
      ),
    [allStudyItems]
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return students.filter((student) => {
      const profile = student.profile;
      const searchableText = [
        getAdminStudentName(profile),
        profile.phone_number,
        profile.email,
        ...student.study.flatMap((study) => [
          study.groupName,
          study.branchName,
          study.directionName,
          study.educationPlanName,
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (
        normalizedSearch &&
        !searchableText.includes(normalizedSearch)
      ) {
        return false;
      }

      const matchesStudyFilter = (
        filter: string,
        selector: (
          study: AdminStudentStudyInfo
        ) => number | null
      ) =>
        filter === 'all' ||
        (filter === 'none'
          ? student.study.length === 0
          : student.study.some(
              (study) =>
                String(selector(study)) ===
                filter
            ));

      return (
        matchesStudyFilter(
          branchFilter,
          (study) => study.branchId
        ) &&
        matchesStudyFilter(
          directionFilter,
          (study) => study.directionId
        ) &&
        matchesStudyFilter(
          educationPlanFilter,
          (study) =>
            study.educationPlanId
        ) &&
        matchesStudyFilter(
          groupFilter,
          (study) => study.groupId
        )
      );
    });
  }, [
    students,
    searchValue,
    branchFilter,
    directionFilter,
    educationPlanFilter,
    groupFilter,
  ]);

  const activeStudentsCount = useMemo(
    () =>
      students.filter(
        (student) =>
          student.profile.is_active
      ).length,
    [students]
  );

  const pendingVerificationCount = useMemo(
    () =>
      students.filter(
        (student) =>
          !student.profile
            .is_account_verified ||
          !student.profile.is_phone_verified
      ).length,
    [students]
  );

  const newStudentsCount = useMemo(
    () =>
      students.filter((student) =>
        isCreatedThisMonth(student.profile)
      ).length,
    [students]
  );

  const resetFilters = () => {
    setSearchValue('');
    setBranchFilter('all');
    setDirectionFilter('all');
    setEducationPlanFilter('all');
    setGroupFilter('all');
  };

  const openCreateForm = () => {
    setEditingStudent(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (
    profile: UserProfile
  ) => {
    setSelectedStudent(null);
    setEditingStudent(profile);
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
      if (editingStudent) {
        await updateUserProfile(
          editingStudent.id,
          data
        );
        setSuccessMessage(
          'Данные студента обновлены'
        );
      } else {
        await createUser({
          ...data,
          role: 'student',
        });
        setSuccessMessage(
          'Профиль студента создан'
        );
      }

      setIsFormOpen(false);
      setEditingStudent(null);
      await loadStudents(true);
    } catch (saveError) {
      setFormError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runStudentAction = async (
    actionName: string,
    action: (userId: number) => Promise<unknown>,
    successText: string
  ) => {
    if (!selectedStudent || activeAction) {
      return;
    }

    setActiveAction(actionName);
    setActionError(null);

    try {
      await action(selectedStudent.profile.id);
      await loadStudents(true);
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
    if (!selectedStudent || activeAction) {
      return;
    }

    setActiveAction('delete');
    setActionError(null);

    try {
      await deleteUser(
        selectedStudent.profile.id
      );
      setSelectedStudent(null);
      await loadStudents(true);
      setSuccessMessage('Студент удалён');
    } catch (deleteError) {
      setActionError(
        getErrorMessage(deleteError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const selectClassName =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100';

  const filtersAreActive =
    searchValue.trim() !== '' ||
    branchFilter !== 'all' ||
    directionFilter !== 'all' ||
    educationPlanFilter !== 'all' ||
    groupFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Студенты
          </h1>

          <p className="mt-1 text-gray-500">
            Пользователи, обучение и управление доступом
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Создать студента
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
              void loadStudents()
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
          <Users className="h-5 w-5 text-red-500" />
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {students.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Всего студентов
          </p>
        </div>

        <div className="stat-card">
          <UserCheck className="h-5 w-5 text-green-500" />
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {activeStudentsCount}
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
          <Plus className="h-5 w-5 text-blue-500" />
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {newStudentsCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Новых в этом месяце
          </p>
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-5">
          <label className="xl:col-span-1">
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
              {directionOptions.map((option) => (
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
              Учебный план
            </span>
            <select
              value={educationPlanFilter}
              onChange={(event) =>
                setEducationPlanFilter(
                  event.target.value
                )
              }
              className={selectClassName}
            >
              <option value="all">
                Все учебные планы
              </option>
              {educationPlanOptions.map(
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
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-gray-900">
              Список студентов
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Показано: {filteredStudents.length}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-red-600" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
            <Users className="h-9 w-9 text-gray-300" />
            <p className="mt-3 font-medium text-gray-700">
              Студенты не найдены
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Измените фильтры или создайте нового студента.
            </p>
          </div>
        ) : (
          <div className="max-h-[862px] overflow-auto overscroll-contain">
            <table className="min-w-[1420px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="px-5 py-3 font-medium">
                    Студент
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Контакты
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Группа
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Филиал
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Направление и план
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
                {filteredStudents.map(
                  (student) => {
                    const profile =
                      student.profile;
                    const primaryStudy =
                      student.study[0];

                    return (
                      <tr
                        key={profile.id}
                        className="h-[82px] transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null);
                              setSelectedStudent(
                                student
                              );
                            }}
                            className="flex items-center gap-3 text-left"
                          >
                            <UserAvatar
                              avatarUrl={
                                profile.avatar_url
                              }
                              alt={getAdminStudentName(
                                profile
                              )}
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />

                            <span>
                              <span className="block font-semibold text-gray-900 hover:text-red-600">
                                {getAdminStudentName(
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
                          {student.study.length > 0
                            ? student.study
                                .map(
                                  (study) =>
                                    study.groupName
                                )
                                .join(', ')
                            : 'Без группы'}
                        </td>

                        <td className="px-4 py-3.5 text-gray-600">
                          {primaryStudy?.branchName ??
                            'Не указан'}
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-gray-700">
                            {primaryStudy?.directionName ??
                              'Не указано'}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {primaryStudy?.educationPlanName ??
                              'Учебный план не указан'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadges
                            profile={profile}
                          />
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/dashboard/messages?contactUserId=${profile.id}&contactRole=student`
                                )
                              }
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-600 hover:text-white"
                              title={`Написать ${getAdminStudentName(
                                profile
                              )}`}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Написать
                            </button>

                            <a
                              href={`tel:${profile.phone_number}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                              title={`Позвонить ${profile.phone_number}`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Позвонить
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setSelectedStudent(
                                  student
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
        student={editingStudent}
        isSaving={isSaving}
        error={formError}
        onClose={() => {
          if (!isSaving) {
            setIsFormOpen(false);
            setEditingStudent(null);
            setFormError(null);
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <AdminStudentDetailsModal
        student={selectedStudent}
        activeAction={activeAction}
        error={actionError}
        onClose={() => {
          if (!activeAction) {
            setSelectedStudent(null);
            setActionError(null);
          }
        }}
        onEdit={() => {
          if (selectedStudent) {
            openEditForm(
              selectedStudent.profile
            );
          }
        }}
        onVerifyAccount={() =>
          void runStudentAction(
            'verify-account',
            verifyUserAccount,
            'Аккаунт студента подтверждён'
          )
        }
        onVerifyPhone={() =>
          void runStudentAction(
            'verify-phone',
            verifyUserPhone,
            'Телефон студента подтверждён'
          )
        }
        onToggleActive={() =>
          void runStudentAction(
            'toggle-active',
            selectedStudent?.profile
              .is_active
              ? blockUser
              : activateUser,
            selectedStudent?.profile
              .is_active
              ? 'Студент заблокирован'
              : 'Студент активирован'
          )
        }
        onDelete={() =>
          void handleDelete()
        }
        showParentContacts
        onMessageParent={(parentLink) =>
          navigate(
            `/dashboard/messages?contactUserId=${parentLink.parent.id}&contactRole=parent`
          )
        }
      />
    </div>
  );
}
