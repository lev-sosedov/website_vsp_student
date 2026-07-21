import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  GraduationCap,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

import ProgressBar from '../../../components/dashboard/ProgressBar';
import StatCard from '../../../components/dashboard/StatCard';
import { useAuth } from '../../../context/AuthContext';

import {
  loadStudentDashboard,
  type StudentDashboardLesson,
} from '../../../services/dashboardService';

import {
  homework,
  notifications,
  progressData,
  upcomingEvents,
  weeklyActivity,
} from '../../../data/dashboardData';

function getGreetingName(
  firstName: string | null | undefined,
  userName: string | null | undefined
): string {
  if (firstName?.trim()) {
    return firstName.trim();
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

  const [groupName, setGroupName] = useState<string | null>(
    null
  );

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
          setGroupName(null);
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

        if (isMounted) {
          setTodayLessons(
            dashboardData.todayLessons
          );

          setGroupName(
            dashboardData.groupName
          );
        }
      } catch (error) {
        console.error(
          'Не удалось загрузить главную страницу студента:',
          error
        );

        if (isMounted) {
          setTodayLessons([]);
          setGroupName(null);

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

  const maxActivity = Math.max(
    ...weeklyActivity.map(
      (item) => item.value
    ),
    1
  );

  const greetingName = getGreetingName(
    user?.first_name,
    user?.user_name
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Здравствуйте, {greetingName}!
        </h1>

        <p className="mt-1 text-gray-500">
          Вот что у вас сегодня на повестке.
        </p>

        {groupName && (
          <p className="mt-1 text-sm text-gray-400">
            Учебная группа: {groupName}
          </p>
        )}
      </div>

      {/* Пока данные карточек тестовые */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          label="Активные задания"
          value="3"
          icon={BookOpen}
          color="amber"
        />

        <StatCard
          label="Завершено курсов"
          value="2"
          icon={Award}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Сегодняшние занятия — реальные данные */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Сегодняшние занятия
              </h2>

              {groupName && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {groupName}
                </p>
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
              todayLessons.length === 0 && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-300" />

                  <p className="text-sm font-medium text-gray-700">
                    Сегодня занятий нет
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Можно повторить пройденный материал
                    или отдохнуть.
                  </p>
                </div>
              )}

            {!lessonsLoading &&
              !lessonsError &&
              todayLessons.map(
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
        {/* Пока тестовые задания */}
        <div className="card p-6 lg:col-span-2">
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

        {/* Пока тестовые события */}
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Ближайшие события
          </h2>

          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex gap-3"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {event.title}
                  </p>

                  <p className="text-xs text-gray-500">
                    {event.date}
                    {' · '}
                    {event.time}
                  </p>

                  <p className="text-xs text-gray-400">
                    {event.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Пока тестовый прогресс */}
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Прогресс по курсам
          </h2>

          <div className="space-y-4">
            {progressData.map(
              (progressItem) => (
                <ProgressBar
                  key={
                    progressItem.subject
                  }
                  label={
                    progressItem.subject
                  }
                  value={
                    progressItem.value
                  }
                />
              )
            )}
          </div>
        </div>

        {/* Пока тестовая активность */}
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Активность за неделю
          </h2>

          <div className="flex h-40 items-end justify-between gap-2">
            {weeklyActivity.map(
              (activityItem) => (
                <div
                  key={
                    activityItem.day
                  }
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className="flex w-full items-end overflow-hidden rounded-lg bg-gray-100"
                    style={{
                      height: '120px',
                    }}
                  >
                    <div
                      className="w-full rounded-lg bg-red-500 transition-all duration-500 hover:bg-red-600"
                      style={{
                        height: `${
                          (activityItem.value /
                            maxActivity) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <span className="text-xs text-gray-400">
                    {
                      activityItem.day
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-5 text-lg font-bold text-gray-900">
          Быстрые действия
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: BookOpen,
              label:
                'Домашние задания',
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
              icon: GraduationCap,
              label: 'Успеваемость',
              to: '/dashboard/progress',
            },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 transition-all hover:border-red-200 hover:bg-red-50"
            >
              <action.icon className="h-6 w-6 text-gray-400 transition-colors group-hover:text-red-600" />

              <span className="text-center text-xs font-medium text-gray-700">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}