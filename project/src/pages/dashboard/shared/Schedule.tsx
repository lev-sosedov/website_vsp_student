import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Loader2,
  RefreshCw,
  UserRound,
} from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';
import { getPrimaryStudentGroupMembership } from '../../../api/academicApi';
import {
  formatLocalDate,
  getGroupLessonsByDateRange,
  getRoom,
  LessonSchedule,
} from '../../../api/scheduleApi';

const API_URL = import.meta.env.VITE_API_URL;

interface Teacher {
  id: number;
  user_name: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name?: string | null;
}

interface DisplayLesson extends LessonSchedule {
  teacherName: string;
  roomName: string;
}

interface WeekDay {
  date: Date;
  dateString: string;
  dayName: string;
  shortDate: string;
  isToday: boolean;
  lessons: DisplayLesson[];
}

const DAY_NAMES = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

const MONTH_NAMES = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

function getAccessToken(): string | null {
  return (
    localStorage.getItem('access_token') ??
    localStorage.getItem('accessToken')
  );
}

async function requestTeacher(
  teacherId: number
): Promise<Teacher> {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_URL}/api/v1/users/${teacherId}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Не удалось получить преподавателя ${teacherId}`
    );
  }

  return response.json() as Promise<Teacher>;
}

function getTeacherName(teacher: Teacher): string {
  const fullName = [
    teacher.last_name,
    teacher.first_name,
    teacher.middle_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    fullName ||
    teacher.user_name ||
    `Преподаватель №${teacher.id}`
  );
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const currentDay = result.getDay();

  const difference =
    currentDay === 0 ? -6 : 1 - currentDay;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function formatWeekRange(
  weekStart: Date,
  weekEnd: Date
): string {
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();

  const startMonth =
    MONTH_NAMES[weekStart.getMonth()];
  const endMonth =
    MONTH_NAMES[weekEnd.getMonth()];

  const startYear = weekStart.getFullYear();
  const endYear = weekEnd.getFullYear();

  if (
    weekStart.getMonth() === weekEnd.getMonth() &&
    startYear === endYear
  ) {
    return `${startDay}–${endDay} ${endMonth} ${endYear}`;
  }

  if (startYear === endYear) {
    return `${startDay} ${startMonth} — ${endDay} ${endMonth} ${endYear}`;
  }

  return `${startDay} ${startMonth} ${startYear} — ${endDay} ${endMonth} ${endYear}`;
}

function getLessonTitle(
  lesson: LessonSchedule
): string {
  if (lesson.topic?.trim()) {
    return lesson.topic;
  }

  switch (lesson.lesson_type) {
    case 'extra':
      return 'Дополнительное занятие';

    case 'replacement':
      return 'Замена занятия';

    case 'consultation':
      return 'Консультация';

    default:
      return 'Занятие';
  }
}

function getLessonTypeLabel(
  lesson: LessonSchedule
): string {
  if (lesson.is_extra) {
    return 'Дополнительное';
  }

  switch (lesson.lesson_type) {
    case 'extra':
      return 'Дополнительное';

    case 'replacement':
      return 'Замена';

    case 'consultation':
      return 'Консультация';

    case 'regular':
      return 'Основное';

    default:
      return 'Занятие';
  }
}

function getStatusLabel(
  status: LessonSchedule['status']
): string | null {
  switch (status) {
    case 'cancelled':
      return 'Отменено';

    case 'rescheduled':
      return 'Перенесено';

    case 'completed':
      return 'Завершено';

    default:
      return null;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить расписание';
}

export default function Schedule() {
  const { user } = useAuth();

  const [selectedWeekStart, setSelectedWeekStart] =
    useState<Date>(() => startOfWeek(new Date()));

  const [lessons, setLessons] = useState<
    DisplayLesson[]
  >([]);

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  const selectedWeekEnd = useMemo(
    () => addDays(selectedWeekStart, 6),
    [selectedWeekStart]
  );

  const loadSchedule = async () => {
    if (!user?.id) {
      setLessons([]);
      setIsLoading(false);
      setError(
        'Не удалось определить текущего пользователя'
      );

      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const membership =
        await getPrimaryStudentGroupMembership(
          user.id
        );

      if (!membership?.group_id) {
        setLessons([]);
        setError(
          'Пользователь пока не добавлен в учебную группу'
        );

        return;
      }

      const dateFrom =
        formatLocalDate(selectedWeekStart);

      const dateTo =
        formatLocalDate(selectedWeekEnd);

      const weekLessons =
        await getGroupLessonsByDateRange(
          membership.group_id,
          dateFrom,
          dateTo
        );

      const teacherIds = Array.from(
        new Set(
          weekLessons.map(
            (lesson) => lesson.teacher_id
          )
        )
      );

      const roomIds = Array.from(
        new Set(
          weekLessons
            .map((lesson) => lesson.room_id)
            .filter(
              (roomId): roomId is number =>
                roomId !== null
            )
        )
      );

      const teacherEntries =
        await Promise.all(
          teacherIds.map(async (teacherId) => {
            try {
              const teacher =
                await requestTeacher(teacherId);

              return [
                teacherId,
                getTeacherName(teacher),
              ] as const;
            } catch {
              return [
                teacherId,
                `Преподаватель №${teacherId}`,
              ] as const;
            }
          })
        );

      const roomEntries = await Promise.all(
        roomIds.map(async (roomId) => {
          try {
            const room = await getRoom(roomId);

            return [
              roomId,
              room.name,
            ] as const;
          } catch {
            return [
              roomId,
              `Кабинет №${roomId}`,
            ] as const;
          }
        })
      );

      const teacherNames = new Map(
        teacherEntries
      );

      const roomNames = new Map(roomEntries);

      const preparedLessons = weekLessons
        .map<DisplayLesson>((lesson) => ({
          ...lesson,

          teacherName:
            teacherNames.get(
              lesson.teacher_id
            ) ??
            `Преподаватель №${lesson.teacher_id}`,

          roomName:
            lesson.room_id === null
              ? 'Кабинет не указан'
              : roomNames.get(lesson.room_id) ??
                `Кабинет №${lesson.room_id}`,
        }))
        .sort((firstLesson, secondLesson) => {
          const dateComparison =
            firstLesson.lesson_date.localeCompare(
              secondLesson.lesson_date
            );

          if (dateComparison !== 0) {
            return dateComparison;
          }

          return firstLesson.start_time.localeCompare(
            secondLesson.start_time
          );
        });

      setLessons(preparedLessons);
    } catch (scheduleError) {
      setLessons([]);
      setError(
        getErrorMessage(scheduleError)
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedule();
  }, [user?.id, selectedWeekStart]);

  const weekDays = useMemo<WeekDay[]>(() => {
    const today = formatLocalDate(new Date());

    return DAY_NAMES.map((dayName, index) => {
      const dayDate = addDays(
        selectedWeekStart,
        index
      );

      const dateString =
        formatLocalDate(dayDate);

      return {
        date: dayDate,
        dateString,
        dayName,

        shortDate: `${dayDate.getDate()} ${
          MONTH_NAMES[dayDate.getMonth()]
        }`,

        isToday: dateString === today,

        lessons: lessons.filter(
          (lesson) =>
            lesson.lesson_date === dateString
        ),
      };
    });
  }, [lessons, selectedWeekStart]);

  const goToPreviousWeek = () => {
    setSelectedWeekStart((currentWeek) =>
      addDays(currentWeek, -7)
    );
  };

  const goToNextWeek = () => {
    setSelectedWeekStart((currentWeek) =>
      addDays(currentWeek, 7)
    );
  };

  const goToCurrentWeek = () => {
    setSelectedWeekStart(
      startOfWeek(new Date())
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Расписание
          </h1>

          <p className="mt-1 text-gray-500">
            Ваши занятия на неделю
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={goToCurrentWeek}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-red-200 hover:text-red-600"
          >
            <Calendar className="h-4 w-4" />
            Текущая неделя
          </button>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={goToPreviousWeek}
              aria-label="Предыдущая неделя"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-52 px-3 text-center">
              <p className="text-sm font-semibold text-gray-900">
                {formatWeekRange(
                  selectedWeekStart,
                  selectedWeekEnd
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={goToNextWeek}
              aria-label="Следующая неделя"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="card flex min-h-72 items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />

            <p className="mt-3 text-sm text-gray-500">
              Загружаем расписание…
            </p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="card border border-red-100 bg-red-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <p className="font-semibold text-red-800">
                  Не удалось загрузить расписание
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadSchedule()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {weekDays.map((day) => (
            <section
              key={day.dateString}
              className={`card overflow-hidden ${
                day.isToday
                  ? 'ring-2 ring-red-500 ring-offset-2'
                  : ''
              }`}
            >
              <div
                className={`flex items-center justify-between border-b px-5 py-4 ${
                  day.isToday
                    ? 'border-red-100 bg-red-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      day.isToday
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900">
                        {day.dayName}
                      </h2>

                      {day.isToday && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Сегодня
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500">
                      {day.shortDate}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {day.lessons.length}
                </span>
              </div>

              <div className="p-4">
                {day.lessons.length === 0 ? (
                  <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                    <BookOpen className="h-7 w-7 text-gray-300" />

                    <p className="mt-2 text-sm font-medium text-gray-500">
                      Нет занятий
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      На этот день ничего не запланировано
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {day.lessons.map((lesson) => {
                      const statusLabel =
                        getStatusLabel(
                          lesson.status
                        );

                      const isCancelled =
                        lesson.status ===
                        'cancelled';

                      return (
                        <article
                          key={lesson.id}
                          className={`rounded-xl border p-4 transition ${
                            isCancelled
                              ? 'border-gray-200 bg-gray-50 opacity-70'
                              : 'border-gray-100 bg-white hover:border-red-100 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  {getLessonTypeLabel(
                                    lesson
                                  )}
                                </span>

                                {statusLabel && (
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      lesson.status ===
                                      'cancelled'
                                        ? 'bg-gray-200 text-gray-700'
                                        : lesson.status ===
                                            'completed'
                                          ? 'bg-green-50 text-green-700'
                                          : 'bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {statusLabel}
                                  </span>
                                )}
                              </div>

                              <h3
                                className={`font-semibold ${
                                  isCancelled
                                    ? 'text-gray-500 line-through'
                                    : 'text-gray-900'
                                }`}
                              >
                                {getLessonTitle(
                                  lesson
                                )}
                              </h3>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2.5">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4 shrink-0 text-red-500" />

                              <span className="font-medium">
                                {formatTime(
                                  lesson.start_time
                                )}
                                {' – '}
                                {formatTime(
                                  lesson.end_time
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <UserRound className="h-4 w-4 shrink-0 text-gray-400" />

                              <span className="truncate">
                                {
                                  lesson.teacherName
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DoorOpen className="h-4 w-4 shrink-0 text-gray-400" />

                              <span className="truncate">
                                {lesson.roomName}
                              </span>
                            </div>
                          </div>

                          {lesson.description && (
                            <p className="mt-4 border-t border-gray-100 pt-3 text-sm leading-6 text-gray-500">
                              {lesson.description}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}