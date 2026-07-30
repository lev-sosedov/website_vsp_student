import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Loader2,
  MessageSquareText,

  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useAuth,
} from '../../../context/AuthContext';

import {
  type AttendanceStatus,
} from '../../../api/attendanceApi';

import {
  loadParentAttendanceChildren,
  loadParentChildAttendance,
  type ParentAttendanceChild,
  type ParentAttendanceData,
  type ParentAttendanceRow,
} from '../../../services/parentAttendanceService';


const EMPTY_DATA: ParentAttendanceData = {
  groups: [],
  rows: [],
  hasActiveGroup: false,
  warnings: [],
};


const STATUS_LABELS: Record<
  AttendanceStatus,
  string
> = {
  present: 'Присутствовал',
  absent: 'Отсутствовал',
  late: 'Опоздал',
  excused: 'Уважительная причина',
};


const STATUS_SHORT_LABELS: Record<
  AttendanceStatus,
  string
> = {
  present: 'Присутствовал',
  absent: 'Пропуск',
  late: 'Опоздание',
  excused: 'Уважительная',
};


const STATUS_CLASSES: Record<
  AttendanceStatus,
  string
> = {
  present:
    'border-green-200 bg-green-50 text-green-700',
  absent:
    'border-red-200 bg-red-50 text-red-700',
  late:
    'border-amber-200 bg-amber-50 text-amber-700',
  excused:
    'border-blue-200 bg-blue-50 text-blue-700',
};


const CALENDAR_CLASSES: Record<
  AttendanceStatus,
  string
> = {
  present:
    'border-green-100 bg-green-50 text-green-700',
  absent:
    'border-red-100 bg-red-50 text-red-700',
  late:
    'border-amber-100 bg-amber-50 text-amber-700',
  excused:
    'border-blue-100 bg-blue-50 text-blue-700',
};


const STATUS_PRIORITY: Record<
  AttendanceStatus,
  number
> = {
  present: 1,
  excused: 2,
  late: 3,
  absent: 4,
};


const WEEK_DAYS = [
  'Пн',
  'Вт',
  'Ср',
  'Чт',
  'Пт',
  'Сб',
  'Вс',
];


interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
  lateMinutes: number;
}


function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось загрузить посещаемость';
}

function formatMonth(
  date: Date
): string {
  const value =
    new Intl.DateTimeFormat(
      'ru-RU',
      {
        month: 'long',
        year: 'numeric',
      }
    ).format(date);

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}


function formatLessonDate(
  value: string | undefined
): string {
  if (!value) {
    return 'Дата не указана';
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  ).format(date);
}


function formatTime(
  value: string | undefined
): string {
  return value
    ? value.slice(0, 5)
    : '--:--';
}


function getLessonTitle(
  row: ParentAttendanceRow
): string {
  return (
    row.lesson?.topic?.trim() ||
    `Занятие №${row.attendance.lesson_id}`
  );
}


function getMonthKey(
  date: Date
): string {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, '0'),
  ].join('-');
}


function getRowMonthKey(
  row: ParentAttendanceRow
): string {
  return (
    row.lesson
      ?.lesson_date
      ?.slice(0, 7) ??
    ''
  );
}


function createMonthDate(
  value: string
): Date | null {
  const match =
    /^(\d{4})-(\d{2})-\d{2}$/.exec(
      value
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]) - 1;

  const date =
    new Date(
      year,
      month,
      1
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}


function getStatistics(
  rows: ParentAttendanceRow[]
): AttendanceStatistics {
  const present =
    rows.filter(
      ({ attendance }) =>
        attendance.status ===
        'present'
    ).length;

  const absent =
    rows.filter(
      ({ attendance }) =>
        attendance.status ===
        'absent'
    ).length;

  const late =
    rows.filter(
      ({ attendance }) =>
        attendance.status ===
        'late'
    ).length;

  const excused =
    rows.filter(
      ({ attendance }) =>
        attendance.status ===
        'excused'
    ).length;

  const countedLessons =
    present + absent + late;

  const attendedLessons =
    present + late;

  const percentage =
    countedLessons > 0
      ? Math.round(
          (
            attendedLessons /
            countedLessons
          ) * 100
        )
      : 0;

  const lateMinutes =
    rows.reduce(
      (
        total,
        { attendance }
      ) =>
        total +
        attendance.late_minutes,
      0
    );

  return {
    total: rows.length,
    present,
    absent,
    late,
    excused,
    percentage,
    lateMinutes,
  };
}


function getDominantStatus(
  rows: ParentAttendanceRow[]
): AttendanceStatus | null {
  if (
    rows.length === 0
  ) {
    return null;
  }

  return rows.reduce(
    (
      dominant,
      row
    ) =>
      STATUS_PRIORITY[
        row.attendance.status
      ] >
      STATUS_PRIORITY[dominant]
        ? row.attendance.status
        : dominant,
    rows[0].attendance.status
  );
}


function getInitials(
  name: string
): string {
  const parts =
    name
      .split(/\s+/)
      .filter(Boolean);

  return parts
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0)
    )
    .join('')
    .toUpperCase() || '?';
}


function ChildAvatar({
  child,
}: {
  child: ParentAttendanceChild;
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


function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  iconBackground,
}: {
  label: string;
  value: string | number;
  icon: typeof CalendarDays;
  iconClass: string;
  iconBackground: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBackground}`}
        >
          <Icon
            className={`h-5 w-5 ${iconClass}`}
          />
        </div>

        <div className="min-w-0">
          <p className="text-xl font-bold text-gray-900">
            {value}
          </p>

          <p className="truncate text-xs text-gray-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}


export default function ParentAttendance() {
  const {
    user,
  } = useAuth();

  const parentId =
    Number(user?.id ?? 0);

  const [
    children,
    setChildren,
  ] = useState<
    ParentAttendanceChild[]
  >([]);

  const [
    selectedChildId,
    setSelectedChildId,
  ] = useState<number | null>(
    null
  );

  const [
    data,
    setData,
  ] = useState<
    ParentAttendanceData
  >(EMPTY_DATA);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(
    null
  );

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
  );

  const [
    loadingChildren,
    setLoadingChildren,
  ] = useState(true);

  const [
    loadingAttendance,
    setLoadingAttendance,
  ] = useState(false);

  const [
    pageError,
    setPageError,
  ] = useState<string | null>(
    null
  );

  const [
    attendanceError,
    setAttendanceError,
  ] = useState<string | null>(
    null
  );


  const loadChildren =
    useCallback(async () => {
      setLoadingChildren(true);
      setPageError(null);

      try {
        const result =
          await loadParentAttendanceChildren(
            parentId
          );

        setChildren(result);

        setSelectedChildId(
          (current) =>
            current !== null &&
            result.some(
              (child) =>
                child.id ===
                current
            )
              ? current
              : (
                  result[0]?.id ??
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


  const loadAttendance =
    useCallback(async () => {
      if (
        selectedChildId === null
      ) {
        setData(EMPTY_DATA);
        return;
      }

      setLoadingAttendance(true);
      setAttendanceError(null);

      try {
        const result =
          await loadParentChildAttendance(
            selectedChildId
          );

        setData(result);

        setSelectedGroupId(
          (current) =>
            current !== null &&
            result.groups.some(
              (group) =>
                group.id ===
                current
            )
              ? current
              : null
        );

        const latestDatedRow =
          result.rows.find(
            (row) =>
              Boolean(
                row.lesson
                  ?.lesson_date
              )
          );

        if (
          latestDatedRow?.lesson
            ?.lesson_date
        ) {
          const latestMonth =
            createMonthDate(
              latestDatedRow.lesson
                .lesson_date
            );

          if (latestMonth) {
            setVisibleMonth(
              latestMonth
            );
          }
        }
      } catch (error) {
        setData(EMPTY_DATA);
        setAttendanceError(
          getErrorMessage(error)
        );
      } finally {
        setLoadingAttendance(false);
      }
    }, [selectedChildId]);


  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);


  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);


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


  const groupRows =
    useMemo(
      () =>
        data.rows.filter(
          (row) =>
            selectedGroupId ===
              null ||
            row.groupId ===
              selectedGroupId
        ),
      [
        data.rows,
        selectedGroupId,
      ]
    );


  const visibleMonthKey =
    getMonthKey(
      visibleMonth
    );


  const monthRows =
    useMemo(
      () =>
        groupRows.filter(
          (row) =>
            getRowMonthKey(
              row
            ) ===
            visibleMonthKey
        ),
      [
        groupRows,
        visibleMonthKey,
      ]
    );


  const statistics =
    useMemo(
      () =>
        getStatistics(
          monthRows
        ),
      [monthRows]
    );


  const rowsByDate =
    useMemo(() => {
      const map =
        new Map<
          string,
          ParentAttendanceRow[]
        >();

      monthRows.forEach(
        (row) => {
          const date =
            row.lesson
              ?.lesson_date;

          if (!date) {
            return;
          }

          const existing =
            map.get(date) ?? [];

          existing.push(row);
          map.set(
            date,
            existing
          );
        }
      );

      return map;
    }, [monthRows]);


  const calendarCells =
    useMemo(() => {
      const year =
        visibleMonth.getFullYear();

      const month =
        visibleMonth.getMonth();

      const firstDay =
        new Date(
          year,
          month,
          1
        );

      const leadingEmptyDays =
        (
          firstDay.getDay() +
          6
        ) % 7;

      const daysInMonth =
        new Date(
          year,
          month + 1,
          0
        ).getDate();

      return [
        ...Array.from(
          {
            length:
              leadingEmptyDays,
          },
          () => null
        ),
        ...Array.from(
          {
            length:
              daysInMonth,
          },
          (
            _,
            index
          ) => index + 1
        ),
      ];
    }, [visibleMonth]);


  const changeMonth = (
    offset: number
  ) => {
    setVisibleMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            offset,
          1
        )
    );
  };


  if (
    loadingChildren
  ) {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Посещаемость
          </h1>

          <p className="mt-1 text-gray-500">
            История посещений, пропусков и
            опозданий ребёнка
          </p>
        </div>
      </div>


      {pageError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-medium text-red-800">
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
              Администратор должен привязать к
              вашему аккаунту хотя бы одного
              студента.
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

              {children.length > 1 ? (
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
                htmlFor="parent-attendance-group"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Учебная группа
              </label>

              <select
                id="parent-attendance-group"
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


      {attendanceError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-medium text-red-800">
              Не удалось загрузить посещаемость
            </p>

            <p className="mt-1 text-sm text-red-700">
              {attendanceError}
            </p>
          </div>
        </div>
      )}


      {!attendanceError &&
        selectedChild &&
        !data.hasActiveGroup && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <p className="font-medium text-amber-900">
                Ребёнок пока не добавлен в
                активную учебную группу
              </p>

              <p className="mt-1 text-sm text-amber-700">
                История старых отметок будет
                показана, если она уже существует.
              </p>
            </div>
          </div>
        )}


      {data.warnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <p className="text-sm text-amber-800">
            {data.warnings.join(
              ' '
            )}
          </p>
        </div>
      )}


      {loadingAttendance ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />

            <p>
              Загружаем посещаемость ребёнка...
            </p>
          </div>
        </div>
      ) : selectedChild &&
        !attendanceError ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Всего отметок"
              value={
                statistics.total
              }
              icon={
                CalendarDays
              }
              iconClass="text-blue-600"
              iconBackground="bg-blue-50"
            />

            <StatCard
              label="Присутствовал"
              value={
                statistics.present
              }
              icon={
                CheckCircle2
              }
              iconClass="text-green-600"
              iconBackground="bg-green-50"
            />

            <StatCard
              label="Пропущено"
              value={
                statistics.absent
              }
              icon={
                XCircle
              }
              iconClass="text-red-600"
              iconBackground="bg-red-50"
            />

            <StatCard
              label="Опозданий"
              value={
                statistics.late
              }
              icon={
                Clock3
              }
              iconClass="text-amber-600"
              iconBackground="bg-amber-50"
            />

            <StatCard
              label="Уважительных"
              value={
                statistics.excused
              }
              icon={
                ShieldCheck
              }
              iconClass="text-violet-600"
              iconBackground="bg-violet-50"
            />

            <StatCard
              label="Посещаемость"
              value={`${statistics.percentage}%`}
              icon={
                GraduationCap
              }
              iconClass="text-red-600"
              iconBackground="bg-red-50"
            />
          </div>


          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.65fr)]">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">
                    Календарь посещаемости
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {
                      selectedChild.name
                    }
                    {selectedGroupId !==
                      null &&
                      ` · ${
                        data.groups.find(
                          (group) =>
                            group.id ===
                            selectedGroupId
                        )?.name ??
                        ''
                      }`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      changeMonth(-1)
                    }
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    aria-label="Предыдущий месяц"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <p className="min-w-[170px] text-center text-sm font-bold text-gray-900">
                    {formatMonth(
                      visibleMonth
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      changeMonth(1)
                    }
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    aria-label="Следующий месяц"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto p-4 sm:p-5">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-7 gap-2">
                    {WEEK_DAYS.map(
                      (day) => (
                        <div
                          key={day}
                          className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400"
                        >
                          {day}
                        </div>
                      )
                    )}

                    {calendarCells.map(
                      (
                        day,
                        index
                      ) => {
                        if (
                          day === null
                        ) {
                          return (
                            <div
                              key={`empty-${index}`}
                              className="min-h-24 rounded-xl bg-gray-50/50"
                            />
                          );
                        }

                        const dateKey = [
                          visibleMonth.getFullYear(),
                          String(
                            visibleMonth.getMonth() +
                              1
                          ).padStart(
                            2,
                            '0'
                          ),
                          String(
                            day
                          ).padStart(
                            2,
                            '0'
                          ),
                        ].join('-');

                        const dayRows =
                          rowsByDate.get(
                            dateKey
                          ) ?? [];

                        const dominantStatus =
                          getDominantStatus(
                            dayRows
                          );

                        return (
                          <div
                            key={
                              dateKey
                            }
                            className={`min-h-24 rounded-xl border p-2.5 ${
                              dominantStatus
                                ? CALENDAR_CLASSES[
                                    dominantStatus
                                  ]
                                : 'border-gray-100 bg-white text-gray-500'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-bold">
                                {day}
                              </span>

                              {dayRows.length >
                                0 && (
                                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold">
                                  {
                                    dayRows.length
                                  }
                                </span>
                              )}
                            </div>

                            {dominantStatus ? (
                              <div className="mt-4">
                                <p className="truncate text-xs font-semibold">
                                  {
                                    STATUS_SHORT_LABELS[
                                      dominantStatus
                                    ]
                                  }
                                </p>

                                <div className="mt-2 flex flex-wrap gap-1">
                                  {dayRows.map(
                                    (row) => (
                                      <span
                                        key={
                                          row
                                            .attendance
                                            .id
                                        }
                                        title={
                                          STATUS_LABELS[
                                            row
                                              .attendance
                                              .status
                                          ]
                                        }
                                        className={`h-2 w-2 rounded-full ${
                                          row
                                            .attendance
                                            .status ===
                                          'present'
                                            ? 'bg-green-500'
                                            : row
                                                  .attendance
                                                  .status ===
                                                'absent'
                                              ? 'bg-red-500'
                                              : row
                                                    .attendance
                                                    .status ===
                                                  'late'
                                                ? 'bg-amber-500'
                                                : 'bg-blue-500'
                                        }`}
                                      />
                                    )
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="mt-5 text-center text-[11px] text-gray-300">
                                Нет отметок
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  Присутствовал
                </span>

                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Отсутствовал
                </span>

                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Опоздал
                </span>

                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Уважительная причина
                </span>
              </div>
            </section>


            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-gray-900">
                Статистика месяца
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {formatMonth(
                  visibleMonth
                )}
              </p>

              <div className="mt-6 flex justify-center">
                <div
                  className="flex h-40 w-40 items-center justify-center rounded-full"
                  style={{
                    background:
                      `conic-gradient(#dc2626 ${statistics.percentage * 3.6}deg, #f3f4f6 0deg)`,
                  }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <p className="text-3xl font-bold text-gray-900">
                      {
                        statistics.percentage
                      }
                      %
                    </p>

                    <p className="text-xs text-gray-500">
                      Посещаемость
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {[
                  {
                    label:
                      'Присутствия',
                    value:
                      statistics.present,
                    total:
                      statistics.total,
                    bar:
                      'bg-green-500',
                  },
                  {
                    label:
                      'Опоздания',
                    value:
                      statistics.late,
                    total:
                      statistics.total,
                    bar:
                      'bg-amber-500',
                  },
                  {
                    label:
                      'Пропуски',
                    value:
                      statistics.absent,
                    total:
                      statistics.total,
                    bar:
                      'bg-red-500',
                  },
                  {
                    label:
                      'Уважительные',
                    value:
                      statistics.excused,
                    total:
                      statistics.total,
                    bar:
                      'bg-blue-500',
                  },
                ].map(
                  (item) => {
                    const width =
                      item.total > 0
                        ? Math.round(
                            (
                              item.value /
                              item.total
                            ) * 100
                          )
                        : 0;

                    return (
                      <div
                        key={
                          item.label
                        }
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {
                              item.label
                            }
                          </span>

                          <span className="font-bold text-gray-900">
                            {
                              item.value
                            }
                          </span>
                        </div>

                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${item.bar}`}
                            style={{
                              width:
                                `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {statistics.lateMinutes >
                0 && (
                <div className="mt-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  Общее время опозданий:
                  {' '}
                  <span className="font-bold">
                    {
                      statistics.lateMinutes
                    }
                    {' '}
                    мин.
                  </span>
                </div>
              )}
            </section>
          </div>


          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-gray-900">
                  История занятий
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Отметок за месяц:
                  {' '}
                  {
                    statistics.total
                  }
                </p>
              </div>

              <p className="text-sm font-medium text-gray-500">
                {formatMonth(
                  visibleMonth
                )}
              </p>
            </div>

            {monthRows.length ===
            0 ? (
              <div className="px-6 py-14 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />

                <h3 className="mt-4 font-semibold text-gray-900">
                  Отметок за этот месяц нет
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Переключите месяц или дождитесь,
                  когда преподаватель отметит
                  посещаемость.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {monthRows.map(
                  (row) => (
                    <div
                      key={
                        row.attendance
                          .id
                      }
                      className="p-5 transition hover:bg-gray-50/70"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {getLessonTitle(
                                row
                              )}
                            </h3>

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                STATUS_CLASSES[
                                  row
                                    .attendance
                                    .status
                                ]
                              }`}
                            >
                              {
                                STATUS_LABELS[
                                  row
                                    .attendance
                                    .status
                                ]
                              }
                            </span>

                            {data.groups.length >
                              1 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                <GraduationCap className="h-3.5 w-3.5" />
                                {
                                  row.groupName
                                }
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-4 w-4" />

                              {formatLessonDate(
                                row.lesson
                                  ?.lesson_date
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-4 w-4" />

                              {formatTime(
                                row.lesson
                                  ?.start_time
                              )}
                              {' – '}
                              {formatTime(
                                row.lesson
                                  ?.end_time
                              )}
                            </span>
                          </div>

                          {row.attendance
                            .status ===
                            'late' &&
                            row
                              .attendance
                              .late_minutes >
                              0 && (
                            <p className="mt-3 text-sm text-amber-700">
                              Опоздание:
                              {' '}
                              <span className="font-bold">
                                {
                                  row
                                    .attendance
                                    .late_minutes
                                }
                                {' '}
                                мин.
                              </span>
                            </p>
                          )}

                          {row.attendance
                            .comment && (
                            <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 p-3">
                              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                              <p className="text-sm text-gray-600">
                                {
                                  row
                                    .attendance
                                    .comment
                                }
                              </p>
                            </div>
                          )}
                        </div>

                        <p className="shrink-0 text-xs text-gray-400">
                          Занятие №
                          {
                            row
                              .attendance
                              .lesson_id
                          }
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
