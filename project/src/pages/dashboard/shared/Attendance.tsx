import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';

import {
  getStudentAttendance,
  type AttendanceRecord,
  type AttendanceStatus,
} from '../../../api/attendanceApi';

import {
  getGroup,
  getStudentGroupMemberships,
} from '../../../api/academicApi';

import {
  getLesson,
  type LessonSchedule,
} from '../../../api/scheduleApi';

interface AttendanceRow {
  attendance: AttendanceRecord;
  lesson: LessonSchedule | null;
  groupId: number | null;
  groupName: string | null;
}

interface StudentAttendanceGroup {
  id: number;
  name: string;
}

const statusLabels: Record<
  AttendanceStatus,
  string
> = {
  present: 'Присутствовал',
  absent: 'Отсутствовал',
  late: 'Опоздал',
  excused: 'Уважительная причина',
};

const statusClasses: Record<
  AttendanceStatus,
  string
> = {
  present:
    'bg-green-50 text-green-700 border-green-200',

  absent:
    'bg-red-50 text-red-700 border-red-200',

  late:
    'bg-amber-50 text-amber-700 border-amber-200',

  excused:
    'bg-blue-50 text-blue-700 border-blue-200',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Не удалось загрузить посещаемость';
}

function formatLessonDate(
  value: string | undefined
): string {
  if (!value) {
    return 'Дата не указана';
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(value: string | undefined): string {
  if (!value) {
    return '--:--';
  }

  return value.slice(0, 5);
}

function getLessonTitle(
  lesson: LessonSchedule | null,
  lessonId: number
): string {
  if (lesson?.topic?.trim()) {
    return lesson.topic.trim();
  }

  return `Занятие №${lessonId}`;
}

export default function Attendance() {
  const { user } = useAuth();

  const [rows, setRows] =
    useState<AttendanceRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [groups, setGroups] = useState<
    StudentAttendanceGroup[]
  >([]);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(null);

  const studentId = Number(user?.id ?? 0);

  const loadAttendance = useCallback(
    async () => {
      if (
        !Number.isInteger(studentId) ||
        studentId <= 0
      ) {
        setError(
          'Не удалось определить ID студента'
        );

        setRows([]);
        setGroups([]);
        setLoading(false);

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [memberships, response] =
          await Promise.all([
            getStudentGroupMemberships(
              studentId
            ),
            getStudentAttendance(studentId),
          ]);

        const groupIds = [
          ...new Set(
            memberships.map(
              (membership) =>
                membership.group_id
            )
          ),
        ];

        if (groupIds.length === 0) {
          setRows([]);
          setGroups([]);
          setError(
            'Пользователь пока не добавлен в учебную группу'
          );

          return;
        }

        const studentGroups = (
          await Promise.all(
            groupIds.map(async (groupId) => {
              const group =
                await getGroup(groupId);

              return {
                id: group.id,
                name:
                  group.name ||
                  `Группа №${group.id}`,
              };
            })
          )
        ).sort((first, second) =>
          first.name.localeCompare(
            second.name,
            'ru'
          )
        );

        setGroups(studentGroups);

        const selectedGroupExists =
          selectedGroupId === null ||
          studentGroups.some(
            (group) =>
              group.id === selectedGroupId
          );

        const normalizedGroupId =
          selectedGroupExists
            ? selectedGroupId
            : null;

        if (!selectedGroupExists) {
          setSelectedGroupId(null);
        }

        const groupNamesById = new Map(
          studentGroups.map((group) => [
            group.id,
            group.name,
          ])
        );

        const activeGroupIds = new Set(
          studentGroups.map(
            (group) => group.id
          )
        );

        const lessonIds = Array.from(
          new Set(
            response.items.map(
              (item) => item.lesson_id
            )
          )
        );

        const lessonResults =
          await Promise.all(
            lessonIds.map(async (lessonId) => {
              try {
                const lesson =
                  await getLesson(lessonId);

                return [
                  lessonId,
                  lesson,
                ] as const;
              } catch (lessonError) {
                console.error(
                  `Не удалось загрузить занятие ${lessonId}:`,
                  lessonError
                );

                return [
                  lessonId,
                  null,
                ] as const;
              }
            })
          );

        const lessonMap = new Map<
          number,
          LessonSchedule | null
        >(lessonResults);

        const nextRows = response.items
          .map((attendance): AttendanceRow => {
            const lesson =
              lessonMap.get(
                attendance.lesson_id
              ) ?? null;

            const groupId =
              lesson?.group_id ?? null;

            return {
              attendance,
              lesson,
              groupId,
              groupName:
                groupId === null
                  ? null
                  : (groupNamesById.get(
                      groupId
                    ) ??
                    `Группа №${groupId}`),
            };
          })
          .filter((row) => {
            if (row.groupId === null) {
              return (
                normalizedGroupId === null
              );
            }

            if (
              !activeGroupIds.has(row.groupId)
            ) {
              return false;
            }

            return (
              normalizedGroupId === null ||
              row.groupId ===
                normalizedGroupId
            );
          })
          .sort((first, second) => {
            const firstDate =
              first.lesson?.lesson_date ?? '';

            const secondDate =
              second.lesson?.lesson_date ?? '';

            const dateComparison =
              secondDate.localeCompare(
                firstDate
              );

            if (dateComparison !== 0) {
              return dateComparison;
            }

            const firstTime =
              first.lesson?.start_time ?? '';

            const secondTime =
              second.lesson?.start_time ?? '';

            return secondTime.localeCompare(
              firstTime
            );
          });

        setRows(nextRows);
      } catch (loadError) {
        console.error(
          'Ошибка загрузки посещаемости:',
          loadError
        );

        setError(getErrorMessage(loadError));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedGroupId, studentId]
  );

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const statistics = useMemo(() => {
    const present = rows.filter(
      ({ attendance }) =>
        attendance.status === 'present'
    ).length;

    const absent = rows.filter(
      ({ attendance }) =>
        attendance.status === 'absent'
    ).length;

    const late = rows.filter(
      ({ attendance }) =>
        attendance.status === 'late'
    ).length;

    const excused = rows.filter(
      ({ attendance }) =>
        attendance.status === 'excused'
    ).length;

    /*
     * Уважительные пропуски не уменьшают процент
     * посещаемости и не входят в расчёт.
     */
    const countedLessons =
      present + absent + late;

    const attendedLessons =
      present + late;

    const percentage =
      countedLessons > 0
        ? Math.round(
            (attendedLessons /
              countedLessons) *
              100
          )
        : 0;

    const lateMinutes = rows.reduce(
      (total, { attendance }) =>
        total + attendance.late_minutes,
      0
    );

    return {
      present,
      absent,
      late,
      excused,
      percentage,
      lateMinutes,
      total: rows.length,
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />

          <p className="text-sm text-gray-500">
            Загружаем посещаемость...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Посещаемость
          </h1>

          <p className="text-gray-500 mt-1">
            История посещений, пропусков и
            опозданий
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />

          <div>
            <p className="font-medium text-red-800">
              Не удалось загрузить данные
            </p>

            <p className="text-sm text-red-700 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {!error && groups.length > 1 && (
        <div className="card p-4 sm:p-5">
          <label
            htmlFor="attendance-group"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Группа
          </label>

          <select
            id="attendance-group"
            value={selectedGroupId ?? ''}
            onChange={(event) => {
              const value =
                event.target.value;

              setSelectedGroupId(
                value ? Number(value) : null
              );
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 sm:max-w-md"
          >
            <option value="">
              Все группы
            </option>

            {groups.map((group) => (
              <option
                key={group.id}
                value={group.id}
              >
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>

            <div>
              <p className="text-xl font-bold text-gray-900">
                {statistics.present}
              </p>

              <p className="text-xs text-gray-500">
                Присутствовал
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>

            <div>
              <p className="text-xl font-bold text-gray-900">
                {statistics.absent}
              </p>

              <p className="text-xs text-gray-500">
                Пропущено
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-amber-600" />
            </div>

            <div>
              <p className="text-xl font-bold text-gray-900">
                {statistics.late}
              </p>

              <p className="text-xs text-gray-500">
                Опозданий
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>

            <div>
              <p className="text-xl font-bold text-gray-900">
                {statistics.excused}
              </p>

              <p className="text-xs text-gray-500">
                Уважительных
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-purple-600" />
            </div>

            <div>
              <p className="text-xl font-bold text-gray-900">
                {statistics.percentage}%
              </p>

              <p className="text-xs text-gray-500">
                Посещаемость
              </p>
            </div>
          </div>
        </div>
      </div>

      {statistics.lateMinutes > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Clock3 className="w-5 h-5 text-amber-600" />

            <p className="text-sm text-gray-700">
              Общее время опозданий:{' '}
              <span className="font-semibold">
                {statistics.lateMinutes} мин.
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-lg text-gray-900">
                История занятий
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Всего отметок: {statistics.total}
              </p>
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto" />

            <h3 className="font-semibold text-gray-900 mt-4">
              Отметок пока нет
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              После проверки преподавателем здесь
              появится история посещаемости.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map(
              ({
                attendance,
                lesson,
                groupName,
              }) => (
                <div
                  key={attendance.id}
                  className="p-5 sm:p-6 hover:bg-gray-50/70 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {getLessonTitle(
                            lesson,
                            attendance.lesson_id
                          )}
                        </h3>

                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${
                            statusClasses[
                              attendance.status
                            ]
                          }`}
                        >
                          {
                            statusLabels[
                              attendance.status
                            ]
                          }
                        </span>

                        {groups.length > 1 &&
                          selectedGroupId ===
                            null &&
                          groupName && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              <Users className="h-3.5 w-3.5" />
                              {groupName}
                            </span>
                          )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4" />

                          {formatLessonDate(
                            lesson?.lesson_date
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="w-4 h-4" />

                          {formatTime(
                            lesson?.start_time
                          )}
                          {' – '}
                          {formatTime(
                            lesson?.end_time
                          )}
                        </span>
                      </div>

                      {attendance.status ===
                        'late' &&
                        attendance.late_minutes >
                          0 && (
                          <p className="text-sm text-amber-700 mt-3">
                            Опоздание:{' '}
                            <span className="font-medium">
                              {
                                attendance.late_minutes
                              }{' '}
                              мин.
                            </span>
                          </p>
                        )}

                      {attendance.comment && (
                        <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-xl">
                          <MessageSquareText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />

                          <p className="text-sm text-gray-600">
                            {attendance.comment}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 shrink-0">
                      Занятие #{attendance.lesson_id}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}