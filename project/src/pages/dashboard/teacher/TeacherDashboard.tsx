import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  UserRound,
  Users,
} from 'lucide-react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import StatCard from '../../../components/dashboard/StatCard';
import { useAuth } from '../../../context/AuthContext';

import {
  getActiveUserGroups,
  getGroup,
  getGroupStudents,
  type AcademicGroup,
  type GroupStudent,
} from '../../../api/academicApi';

import {
  notifications,
} from '../../../data/dashboardData';

interface TeacherDashboardGroup {
  membershipId: number;
  group: AcademicGroup;
  students: GroupStudent[];
}

interface UniqueStudentItem {
  student: GroupStudent;
  groupIds: number[];
  groupNames: string[];
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

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const teacherId = Number(user?.id);

  const [
    groups,
    setGroups,
  ] = useState<TeacherDashboardGroup[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
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
    } catch (loadError) {
      console.error(
        'Не удалось загрузить дашборд преподавателя:',
        loadError
      );

      setGroups([]);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const uniqueStudents = useMemo<
    UniqueStudentItem[]
  >(() => {
    const studentsMap =
      new Map<number, UniqueStudentItem>();

    groups.forEach((groupItem) => {
      groupItem.students.forEach((student) => {
        const existing =
          studentsMap.get(student.user_id);

        if (existing) {
          if (
            !existing.groupIds.includes(
              groupItem.group.id
            )
          ) {
            existing.groupIds.push(
              groupItem.group.id
            );
            existing.groupNames.push(
              groupItem.group.name
            );
          }

          return;
        }

        studentsMap.set(student.user_id, {
          student,
          groupIds: [groupItem.group.id],
          groupNames: [groupItem.group.name],
        });
      });
    });

    return Array.from(
      studentsMap.values()
    ).sort((first, second) =>
      getStudentName(first.student)
        .localeCompare(
          getStudentName(second.student),
          'ru'
        )
    );
  }, [groups]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />

          <p className="text-sm text-gray-500">
            Загружаем кабинет преподавателя...
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
            Кабинет преподавателя
          </h1>

          <p className="mt-1 text-gray-500">
            Обзор ваших групп и студентов
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
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
              Не удалось загрузить данные
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Мои группы"
          value={String(groups.length)}
          icon={Users}
          color="red"
        />

        <StatCard
          label="Студентов"
          value={String(uniqueStudents.length)}
          icon={BookOpen}
          color="blue"
        />

        <StatCard
          label="Заданий на проверке"
          value="12"
          icon={ClipboardList}
          color="amber"
        />

        <StatCard
          label="Средняя успеваемость"
          value="—"
          icon={CheckCircle2}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Мои группы
            </h2>

            <Link
              to="/dashboard/groups"
              className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              Все
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
              <Users className="mx-auto h-9 w-9 text-gray-300" />

              <p className="mt-3 font-medium text-gray-700">
                Активные группы не найдены
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Назначьте преподавателя участником группы
                в Academic Service.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((groupItem) => (
                <div
                  key={groupItem.group.id}
                  className="rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
                      <Users className="h-5 w-5 text-red-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {groupItem.group.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Филиал:{' '}
                        {groupItem.group.branch_id ??
                          'не указан'}
                        {' · '}
                        Студентов:{' '}
                        {groupItem.students.length}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/attendance?groupId=${groupItem.group.id}`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Посещаемость
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/schedule?groupId=${groupItem.group.id}`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <CalendarDays className="h-4 w-4" />
                        Расписание
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Уведомления
            </h2>

            <Link
              to="/dashboard/notifications"
              className="text-sm text-red-600 hover:text-red-700"
            >
              Все
            </Link>
          </div>

          <div className="space-y-3">
            {notifications.slice(0, 4).map((notification) => (
              <div
                key={notification.id}
                className="flex gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <MessageSquare className="h-4 w-4 text-red-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>

                  <p className="line-clamp-1 text-xs text-gray-500">
                    {notification.text}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-400">
                    {notification.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Уведомления пока используются из тестовых данных.
          </p>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Студенты
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Уникальные студенты из всех ваших групп
            </p>
          </div>

          <Link
            to="/dashboard/students"
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            Все студенты
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {uniqueStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
            <UserRound className="mx-auto h-9 w-9 text-gray-300" />

            <p className="mt-3 font-medium text-gray-700">
              Студенты не найдены
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Добавьте студентов в группы преподавателя.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="pb-3 font-medium">
                    Студент
                  </th>

                  <th className="pb-3 font-medium">
                    Группа
                  </th>

                  <th className="pb-3 font-medium">
                    ID
                  </th>

                  <th className="pb-3 text-right font-medium">
                    Действия
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {uniqueStudents
                  .slice(0, 8)
                  .map((studentItem) => (
                    <tr
                      key={studentItem.student.user_id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-semibold text-red-600">
                            {studentItem.student.avatar_url ? (
                              <img
                                src={
                                  studentItem.student
                                    .avatar_url
                                }
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              getStudentInitials(
                                studentItem.student
                              )
                            )}
                          </div>

                          <span className="font-medium text-gray-900">
                            {getStudentName(
                              studentItem.student
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 text-gray-500">
                        {studentItem.groupNames.join(', ')}
                      </td>

                      <td className="py-3 text-gray-500">
                        {studentItem.student.user_id}
                      </td>

                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/dashboard/attendance?groupId=${studentItem.groupIds[0]}`
                            )
                          }
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Открыть журнал
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: ClipboardList,
            label: 'Задания',
            to: '/dashboard/homework',
          },
          {
            icon: FileText,
            label: 'Материалы',
            to: '/dashboard/materials',
          },
          {
            icon: MessageSquare,
            label: 'Сообщения',
            to: '/dashboard/messages',
          },
          {
            icon: CheckCircle2,
            label: 'Посещаемость',
            to: '/dashboard/attendance',
          },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="card group flex flex-col items-center gap-2 p-5 transition-all hover:border-red-200 hover:bg-red-50"
          >
            <action.icon className="h-6 w-6 text-gray-400 transition-colors group-hover:text-red-600" />

            <span className="text-center text-xs font-medium text-gray-700">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}