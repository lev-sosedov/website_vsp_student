import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../../context/AuthContext';

import {
  getActiveUserGroups,
  getGroup,
  getGroupStudents,
  type AcademicGroup,
  type GroupStudent,
} from '../../../api/academicApi';

interface TeacherGroupOption {
  membershipId: number;
  group: AcademicGroup;
  students: GroupStudent[];
}

interface TeacherStudentItem {
  student: GroupStudent;
  groups: AcademicGroup[];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}

function getStudentName(student: GroupStudent): string {
  const fullName = [
    student.last_name,
    student.first_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (fullName) {
    return fullName;
  }

  if (student.user_name?.trim()) {
    return student.user_name.trim();
  }

  return `Студент №${student.user_id}`;
}

function getStudentInitials(student: GroupStudent): string {
  const firstLetter =
    student.first_name?.trim().charAt(0) ?? '';

  const lastLetter =
    student.last_name?.trim().charAt(0) ?? '';

  const initials = `${lastLetter}${firstLetter}`;

  if (initials) {
    return initials.toUpperCase();
  }

  if (student.user_name?.trim()) {
    return student.user_name
      .trim()
      .slice(0, 2)
      .toUpperCase();
  }

  return String(student.user_id);
}

export default function TeacherStudents() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const teacherId = Number(user?.id);

  const [
    groups,
    setGroups,
  ] = useState<TeacherGroupOption[]>([]);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(null);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    if (
      !Number.isInteger(teacherId) ||
      teacherId <= 0
    ) {
      setGroups([]);
      setLoading(false);
      setError(
        'Не удалось определить ID преподавателя'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const memberships =
        await getActiveUserGroups(teacherId);

      const teacherMemberships =
        memberships.filter(
          (membership) =>
            membership.role === 'teacher' ||
            membership.role === 'assistant'
        );

      const uniqueMemberships = Array.from(
        new Map(
          teacherMemberships.map(
            (membership) => [
              membership.group_id,
              membership,
            ]
          )
        ).values()
      );

      const loadedGroups = await Promise.all(
        uniqueMemberships.map(
          async (membership) => {
            const [
              group,
              studentsResponse,
            ] = await Promise.all([
              getGroup(membership.group_id),
              getGroupStudents(
                membership.group_id
              ),
            ]);

            return {
              membershipId: membership.id,
              group,
              students:
                studentsResponse.items.filter(
                  (student) =>
                    student.is_active
                ),
            };
          }
        )
      );

      loadedGroups.sort((first, second) =>
        first.group.name.localeCompare(
          second.group.name,
          'ru'
        )
      );

      setGroups(loadedGroups);

      if (
        selectedGroupId !== null &&
        !loadedGroups.some(
          (item) =>
            item.group.id === selectedGroupId
        )
      ) {
        setSelectedGroupId(null);
      }
    } catch (loadError) {
      console.error(
        'Не удалось загрузить студентов преподавателя:',
        loadError
      );

      setGroups([]);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [
    teacherId,
    selectedGroupId,
  ]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const allStudents = useMemo<
    TeacherStudentItem[]
  >(() => {
    const studentMap =
      new Map<number, TeacherStudentItem>();

    groups.forEach((groupItem) => {
      groupItem.students.forEach((student) => {
        const existing =
          studentMap.get(student.user_id);

        if (existing) {
          if (
            !existing.groups.some(
              (group) =>
                group.id === groupItem.group.id
            )
          ) {
            existing.groups.push(groupItem.group);
          }

          return;
        }

        studentMap.set(student.user_id, {
          student,
          groups: [groupItem.group],
        });
      });
    });

    return Array.from(
      studentMap.values()
    ).sort((first, second) =>
      getStudentName(first.student)
        .localeCompare(
          getStudentName(second.student),
          'ru'
        )
    );
  }, [groups]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    return allStudents.filter((item) => {
      const matchesGroup =
        selectedGroupId === null ||
        item.groups.some(
          (group) =>
            group.id === selectedGroupId
        );

      if (!matchesGroup) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const studentName =
        getStudentName(item.student)
          .toLowerCase();

      const studentId =
        String(item.student.user_id);

      const groupNames =
        item.groups
          .map((group) => group.name)
          .join(' ')
          .toLowerCase();

      return (
        studentName.includes(normalizedSearch) ||
        studentId.includes(normalizedSearch) ||
        groupNames.includes(normalizedSearch)
      );
    });
  }, [
    allStudents,
    searchQuery,
    selectedGroupId,
  ]);

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (item) =>
          item.group.id === selectedGroupId
      )?.group ?? null,
    [
      groups,
      selectedGroupId,
    ]
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />

          <p className="text-sm text-gray-500">
            Загружаем студентов...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Студенты
          </h1>

          <p className="mt-1 text-gray-500">
            Все студенты из ваших учебных групп
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadStudents()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Обновить
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">
              Не удалось загрузить студентов
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Users className="h-6 w-6" />
            </div>

            <div>
              <p className="text-3xl font-bold text-gray-900">
                {allStudents.length}
              </p>

              <p className="text-sm text-gray-500">
                Уникальных студентов
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound className="h-6 w-6" />
            </div>

            <div>
              <p className="text-3xl font-bold text-gray-900">
                {filteredStudents.length}
              </p>

              <p className="text-sm text-gray-500">
                Найдено по фильтру
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_320px]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Поиск
          </span>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Имя, ID или название группы"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Группа
          </span>

          <div className="relative">
            <select
              value={selectedGroupId ?? ''}
              onChange={(event) => {
                const value = Number(
                  event.target.value
                );

                setSelectedGroupId(
                  Number.isInteger(value) &&
                    value > 0
                    ? value
                    : null
                );
              }}
              disabled={groups.length === 0}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                Все группы
              </option>

              {groups.map((item) => (
                <option
                  key={item.group.id}
                  value={item.group.id}
                >
                  {item.group.name}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </label>
      </div>

      {!error && groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Группы преподавателя не найдены
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Сначала назначьте преподавателя участником
            активной учебной группы.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-300" />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Студенты не найдены
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Измените строку поиска или выберите другую группу.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {selectedGroup?.name ??
                  'Все студенты'}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Показано: {filteredStudents.length}
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredStudents.map(
              (studentItem, index) => (
                <div
                  key={studentItem.student.user_id}
                  className="p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-semibold text-red-600">
                        {studentItem.student.avatar_url ? (
                          <img
                            src={
                              studentItem.student
                                .avatar_url
                            }
                            alt=""
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          getStudentInitials(
                            studentItem.student
                          )
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {index + 1}.{' '}
                          {getStudentName(
                            studentItem.student
                          )}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          ID пользователя:{' '}
                          {studentItem.student.user_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-wrap gap-2">
                      {studentItem.groups.map((group) => (
                        <span
                          key={group.id}
                          className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                        >
                          {group.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/attendance?groupId=${studentItem.groups[0]?.id ?? ''}`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Журнал
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/groups`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <Users className="h-4 w-4" />
                        Группы
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}