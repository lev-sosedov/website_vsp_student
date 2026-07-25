import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  TrendingUp,
  Users,
} from 'lucide-react';

import StatCard from '../../../components/dashboard/StatCard';
import { useAuth } from '../../../context/AuthContext';

import {
  getGroup,
  getGroupStudents,
} from '../../../api/academicApi';

import {
  loadStudentDashboard,
  type StudentDashboardGroup,
  type StudentDashboardLesson,
} from '../../../services/dashboardService';

import {
  homework,
  notifications,
} from '../../../data/dashboardData';

interface StudentGroupCard
  extends StudentDashboardGroup {
  branchId: number | null;
  studentsCount: number | null;
}

function getGreetingName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  userName: string | null | undefined
): string {
  const fullName = [firstName, lastName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  if (fullName) {
    return fullName;
  }

  if (userName?.trim()) {
    return userName.trim();
  }

  return 'студент';
}

function formatLessonTime(
  time: string | null | undefined
): string {
  if (!time) {
    return '--:--';
  }

  return time.slice(0, 5);
}

export default function StudentDashboard() {
  const { user } = useAuth();

  const [todayLessons, setTodayLessons] = useState<
    StudentDashboardLesson[]
  >([]);

  const [groups, setGroups] = useState<
    StudentGroupCard[]
  >([]);

  const [selectedGroupId, setSelectedGroupId] =
    useState<string>('all');

  const [lessonsLoading, setLessonsLoading] =
    useState(true);

  const [lessonsError, setLessonsError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard(): Promise<void> {
      if (!user?.id) {
        if (isMounted) {
          setTodayLessons([]);
          setGroups([]);
          setSelectedGroupId('all');
          setLessonsLoading(false);
        }

        return;
      }

      try {
        if (isMounted) {
          setLessonsLoading(true);
          setLessonsError(null);
        }

        const dashboardData =
          await loadStudentDashboard(user.id);

        const enrichedGroups = await Promise.all(
          dashboardData.groups.map(
            async (
              group
            ): Promise<StudentGroupCard> => {
              const [
                groupDetailsResult,
                studentsResult,
              ] = await Promise.allSettled([
                getGroup(group.id),
                getGroupStudents(group.id),
              ]);

              if (
                groupDetailsResult.status ===
                'rejected'
              ) {
                console.error(
                  `Не удалось получить данные группы ${group.id}:`,
                  groupDetailsResult.reason
                );
              }

              if (
                studentsResult.status ===
                'rejected'
              ) {
                console.error(
                  `Не удалось получить студентов группы ${group.id}:`,
                  studentsResult.reason
                );
              }

              return {
                ...group,

                branchId:
                  groupDetailsResult.status ===
                  'fulfilled'
                    ? groupDetailsResult.value
                        .branch_id ?? null
                    : null,

                studentsCount:
                  studentsResult.status ===
                  'fulfilled'
                    ? studentsResult.value.total
                    : null,
              };
            }
          )
        );

        if (isMounted) {
          setTodayLessons(
            dashboardData.todayLessons
          );

          setGroups(
            enrichedGroups
          );

          setSelectedGroupId('all');
        }
      } catch (error) {
        console.error(
          'Не удалось загрузить главную страницу студента:',
          error
        );

        if (isMounted) {
          setTodayLessons([]);
          setGroups([]);
          setSelectedGroupId('all');

          setLessonsError(
            error instanceof Error
              ? error.message
              : 'Не удалось загрузить данные главной страницы.'
          );
        }
      } finally {
        if (isMounted) {
          setLessonsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const greetingName = getGreetingName(
    user?.first_name,
    user?.last_name,
    user?.user_name
  );

  const visibleLessons =
    selectedGroupId === 'all'
      ? todayLessons
      : todayLessons.filter(
          (lesson) =>
            lesson.groupId.toString() ===
            selectedGroupId
        );

  const selectedGroup =
    selectedGroupId === 'all'
      ? null
      : groups.find(
          (group) =>
            group.id.toString() ===
            selectedGroupId
        ) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Здравствуйте, {greetingName}!
        </h1>
        <p className="mt-1 text-gray-500">
          Вот что у вас сегодня на повестке.
        </p>
      </div>

      {/* Пока данные карточек тестовые */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Средний балл"
          value="85%"
          change="+5%"
          trend="up"
          icon={TrendingUp}
          color="green"
        />

        <StatCard
          label="Посещаемость"
          value="95%"
          icon={CheckCircle2}
          color="blue"
        />

        <StatCard
          label="Домашние задания"
          value="3"
          icon={BookOpen}
          color="amber"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Реальные группы студента */}
        <div className="card min-h-[270px] p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Мои группы
            </h2>

            <Link
              to="/dashboard/schedule"
              className="inline-flex items-center gap-1 text-sm text-red-600 transition hover:text-red-700"
            >
              Все

              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {lessonsLoading && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-8 text-center">
              <Clock className="mx-auto mb-2 h-7 w-7 text-gray-300" />

              <p className="text-sm text-gray-500">
                Загружаем ваши группы...
              </p>
            </div>
          )}

          {!lessonsLoading &&
            lessonsError &&
            groups.length === 0 && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
                <p className="text-sm text-red-600">
                  {lessonsError}
                </p>
              </div>
            )}

          {!lessonsLoading &&
            !lessonsError &&
            groups.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />

                <p className="text-sm font-medium text-gray-700">
                  Учебные группы не найдены
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Вы пока не добавлены ни в одну
                  активную группу.
                </p>
              </div>
            )}

          {!lessonsLoading &&
            groups.length > 0 && (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50">
                        <Users className="h-5 w-5 text-red-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {group.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Филиал:{' '}
                          {group.branchId ?? 'не указан'}
                          {' · '}
                          Студентов:{' '}
                          {group.studentsCount ?? '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Link
                        to="/dashboard/messages"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Сообщения
                      </Link>

                      <Link
                        to={`/dashboard/schedule?groupId=${group.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                      >
                        <Calendar className="h-4 w-4" />
                        Расписание
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>


        {/* Пока тестовые уведомления */}
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
            {notifications
              .slice(0, 4)
              .map((notification) => (
                <div
                  key={notification.id}
                  className="flex gap-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
                    <Bell className="h-4 w-4 text-red-600" />
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
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Сегодняшние занятия — реальные данные */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Сегодняшние занятия
              </h2>

              {groups.length === 1 && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {groups[0].name}
                </p>
              )}

              {groups.length > 1 && (
                <div className="mt-2">
                  <label
                    htmlFor="dashboard-group"
                    className="sr-only"
                  >
                    Выберите учебную группу
                  </label>

                  <select
                    id="dashboard-group"
                    value={selectedGroupId}
                    onChange={(event) =>
                      setSelectedGroupId(
                        event.target.value
                      )
                    }
                    className="min-w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="all">
                      Все группы
                    </option>

                    {groups.map((group) => (
                      <option
                        key={group.id}
                        value={group.id.toString()}
                      >
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Link
              to="/dashboard/schedule"
              className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              Расписание

              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {lessonsLoading && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
                <Clock className="mx-auto mb-2 h-7 w-7 text-gray-300" />

                <p className="text-sm text-gray-500">
                  Загружаем расписание...
                </p>
              </div>
            )}

            {!lessonsLoading &&
              lessonsError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm text-red-600">
                    {lessonsError}
                  </p>
                </div>
              )}

            {!lessonsLoading &&
              !lessonsError &&
              visibleLessons.length === 0 && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-300" />

                  <p className="text-sm font-medium text-gray-700">
                    Сегодня занятий нет
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {selectedGroup
                      ? `В группе «${selectedGroup.name}» сегодня нет занятий.`
                      : 'Во всех ваших группах сегодня нет занятий.'}
                  </p>
                </div>
              )}

            {!lessonsLoading &&
              !lessonsError &&
              visibleLessons.map(
                (lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-red-50">
                      <span className="text-sm font-semibold text-red-600">
                        {formatLessonTime(
                          lesson.startTime
                        )}
                      </span>

                      <span className="text-[10px] text-red-400">
                        до{' '}
                        {formatLessonTime(
                          lesson.endTime
                        )}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {lesson.title}
                      </p>

                      {selectedGroupId === 'all' &&
                        groups.length > 1 && (
                          <p className="mt-0.5 text-xs font-medium text-red-500">
                            {lesson.groupName}
                          </p>
                        )}

                      <p className="text-xs text-gray-500">
                        {lesson.teacherName}
                        {' · '}
                        {lesson.roomName}
                      </p>

                      {lesson.description?.trim() && (
                        <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {lesson.lessonTypeLabel}
                    </span>
                  </div>
                )
              )}
          </div>
        </div>

        {/* Пока тестовые задания */}
        <div className="card p-6 ">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Ближайшие задания
            </h2>

            <Link
              to="/dashboard/homework"
              className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              Все задания

              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {homework
              .slice(0, 3)
              .map((homeworkItem) => (
                <div
                  key={homeworkItem.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition-all hover:bg-gray-50"
                >
                  {homeworkItem.status ===
                  'graded' ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                  ) : homeworkItem.status ===
                    'submitted' ? (
                    <Clock className="h-5 w-5 flex-shrink-0 text-amber-500" />
                  ) : (
                    <Circle className="h-5 w-5 flex-shrink-0 text-gray-300" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {homeworkItem.title}
                    </p>

                    <p className="text-xs text-gray-500">
                      {homeworkItem.subject}
                      {' · '}
                      {homeworkItem.due}
                    </p>
                  </div>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      homeworkItem.status ===
                      'graded'
                        ? 'bg-green-50 text-green-600'
                        : homeworkItem.status ===
                            'submitted'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {homeworkItem.status ===
                    'graded'
                      ? 'Оценено'
                      : homeworkItem.status ===
                          'submitted'
                        ? 'Сдано'
                        : 'Ожидает'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}