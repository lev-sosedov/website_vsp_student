import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  Building2,
  CalendarDays,
  Loader2,
  RefreshCw,
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

interface TeacherGroupItem {
  membershipId: number;
  group: AcademicGroup;
  students: GroupStudent[];
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

export default function TeacherGroups() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  const [groups, setGroups] = useState<TeacherGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!user?.id) {
      setGroups([]);
      setLoading(false);
      setError('Не удалось определить текущего преподавателя');
      return;
    }

    const userId = Number(user.id);

    if (!Number.isFinite(userId)) {
      setGroups([]);
      setLoading(false);
      setError('Некорректный ID текущего преподавателя');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const memberships = await getActiveUserGroups(userId);

      const teacherMemberships = memberships.filter(
        (membership) =>
          membership.role === 'teacher' ||
          membership.role === 'assistant'
      );

      const loadedGroups = await Promise.all(
        teacherMemberships.map(async (membership) => {
          const [
            group,
            studentResponse,
          ] = await Promise.all([
            getGroup(membership.group_id),
            getGroupStudents(membership.group_id),
          ]);

          return {
            membershipId: membership.id,
            group,
            students: studentResponse.items.filter(
              (student) => student.is_active
            ),
          };
        })
      );

      loadedGroups.sort((firstGroup, secondGroup) =>
        firstGroup.group.name.localeCompare(
          secondGroup.group.name,
          'ru'
        )
      );

      setGroups(loadedGroups);
    } catch (loadError) {
      console.error(
        'Не удалось загрузить группы преподавателя:',
        loadError
      );

      setGroups([]);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const uniqueStudentsCount = useMemo(() => {
    const studentIds = new Set<number>();

    groups.forEach((groupItem) => {
      groupItem.students.forEach((student) => {
        studentIds.add(student.user_id);
      });
    });

    return studentIds.size;
  }, [groups]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />

          <p className="text-sm text-gray-500">
            Загружаем группы преподавателя...
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
            Мои группы
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Учебные группы, в которых вы назначены преподавателем.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadGroups()}
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
              Не удалось загрузить группы
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
                {groups.length}
              </p>

              <p className="text-sm text-gray-500">
                Групп преподавателя
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
                {uniqueStudentsCount}
              </p>

              <p className="text-sm text-gray-500">
                Уникальных студентов
              </p>
            </div>
          </div>
        </div>
      </div>

      {!error && groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Группы не найдены
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Текущий преподаватель пока не назначен ни в одну
            активную учебную группу.
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          {groups.map((groupItem) => {
            const {
              group,
              students,
            } = groupItem;

            return (
              <article
                key={group.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="border-b border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">
                          {group.name}
                        </h2>

                        {group.is_active !== false && (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                            Активна
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        {group.description?.trim() ||
                          'Описание группы пока не заполнено'}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      <UserRound className="h-4 w-4" />

                      <span>
                        Студентов: {students.length}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />

                      <span>
                        Филиал: {group.branch_id ?? 'не указан'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Студенты группы
                  </p>

                  {students.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">
                        В группе пока нет активных студентов
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {students.slice(0, 5).map((student) => (
                        <div
                          key={student.membership_id}
                          className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-red-600 shadow-sm">
                              {student.user_id}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {getStudentName(student)}
                              </p>

                              <p className="text-xs text-gray-400">
                                ID пользователя: {student.user_id}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {students.length > 5 && (
                        <p className="pt-1 text-center text-xs text-gray-400">
                          Ещё студентов: {students.length - 5}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 p-5 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/dashboard/attendance?groupId=${group.id}`
                      )
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <Users className="h-4 w-4" />
                    Посещаемость
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/dashboard/schedule?groupId=${group.id}`
                      )
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Расписание
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}