import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCw,
  UserRound,

} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useAuth,
} from '../../../context/AuthContext';

import {
  loadParentChildSchedule,
  loadParentScheduleChildren,
  type ParentScheduleChild,
  type ParentScheduleData,
  type ParentScheduleLesson,
} from '../../../services/parentScheduleService';


const EMPTY_DATA: ParentScheduleData = {
  groups: [],
  lessons: [],
  hasActiveGroup: false,
  warnings: [],
};


const DAY_NAMES = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];


function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось загрузить расписание';
}


function startOfWeek(
  value: Date
): Date {
  const date =
    new Date(value);

  const day =
    date.getDay();

  const difference =
    day === 0
      ? -6
      : 1 - day;

  date.setDate(
    date.getDate() +
      difference
  );

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}


function addDays(
  value: Date,
  days: number
): Date {
  const date =
    new Date(value);

  date.setDate(
    date.getDate() +
      days
  );

  return date;
}


function formatDateKey(
  value: Date
): string {
  const year =
    value.getFullYear();

  const month =
    String(
      value.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      value.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}


function formatWeekRange(
  weekStart: Date
): string {
  const weekEnd =
    addDays(
      weekStart,
      6
    );

  const formatter =
    new Intl.DateTimeFormat(
      'ru-RU',
      {
        day: 'numeric',
        month: 'long',
      }
    );

  const startText =
    formatter.format(
      weekStart
    );

  const endText =
    new Intl.DateTimeFormat(
      'ru-RU',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    ).format(
      weekEnd
    );

  return `${startText} — ${endText}`;
}


function formatTime(
  value: string
): string {
  return value.slice(
    0,
    5
  );
}


function getLessonTitle(
  lesson: ParentScheduleLesson
): string {
  if (
    lesson.topic?.trim()
  ) {
    return lesson.topic;
  }

  switch (
    lesson.lesson_type
  ) {
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
  lesson: ParentScheduleLesson
): string {
  if (
    lesson.is_extra
  ) {
    return 'Дополнительное';
  }

  switch (
    lesson.lesson_type
  ) {
    case 'replacement':
      return 'Замена';

    case 'consultation':
      return 'Консультация';

    case 'extra':
      return 'Дополнительное';

    default:
      return 'Основное';
  }
}


function getStatusLabel(
  status: string
): string {
  switch (
    status
  ) {
    case 'cancelled':
      return 'Отменено';

    case 'completed':
      return 'Завершено';

    case 'rescheduled':
      return 'Перенесено';

    default:
      return 'Запланировано';
  }
}


function getStatusClass(
  status: string
): string {
  switch (
    status
  ) {
    case 'cancelled':
      return 'bg-red-50 text-red-700';

    case 'completed':
      return 'bg-green-50 text-green-700';

    case 'rescheduled':
      return 'bg-amber-50 text-amber-700';

    default:
      return 'bg-blue-50 text-blue-700';
  }
}


function getInitials(
  name: string
): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0)
      )
      .join('')
      .toUpperCase() ||
    '?'
  );
}


function ChildAvatar({
  child,
}: {
  child: ParentScheduleChild;
}) {
  if (
    child.avatarUrl
  ) {
    return (
      <img
        src={child.avatarUrl}
        alt={child.name}
        className="h-11 w-11 rounded-full object-cover ring-1 ring-gray-200"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600">
      {getInitials(
        child.name
      )}
    </div>
  );
}


function LessonCard({
  lesson,
  showGroup,
}: {
  lesson: ParentScheduleLesson;
  showGroup: boolean;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${
        lesson.status ===
        'cancelled'
          ? 'border-red-100 bg-red-50/40 opacity-75'
          : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              <Clock3 className="h-3.5 w-3.5" />

              {formatTime(
                lesson.start_time
              )}
              {' – '}
              {formatTime(
                lesson.end_time
              )}
            </span>

            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
              {getLessonTypeLabel(
                lesson
              )}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                lesson.status
              )}`}
            >
              {getStatusLabel(
                lesson.status
              )}
            </span>
          </div>

          <h3 className="mt-3 font-bold text-gray-900">
            {getLessonTitle(
              lesson
            )}
          </h3>

          {lesson.description?.trim() && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {lesson.description}
            </p>
          )}
        </div>

        {showGroup && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
            <GraduationCap className="h-3.5 w-3.5" />

            {lesson.groupName}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-sm text-gray-500 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0" />

          <span className="truncate">
            {lesson.teacherName}
          </span>
        </span>

        <span className="inline-flex items-center gap-2">
          <DoorOpen className="h-4 w-4 shrink-0" />

          <span className="truncate">
            {lesson.roomName}
          </span>
        </span>
      </div>
    </article>
  );
}


export default function ParentSchedule() {
  const {
    user,
  } = useAuth();

  const parentId =
    Number(user?.id ?? 0);

  const [
    children,
    setChildren,
  ] = useState<
    ParentScheduleChild[]
  >([]);

  const [
    selectedChildId,
    setSelectedChildId,
  ] = useState<number | null>(
    null
  );

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(
    null
  );

  const [
    weekStart,
    setWeekStart,
  ] = useState(
    () =>
      startOfWeek(
        new Date()
      )
  );

  const [
    data,
    setData,
  ] = useState<
    ParentScheduleData
  >(EMPTY_DATA);

  const [
    loadingChildren,
    setLoadingChildren,
  ] = useState(true);

  const [
    loadingSchedule,
    setLoadingSchedule,
  ] = useState(false);

  const [
    pageError,
    setPageError,
  ] = useState<string | null>(
    null
  );

  const [
    scheduleError,
    setScheduleError,
  ] = useState<string | null>(
    null
  );


  const weekEnd =
    useMemo(
      () =>
        addDays(
          weekStart,
          6
        ),
      [weekStart]
    );


  const loadChildren =
    useCallback(async () => {
      setLoadingChildren(true);
      setPageError(null);

      try {
        const loadedChildren =
          await loadParentScheduleChildren(
            parentId
          );

        setChildren(
          loadedChildren
        );

        setSelectedChildId(
          (current) =>
            current !== null &&
            loadedChildren.some(
              (child) =>
                child.id ===
                current
            )
              ? current
              : (
                  loadedChildren[0]
                    ?.id ??
                  null
                )
        );
      } catch (error) {
        setChildren([]);
        setSelectedChildId(
          null
        );
        setPageError(
          getErrorMessage(error)
        );
      } finally {
        setLoadingChildren(false);
      }
    }, [parentId]);


  const childLoadSequence = useRef(0);

  const loadSchedule =
    useCallback(async () => {
      const sequence = ++childLoadSequence.current;
      if (
        selectedChildId === null
      ) {
        setData(
          EMPTY_DATA
        );
        return;
      }

      setLoadingSchedule(true);
      setScheduleError(null);

      try {
        const loadedData =
          await loadParentChildSchedule(
            selectedChildId,
            weekStart,
            weekEnd
          );
        if (sequence !== childLoadSequence.current) return;

        setData(
          loadedData
        );

        setSelectedGroupId(
          (current) =>
            current !== null &&
            loadedData.groups.some(
              (group) =>
                group.id ===
                current
            )
              ? current
              : null
        );
      } catch (error) {
        if (sequence !== childLoadSequence.current) return;
        setData(
          EMPTY_DATA
        );
        setScheduleError(
          getErrorMessage(error)
        );
      } finally {
        if (sequence === childLoadSequence.current) {
          setLoadingSchedule(false);
        }
      }
    }, [
      selectedChildId,
      weekEnd,
      weekStart,
    ]);


  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);


  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);


  const selectedChild =
    useMemo(
      () =>
        children.find(
          (child) =>
            child.id ===
            selectedChildId
        ) ?? null,
      [
        children,
        selectedChildId,
      ]
    );


  const visibleLessons =
    useMemo(
      () =>
        data.lessons.filter(
          (lesson) =>
            selectedGroupId ===
              null ||
            lesson.group_id ===
              selectedGroupId
        ),
      [
        data.lessons,
        selectedGroupId,
      ]
    );


  const days =
    useMemo(
      () =>
        Array.from(
          {
            length: 7,
          },
          (
            _,
            index
          ) => {
            const date =
              addDays(
                weekStart,
                index
              );

            const dateKey =
              formatDateKey(
                date
              );

            return {
              date,
              dateKey,
              name:
                DAY_NAMES[index],
              isToday:
                dateKey ===
                formatDateKey(
                  new Date()
                ),
              lessons:
                visibleLessons.filter(
                  (lesson) =>
                    lesson.lesson_date ===
                    dateKey
                ),
            };
          }
        ),
      [
        visibleLessons,
        weekStart,
      ]
    );


  const activeLessons =
    visibleLessons.filter(
      (lesson) =>
        lesson.status !==
        'cancelled'
    );


  const todayKey =
    formatDateKey(
      new Date()
    );


  const todayLessons =
    visibleLessons.filter(
      (lesson) =>
        lesson.lesson_date ===
        todayKey &&
        lesson.status !==
          'cancelled'
    );


  const extraLessons =
    visibleLessons.filter(
      (lesson) =>
        lesson.is_extra ||
        lesson.lesson_type ===
          'extra'
    ).length;


  const cancelledLessons =
    visibleLessons.filter(
      (lesson) =>
        lesson.status ===
        'cancelled'
    ).length;


  const upcomingLesson =
    useMemo(() => {
      const now =
        new Date();

      return activeLessons.find(
        (lesson) => {
          const start =
            new Date(
              `${lesson.lesson_date}T${lesson.start_time}`
            );

          return (
            !Number.isNaN(
              start.getTime()
            ) &&
            start >= now
          );
        }
      ) ?? null;
    }, [activeLessons]);


  if (loadingChildren) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />

          <p>
            Загружаем данные родителя...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Расписание
          </h1>

          <p className="mt-1 text-gray-500">
            Занятия привязанного ребёнка по учебным группам
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadChildren();
            void loadSchedule();
          }}
          disabled={
            loadingSchedule
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loadingSchedule
                ? 'animate-spin'
                : ''
            }`}
          />

          Обновить
        </button>
      </div>


      {pageError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-semibold text-red-800">
              Не удалось загрузить детей
            </p>

            <p className="mt-1 text-sm text-red-700">
              {pageError}
            </p>
          </div>
        </div>
      )}


      {!pageError &&
        children.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <UserRound className="mx-auto h-10 w-10 text-amber-500" />

            <h2 className="mt-3 font-bold text-amber-900">
              Ребёнок не привязан
            </h2>

            <p className="mt-1 text-sm text-amber-700">
              Администратор должен привязать к вашему аккаунту хотя бы одного студента.
            </p>
          </div>
        )}


      {selectedChild && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_minmax(220px,0.7fr)] lg:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ребёнок
              </p>

              {children.length >
              1 ? (
                <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                  <ChildAvatar
                    child={
                      selectedChild
                    }
                  />

                  <select
                    value={
                      selectedChild.id
                    }
                    onChange={
                      (event) => {
                        setSelectedChildId(
                          Number(
                            event.target
                              .value
                          )
                        );

                        setSelectedGroupId(
                          null
                        );
                      }
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  >
                    {children.map(
                      (child) => (
                        <option
                          key={
                            child.id
                          }
                          value={
                            child.id
                          }
                        >
                          {child.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <ChildAvatar
                    child={
                      selectedChild
                    }
                  />

                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">
                      {
                        selectedChild.name
                      }
                    </p>

                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {
                        selectedChild.phoneNumber
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="parent-schedule-group"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Учебная группа
              </label>

              <select
                id="parent-schedule-group"
                value={
                  selectedGroupId ??
                  ''
                }
                onChange={
                  (event) => {
                    const value =
                      event.target
                        .value;

                    setSelectedGroupId(
                      value
                        ? Number(value)
                        : null
                    );
                  }
                }
                disabled={
                  data.groups.length <=
                  1
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">
                  {data.groups.length ===
                  0
                    ? 'Группа не найдена'
                    : data.groups.length ===
                        1
                      ? data.groups[0]
                          .name
                      : 'Все группы'}
                </option>

                {data.groups.length >
                  1 &&
                  data.groups.map(
                    (group) => (
                      <option
                        key={
                          group.id
                        }
                        value={
                          group.id
                        }
                      >
                        {
                          group.name
                        }
                      </option>
                    )
                  )}
              </select>
            </div>
          </div>
        </div>
      )}


      {scheduleError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-semibold text-red-800">
              Не удалось загрузить расписание
            </p>

            <p className="mt-1 text-sm text-red-700">
              {scheduleError}
            </p>
          </div>
        </div>
      )}


      {!scheduleError &&
        selectedChild &&
        !data.hasActiveGroup && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <p className="font-semibold text-amber-900">
                Ребёнок пока не добавлен в активную учебную группу
              </p>

              <p className="mt-1 text-sm text-amber-700">
                После добавления в группу расписание появится на этой странице.
              </p>
            </div>
          </div>
        )}


      {data.warnings.length >
        0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <p className="text-sm text-amber-800">
            {data.warnings.join(
              ' '
            )}
          </p>
        </div>
      )}


      {loadingSchedule ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />

            <p>
              Загружаем расписание ребёнка...
            </p>
          </div>
        </div>
      ) : selectedChild &&
        !scheduleError ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-50 p-2.5">
                  <CalendarDays className="h-5 w-5 text-red-600" />
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {activeLessons.length}
                  </p>

                  <p className="text-xs text-gray-500">
                    Занятий на неделе
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-50 p-2.5">
                  <Clock3 className="h-5 w-5 text-green-600" />
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {todayLessons.length}
                  </p>

                  <p className="text-xs text-gray-500">
                    Сегодня
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {extraLessons}
                  </p>

                  <p className="text-xs text-gray-500">
                    Дополнительных
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {cancelledLessons}
                  </p>

                  <p className="text-xs text-gray-500">
                    Отменено
                  </p>
                </div>
              </div>
            </div>
          </div>


          {upcomingLesson && (
            <section className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                    Ближайшее занятие
                  </p>

                  <h2 className="mt-1 font-bold text-gray-900">
                    {getLessonTitle(
                      upcomingLesson
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    {
                      upcomingLesson.lesson_date
                    }
                    {' · '}
                    {formatTime(
                      upcomingLesson.start_time
                    )}
                    {' · '}
                    {
                      upcomingLesson.groupName
                    }
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2">
                    <UserRound className="h-4 w-4 text-red-600" />

                    {
                      upcomingLesson.teacherName
                    }
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2">
                    <MapPin className="h-4 w-4 text-red-600" />

                    {
                      upcomingLesson.roomName
                    }
                  </span>
                </div>
              </div>
            </section>
          )}


          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-gray-900">
                  Недельное расписание
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {formatWeekRange(
                    weekStart
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setWeekStart(
                      startOfWeek(
                        new Date()
                      )
                    )
                  }
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Текущая неделя
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setWeekStart(
                      (current) =>
                        addDays(
                          current,
                          -7
                        )
                    )
                  }
                  className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                  aria-label="Предыдущая неделя"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setWeekStart(
                      (current) =>
                        addDays(
                          current,
                          7
                        )
                    )
                  }
                  className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                  aria-label="Следующая неделя"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-2 xl:grid-cols-3">
              {days.map(
                (day) => (
                  <section
                    key={
                      day.dateKey
                    }
                    className={`rounded-xl border ${
                      day.isToday
                        ? 'border-red-200 bg-red-50/30'
                        : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {day.name}
                        </h3>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {new Intl.DateTimeFormat(
                            'ru-RU',
                            {
                              day: 'numeric',
                              month: 'long',
                            }
                          ).format(
                            day.date
                          )}
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-600">
                        {
                          day.lessons.length
                        }
                      </span>
                    </div>

                    <div className="space-y-3 p-3">
                      {day.lessons.length ===
                      0 ? (
                        <div className="flex min-h-28 flex-col items-center justify-center text-center">
                          <CalendarDays className="h-7 w-7 text-gray-300" />

                          <p className="mt-2 text-sm text-gray-400">
                            Занятий нет
                          </p>
                        </div>
                      ) : (
                        day.lessons.map(
                          (lesson) => (
                            <LessonCard
                              key={
                                lesson.id
                              }
                              lesson={
                                lesson
                              }
                              showGroup={
                                data.groups
                                  .length >
                                  1 &&
                                selectedGroupId ===
                                  null
                              }
                            />
                          )
                        )
                      )}
                    </div>
                  </section>
                )
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
