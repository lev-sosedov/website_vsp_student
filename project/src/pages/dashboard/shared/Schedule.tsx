import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  DoorOpen,
  Loader2,
  RefreshCw,
  UserRound,
} from 'lucide-react';


import { useAuth } from '../../../context/AuthContext';
import {
  getActiveUserGroups,
  getGroup,
  getStudentGroupMemberships,
  type AcademicGroup,
} from '../../../api/academicApi';
import {
  formatLocalDate,
  getGroupLessonsByDateRange,
  getRoom,
  type LessonSchedule,
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
  groupName: string;
}

interface ScheduleGroupOption {
  membershipId: number;
  group: AcademicGroup;
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
    localStorage.getItem('vshp_access_token') ??
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
  const [searchParams, setSearchParams] = useSearchParams();

  const normalizedRole = user?.role
    ?.trim()
    .toUpperCase();

  const isTeacher = normalizedRole === 'TEACHER';

  const requestedGroupId = Number(
    searchParams.get('groupId')
  );

  const [selectedWeekStart, setSelectedWeekStart] =
    useState<Date>(() => startOfWeek(new Date()));

  const [
    teacherGroups,
    setTeacherGroups,
  ] = useState<ScheduleGroupOption[]>([]);

  const [
    studentGroups,
    setStudentGroups,
  ] = useState<ScheduleGroupOption[]>([]);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(null);

  const [
    groupsLoading,
    setGroupsLoading,
  ] = useState(true);

  const [
    studentGroupsLoading,
    setStudentGroupsLoading,
  ] = useState(true);

  const [lessons, setLessons] = useState<
    DisplayLesson[]
  >([]);

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  const dayScrollRefs =
    useRef<Map<string, HTMLDivElement>>(
      new Map()
    );

  const scrollDayLessons = (
    dateString: string,
    direction: 'up' | 'down'
  ) => {
    const container =
      dayScrollRefs.current.get(dateString);

    if (!container) {
      return;
    }

    container.scrollBy({
      top:
        direction === 'down'
          ? container.clientHeight * 0.75
          : -container.clientHeight * 0.75,
      behavior: 'smooth',
    });
  };

  const selectedWeekEnd = useMemo(
    () => addDays(selectedWeekStart, 6),
    [selectedWeekStart]
  );

  useEffect(() => {
    if (!isTeacher) {
      setTeacherGroups([]);
      return;
    }

    const teacherId = Number(user?.id);

    if (
      !Number.isInteger(teacherId) ||
      teacherId <= 0
    ) {
      setTeacherGroups([]);
      setGroupsLoading(false);
      setError(
        'Не удалось определить ID преподавателя'
      );
      return;
    }

    let cancelled = false;

    async function loadTeacherGroups() {
      try {
        setGroupsLoading(true);
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

        const groupResults = await Promise.all(
          uniqueMemberships.map(
            async (membership) => ({
              membershipId: membership.id,
              group: await getGroup(
                membership.group_id
              ),
            })
          )
        );

        groupResults.sort((first, second) =>
          first.group.name.localeCompare(
            second.group.name,
            'ru'
          )
        );

        if (cancelled) {
          return;
        }

        setTeacherGroups(groupResults);

        const requestedGroupExists =
          Number.isInteger(requestedGroupId) &&
          requestedGroupId > 0 &&
          groupResults.some(
            (item) =>
              item.group.id === requestedGroupId
          );

        if (requestedGroupExists) {
          setSelectedGroupId(requestedGroupId);
        } else {
          setSelectedGroupId(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setTeacherGroups([]);
          setSelectedGroupId(null);
          setError(
            `Не удалось загрузить группы преподавателя: ${getErrorMessage(
              loadError
            )}`
          );
        }
      } finally {
        if (!cancelled) {
          setGroupsLoading(false);
        }
      }
    }

    void loadTeacherGroups();

    return () => {
      cancelled = true;
    };
  }, [
    isTeacher,
    user?.id,
    requestedGroupId,
  ]);

  useEffect(() => {
    if (isTeacher) {
      setStudentGroups([]);
      return;
    }

    const studentId = Number(user?.id);

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      setStudentGroups([]);
      setSelectedGroupId(null);
      setStudentGroupsLoading(false);
      setError(
        'Не удалось определить ID студента'
      );
      return;
    }

    let cancelled = false;

    async function loadStudentGroups() {
      try {
        setStudentGroupsLoading(true);
        setError(null);

        const memberships =
          await getStudentGroupMemberships(
            studentId
          );

        const uniqueMemberships = Array.from(
          new Map(
            memberships.map((membership) => [
              membership.group_id,
              membership,
            ])
          ).values()
        );

        const groupResults = await Promise.all(
          uniqueMemberships.map(
            async (membership) => ({
              membershipId: membership.id,
              group: await getGroup(
                membership.group_id
              ),
            })
          )
        );

        groupResults.sort((first, second) =>
          first.group.name.localeCompare(
            second.group.name,
            'ru'
          )
        );

        if (cancelled) {
          return;
        }

        setStudentGroups(groupResults);

        const requestedGroupExists =
          Number.isInteger(requestedGroupId) &&
          requestedGroupId > 0 &&
          groupResults.some(
            (item) =>
              item.group.id === requestedGroupId
          );

        setSelectedGroupId(
          requestedGroupExists
            ? requestedGroupId
            : null
        );
      } catch (loadError) {
        if (!cancelled) {
          setStudentGroups([]);
          setSelectedGroupId(null);
          setError(
            `Не удалось загрузить группы студента: ${getErrorMessage(
              loadError
            )}`
          );
        }
      } finally {
        if (!cancelled) {
          setStudentGroupsLoading(false);
        }
      }
    }

    void loadStudentGroups();

    return () => {
      cancelled = true;
    };
  }, [
    isTeacher,
    user?.id,
    requestedGroupId,
  ]);

  const loadSchedule = async () => {
    if (!user?.id) {
      setLessons([]);
      setIsLoading(false);
      setError(
        'Не удалось определить текущего пользователя'
      );
      return;
    }

    if (
      (isTeacher && groupsLoading) ||
      (!isTeacher && studentGroupsLoading)
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dateFrom =
        formatLocalDate(selectedWeekStart);

      const dateTo =
        formatLocalDate(selectedWeekEnd);

      let weekLessons: LessonSchedule[] = [];

      const groupNames = new Map<number, string>();

      if (isTeacher) {
        if (teacherGroups.length === 0) {
          setLessons([]);
          setError(
            'Преподаватель пока не назначен ни в одну активную группу'
          );
          return;
        }

        teacherGroups.forEach((item) => {
          groupNames.set(
            item.group.id,
            item.group.name
          );
        });

        const groupsToLoad =
          selectedGroupId === null
            ? teacherGroups
            : teacherGroups.filter(
                (item) =>
                  item.group.id === selectedGroupId
              );

        const lessonResponses =
          await Promise.all(
            groupsToLoad.map((item) =>
              getGroupLessonsByDateRange(
                item.group.id,
                dateFrom,
                dateTo
              )
            )
          );

        weekLessons = lessonResponses.flat();
      } else {
        if (studentGroups.length === 0) {
          setLessons([]);
          setError(
            'Студент пока не добавлен ни в одну активную группу'
          );
          return;
        }

        studentGroups.forEach((item) => {
          groupNames.set(
            item.group.id,
            item.group.name
          );
        });

        const groupsToLoad =
          selectedGroupId === null
            ? studentGroups
            : studentGroups.filter(
                (item) =>
                  item.group.id === selectedGroupId
              );

        const lessonResponses =
          await Promise.all(
            groupsToLoad.map((item) =>
              getGroupLessonsByDateRange(
                item.group.id,
                dateFrom,
                dateTo
              )
            )
          );

        weekLessons = lessonResponses.flat();
      }

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

          groupName:
            groupNames.get(lesson.group_id) ??
            `Группа №${lesson.group_id}`,
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
  }, [
    user?.id,
    selectedWeekStart,
    selectedGroupId,
    teacherGroups,
    studentGroups,
    groupsLoading,
    studentGroupsLoading,
    isTeacher,
  ]);

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

  const groupOptions = isTeacher
    ? teacherGroups
    : studentGroups;

  const groupOptionsLoading = isTeacher
    ? groupsLoading
    : studentGroupsLoading;

  const showGroupSelector = isTeacher
    ? groupOptions.length > 0
    : groupOptions.length > 1;

  const showLessonGroupName =
    isTeacher ||
    (studentGroups.length > 1 &&
      selectedGroupId === null);

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

      {showGroupSelector && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="block max-w-md space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Группа
            </span>

            <select
              value={selectedGroupId ?? ''}
              onChange={(event) => {
                const value = Number(
                  event.target.value
                );

                const nextGroupId =
                  Number.isInteger(value) &&
                  value > 0
                    ? value
                    : null;

                setSelectedGroupId(nextGroupId);

                const nextSearchParams =
                  new URLSearchParams(searchParams);

                if (nextGroupId === null) {
                  nextSearchParams.delete('groupId');
                } else {
                  nextSearchParams.set(
                    'groupId',
                    String(nextGroupId)
                  );
                }

                setSearchParams(nextSearchParams);
              }}
              disabled={
                groupOptionsLoading ||
                groupOptions.length === 0
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                Все группы
              </option>

              {groupOptions.map((item) => (
                <option
                  key={item.group.id}
                  value={item.group.id}
                >
                  {item.group.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

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
              className={`card flex h-[520px] min-h-0 flex-col overflow-hidden ${
                day.isToday
                  ? 'ring-2 ring-red-500 ring-offset-2'
                  : ''
              }`}
            >
              <div
                className={`flex shrink-0 items-center justify-between border-b px-5 py-4 ${
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

              <div className="relative min-h-0 flex-1">
                {day.lessons.length === 0 ? (
                  <div className="m-4 flex h-[calc(100%-2rem)] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                    <BookOpen className="h-7 w-7 text-gray-300" />

                    <p className="mt-2 text-sm font-medium text-gray-500">
                      Нет занятий
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      На этот день ничего не запланировано
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      ref={(element) => {
                        if (element) {
                          dayScrollRefs.current.set(
                            day.dateString,
                            element
                          );
                        } else {
                          dayScrollRefs.current.delete(
                            day.dateString
                          );
                        }
                      }}
                      className="h-full space-y-3 overflow-y-auto overscroll-contain p-4 pr-3 [scrollbar-gutter:stable]"
                    >
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

                                {showLessonGroupName && (
                                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                    {lesson.groupName}
                                  </span>
                                )}

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

                    {day.lessons.length > 1 && (
                      <div className="pointer-events-none absolute bottom-3 right-5 flex gap-1 rounded-xl border border-gray-200 bg-white/95 p-1 shadow-lg backdrop-blur">
                        <button
                          type="button"
                          onClick={() =>
                            scrollDayLessons(
                              day.dateString,
                              'up'
                            )
                          }
                          className="pointer-events-auto rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          title="Прокрутить занятия вверх"
                          aria-label="Прокрутить занятия вверх"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            scrollDayLessons(
                              day.dateString,
                              'down'
                            )
                          }
                          className="pointer-events-auto rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          title="Прокрутить занятия вниз"
                          aria-label="Прокрутить занятия вниз"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}