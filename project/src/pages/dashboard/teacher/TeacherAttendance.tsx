import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  RotateCcw,
  Save,
  Users,
} from 'lucide-react';

import {
  useSearchParams,
} from 'react-router-dom';

import UserAvatar from '../../../components/common/UserAvatar';
import { useAuth } from '../../../context/AuthContext';

import {
  getActiveUserGroups,
  getGroup,
  getGroupStudents,
  type AcademicGroup,
  type GroupStudent,
} from '../../../api/academicApi';

import {
  getGroupLessons,
  type LessonSchedule,
} from '../../../api/scheduleApi';

import {
  createAttendance,
  getLessonAttendance,
  updateAttendance,
  type AttendanceRecord,
  type AttendanceStatus,
} from '../../../api/attendanceApi';

interface TeacherGroupOption {
  membershipId: number;
  group: AcademicGroup;
}

interface StudentAttendanceState {
  attendanceId: number | null;
  status: AttendanceStatus;
  lateMinutes: number;
  comment: string;
}

type AttendanceStateMap = Record<
  number,
  StudentAttendanceState
>;

const statusOptions: Array<{
  value: AttendanceStatus;
  label: string;
  shortLabel: string;
  activeClassName: string;
  dotClassName: string;
}> = [
  {
    value: 'present',
    label: 'Присутствовал',
    shortLabel: 'Присутствовал',
    activeClassName:
      'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500',
    dotClassName: 'bg-green-500',
  },
  {
    value: 'absent',
    label: 'Отсутствовал',
    shortLabel: 'Отсутствовал',
    activeClassName:
      'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500',
    dotClassName: 'bg-red-500',
  },
  {
    value: 'late',
    label: 'Опоздал',
    shortLabel: 'Опоздал',
    activeClassName:
      'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500',
    dotClassName: 'bg-amber-500',
  },
  {
    value: 'excused',
    label: 'Уважительная причина',
    shortLabel: 'Уважительная',
    activeClassName:
      'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500',
    dotClassName: 'bg-blue-500',
  },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}

function formatLessonDate(
  dateValue: string
): string {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(
  timeValue: string
): string {
  return timeValue.slice(0, 5);
}

function getStudentName(
  student: GroupStudent
): string {
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

function createEmptyAttendanceState():
StudentAttendanceState {
  return {
    attendanceId: null,
    status: 'present',
    lateMinutes: 0,
    comment: '',
  };
}

export default function TeacherAttendance() {
  const { user } = useAuth();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const teacherId = Number(user?.id);

  const groupIdFromUrl = useMemo(() => {
    const value = Number(
      searchParams.get('groupId')
    );

    return Number.isInteger(value) && value > 0
      ? value
      : null;
  }, [searchParams]);

  const [
    groups,
    setGroups,
  ] = useState<TeacherGroupOption[]>([]);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(null);

  const [
    lessons,
    setLessons,
  ] = useState<LessonSchedule[]>([]);

  const [
    selectedLessonId,
    setSelectedLessonId,
  ] = useState<number | null>(null);

  const [
    students,
    setStudents,
  ] = useState<GroupStudent[]>([]);

  const [
    attendanceState,
    setAttendanceState,
  ] = useState<AttendanceStateMap>({});

  const [
    loadingGroups,
    setLoadingGroups,
  ] = useState(true);

  const [
    loadingJournal,
    setLoadingJournal,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null);

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (item) =>
          item.group.id === selectedGroupId
      ) ?? null,
    [
      groups,
      selectedGroupId,
    ]
  );

  const selectedLesson = useMemo(
    () =>
      lessons.find(
        (lesson) =>
          lesson.id === selectedLessonId
      ) ?? null,
    [
      lessons,
      selectedLessonId,
    ]
  );

  const attendanceSummary = useMemo(() => {
    const summary: Record<
      AttendanceStatus,
      number
    > = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    students.forEach((student) => {
      const status =
        attendanceState[student.user_id]?.status;

      if (status) {
        summary[status] += 1;
      }
    });

    return summary;
  }, [
    students,
    attendanceState,
  ]);

  const loadTeacherGroups =
    useCallback(async () => {
      if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
      ) {
        setLoadingGroups(false);
        setError(
          'Не удалось определить ID преподавателя'
        );
        return;
      }

      try {
        setLoadingGroups(true);
        setError(null);

        const memberships =
          await getActiveUserGroups(teacherId);

        const teacherMemberships =
          memberships.filter(
            (membership) =>
              membership.role === 'teacher' ||
              membership.role === 'assistant'
          );

        const uniqueMemberships =
          Array.from(
            new Map(
              teacherMemberships.map(
                (membership) => [
                  membership.group_id,
                  membership,
                ]
              )
            ).values()
          );

        const groupResults =
          await Promise.all(
            uniqueMemberships.map(
              async (membership) => ({
                membershipId: membership.id,
                group: await getGroup(
                  membership.group_id
                ),
              })
            )
          );

        groupResults.sort(
          (first, second) =>
            first.group.name.localeCompare(
              second.group.name,
              'ru'
            )
        );

        setGroups(groupResults);

        if (groupResults.length > 0) {
          const requestedGroup =
            groupIdFromUrl
              ? groupResults.find(
                  (item) =>
                    item.group.id ===
                    groupIdFromUrl
                )
              : null;

          const nextGroupId =
            requestedGroup?.group.id ??
            groupResults[0].group.id;

          setSelectedGroupId(nextGroupId);

          if (groupIdFromUrl !== nextGroupId) {
            setSearchParams(
              {
                groupId: String(nextGroupId),
              },
              {
                replace: true,
              }
            );
          }
        } else {
          setSelectedGroupId(null);

          if (searchParams.has('groupId')) {
            setSearchParams(
              {},
              {
                replace: true,
              }
            );
          }
        }
      } catch (loadError) {
        setError(
          `Не удалось загрузить группы: ${getErrorMessage(
            loadError
          )}`
        );
      } finally {
        setLoadingGroups(false);
      }
    }, [
      teacherId,
      groupIdFromUrl,
      searchParams,
      setSearchParams,
    ]);

  useEffect(() => {
    void loadTeacherGroups();
  }, [loadTeacherGroups]);

  useEffect(() => {
    if (!selectedGroupId) {
      setLessons([]);
      setStudents([]);
      setSelectedLessonId(null);
      setAttendanceState({});
      return;
    }

    const groupId = selectedGroupId;

    let cancelled = false;

    async function loadGroupData() {
      try {
        setLoadingJournal(true);
        setError(null);
        setSuccessMessage(null);

        const [
          lessonsResponse,
          studentsResponse,
        ] = await Promise.all([
          getGroupLessons(groupId),
          getGroupStudents(groupId),
        ]);

        if (cancelled) {
          return;
        }

        const activeLessons =
          lessonsResponse
            .filter(
              (lesson) =>
                lesson.status !== 'cancelled'
            )
            .sort((first, second) => {
              const firstDateTime =
                `${first.lesson_date} ${first.start_time}`;

              const secondDateTime =
                `${second.lesson_date} ${second.start_time}`;

              return secondDateTime.localeCompare(
                firstDateTime
              );
            });

        setLessons(activeLessons);
        setStudents(
          studentsResponse.items
        );

        if (activeLessons.length > 0) {
          setSelectedLessonId(
            activeLessons[0].id
          );
        } else {
          setSelectedLessonId(null);
          setAttendanceState({});
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            `Не удалось загрузить данные группы: ${getErrorMessage(
              loadError
            )}`
          );

          setLessons([]);
          setStudents([]);
          setSelectedLessonId(null);
          setAttendanceState({});
        }
      } finally {
        if (!cancelled) {
          setLoadingJournal(false);
        }
      }
    }

    void loadGroupData();

    return () => {
      cancelled = true;
    };
  }, [selectedGroupId]);

  useEffect(() => {
    if (
      !selectedLessonId ||
      students.length === 0
    ) {
      setAttendanceState({});
      return;
    }

    const lessonId = selectedLessonId;

    let cancelled = false;

    async function loadAttendance() {
      try {
        setLoadingJournal(true);
        setError(null);
        setSuccessMessage(null);

        const response =
          await getLessonAttendance(
            lessonId
          );

        if (cancelled) {
          return;
        }

        const existingAttendance =
          new Map<number, AttendanceRecord>(
            response.items.map(
              (record) => [
                record.student_id,
                record,
              ]
            )
          );

        const nextState: AttendanceStateMap =
          {};

        students.forEach((student) => {
          const record =
            existingAttendance.get(
              student.user_id
            );

          nextState[student.user_id] =
            record
              ? {
                  attendanceId: record.id,
                  status: record.status,
                  lateMinutes:
                    record.late_minutes ?? 0,
                  comment:
                    record.comment ?? '',
                }
              : createEmptyAttendanceState();
        });

        setAttendanceState(nextState);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            `Не удалось загрузить посещаемость: ${getErrorMessage(
              loadError
            )}`
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingJournal(false);
        }
      }
    }

    void loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [
    selectedLessonId,
    students,
  ]);

  function updateStudentAttendance(
    studentId: number,
    changes: Partial<StudentAttendanceState>
  ) {
    setSuccessMessage(null);

    setAttendanceState(
      (currentState) => {
        const currentStudentState =
          currentState[studentId] ??
          createEmptyAttendanceState();

        const nextStudentState = {
          ...currentStudentState,
          ...changes,
        };

        if (
          changes.status &&
          changes.status !== 'late'
        ) {
          nextStudentState.lateMinutes = 0;
        }

        return {
          ...currentState,
          [studentId]: nextStudentState,
        };
      }
    );
  }

  function markEveryonePresent() {
    setSuccessMessage(null);

    setAttendanceState(
      (currentState) => {
        const nextState = {
          ...currentState,
        };

        students.forEach((student) => {
          const currentStudentState =
            nextState[student.user_id] ??
            createEmptyAttendanceState();

          nextState[student.user_id] = {
            ...currentStudentState,
            status: 'present',
            lateMinutes: 0,
          };
        });

        return nextState;
      }
    );
  }

  function resetJournal() {
    setSuccessMessage(null);

    setAttendanceState(
      (currentState) => {
        const nextState = {
          ...currentState,
        };

        students.forEach((student) => {
          const currentStudentState =
            nextState[student.user_id] ??
            createEmptyAttendanceState();

          nextState[student.user_id] = {
            ...currentStudentState,
            status: 'present',
            lateMinutes: 0,
            comment: '',
          };
        });

        return nextState;
      }
    );
  }

  async function handleSave() {
    if (!selectedLessonId) {
      setError('Сначала выберите занятие');
      return;
    }

    if (
      !Number.isInteger(teacherId) ||
      teacherId <= 0
    ) {
      setError(
        'Не удалось определить ID преподавателя'
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const savedRecords =
        await Promise.all(
          students.map(async (student) => {
            const studentState =
              attendanceState[
                student.user_id
              ] ??
              createEmptyAttendanceState();

            const lateMinutes =
              studentState.status === 'late'
                ? Math.max(
                    0,
                    studentState.lateMinutes
                  )
                : 0;

            const comment =
              studentState.comment.trim() ||
              null;

            if (studentState.attendanceId) {
              return updateAttendance(
                studentState.attendanceId,
                {
                  status:
                    studentState.status,
                  late_minutes: lateMinutes,
                  comment,
                  marked_by: teacherId,
                }
              );
            }

            return createAttendance({
              lesson_id: selectedLessonId,
              student_id: student.user_id,
              status: studentState.status,
              late_minutes: lateMinutes,
              comment,
              marked_by: teacherId,
            });
          })
        );

      const nextState: AttendanceStateMap =
        {};

      savedRecords.forEach((record) => {
        nextState[record.student_id] = {
          attendanceId: record.id,
          status: record.status,
          lateMinutes:
            record.late_minutes ?? 0,
          comment: record.comment ?? '',
        };
      });

      setAttendanceState(nextState);

      setSuccessMessage(
        'Посещаемость успешно сохранена'
      );
    } catch (saveError) {
      setError(
        `Не удалось сохранить посещаемость: ${getErrorMessage(
          saveError
        )}`
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingGroups) {
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Журнал посещаемости
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Выберите группу и занятие,
            затем отметьте присутствие студентов.
          </p>
        </div>

        {students.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={markEveryonePresent}
              disabled={
                loadingJournal || saving
              }
              className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Все присутствуют
            </button>

            <button
              type="button"
              onClick={resetJournal}
              disabled={
                loadingJournal || saving
              }
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Сбросить
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Check className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-2">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="h-4 w-4 text-gray-400" />
            Группа
          </span>

          <div className="relative">
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
                setSelectedLessonId(null);
                setLessons([]);
                setStudents([]);
                setAttendanceState({});
                setSuccessMessage(null);

                if (nextGroupId) {
                  setSearchParams(
                    {
                      groupId:
                        String(nextGroupId),
                    },
                    {
                      replace: true,
                    }
                  );
                } else {
                  setSearchParams(
                    {},
                    {
                      replace: true,
                    }
                  );
                }
              }}
              disabled={
                groups.length === 0 ||
                loadingJournal ||
                saving
              }
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {groups.length === 0 ? (
                <option value="">
                  Группы не найдены
                </option>
              ) : (
                groups.map((item) => (
                  <option
                    key={item.group.id}
                    value={item.group.id}
                  >
                    {item.group.name}
                  </option>
                ))
              )}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            Занятие
          </span>

          <div className="relative">
            <select
              value={selectedLessonId ?? ''}
              onChange={(event) => {
                const value = Number(
                  event.target.value
                );

                setSelectedLessonId(
                  Number.isInteger(value) &&
                    value > 0
                    ? value
                    : null
                );
              }}
              disabled={
                lessons.length === 0 ||
                loadingJournal ||
                saving
              }
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {lessons.length === 0 ? (
                <option value="">
                  Занятия не найдены
                </option>
              ) : (
                lessons.map((lesson) => (
                  <option
                    key={lesson.id}
                    value={lesson.id}
                  >
                    {formatLessonDate(
                      lesson.lesson_date
                    )}
                    {' · '}
                    {formatTime(
                      lesson.start_time
                    )}
                    {'–'}
                    {formatTime(
                      lesson.end_time
                    )}
                    {lesson.topic
                      ? ` · ${lesson.topic}`
                      : ''}
                  </option>
                ))
              )}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </label>
      </div>

      {selectedLesson && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statusOptions.map((option) => (
            <div
              key={option.value}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${option.dotClassName}`}
                />
                {option.shortLabel}
              </div>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {
                  attendanceSummary[
                    option.value
                  ]
                }
              </p>
            </div>
          ))}
        </div>
      )}

      {loadingJournal ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />

            <p className="text-sm text-gray-500">
              Загружаем журнал...
            </p>
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300" />

          <h2 className="mt-4 font-semibold text-gray-900">
            У преподавателя нет активных групп
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Назначьте преподавателя участником группы
            в Academic Service.
          </p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />

          <h2 className="mt-4 font-semibold text-gray-900">
            В группе нет занятий
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Сначала создайте занятие
            в Schedule Service.
          </p>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300" />

          <h2 className="mt-4 font-semibold text-gray-900">
            В группе нет активных студентов
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Добавьте студентов в выбранную группу.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {selectedGroup?.group.name ??
                  'Выбранная группа'}
              </h2>

              {selectedLesson && (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="h-4 w-4" />

                  {formatLessonDate(
                    selectedLesson.lesson_date
                  )}

                  <span>·</span>

                  <Clock3 className="h-4 w-4" />

                  {formatTime(
                    selectedLesson.start_time
                  )}
                  {'–'}
                  {formatTime(
                    selectedLesson.end_time
                  )}

                  {selectedLesson.topic && (
                    <>
                      <span>·</span>
                      <span>
                        {selectedLesson.topic}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="text-sm text-gray-500">
              Студентов:{' '}
              <span className="font-semibold text-gray-900">
                {students.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {students.map(
              (student, index) => {
                const studentState =
                  attendanceState[
                    student.user_id
                  ] ??
                  createEmptyAttendanceState();

                return (
                  <div
                    key={student.user_id}
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                      <div className="flex min-w-0 items-center gap-3 xl:w-64">
                        <UserAvatar
                          avatarUrl={
                            student.avatar_url
                          }
                          alt={getStudentName(student)}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />

                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {index + 1}.{' '}
                            {getStudentName(
                              student
                            )}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            ID пользователя:{' '}
                            {student.user_id}
                          </p>
                        </div>
                      </div>

                      <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {statusOptions.map(
                          (option) => {
                            const active =
                              studentState.status ===
                              option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  updateStudentAttendance(
                                    student.user_id,
                                    {
                                      status:
                                        option.value,
                                    }
                                  )
                                }
                                disabled={saving}
                                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  active
                                    ? option.activeClassName
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${option.dotClassName}`}
                                />

                                {option.shortLabel}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 xl:ml-[268px] xl:grid-cols-[180px_1fr]">
                      {studentState.status ===
                        'late' && (
                        <label className="space-y-1.5">
                          <span className="text-xs font-medium text-gray-500">
                            Опоздание, минут
                          </span>

                          <input
                            type="number"
                            min={0}
                            max={300}
                            value={
                              studentState.lateMinutes
                            }
                            onChange={(event) =>
                              updateStudentAttendance(
                                student.user_id,
                                {
                                  lateMinutes:
                                    Math.max(
                                      0,
                                      Number(
                                        event
                                          .target
                                          .value
                                      ) || 0
                                    ),
                                }
                              )
                            }
                            disabled={saving}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50"
                          />
                        </label>
                      )}

                      <label
                        className={`space-y-1.5 ${
                          studentState.status !==
                          'late'
                            ? 'xl:col-span-2'
                            : ''
                        }`}
                      >
                        <span className="text-xs font-medium text-gray-500">
                          Комментарий
                        </span>

                        <input
                          type="text"
                          value={
                            studentState.comment
                          }
                          onChange={(event) =>
                            updateStudentAttendance(
                              student.user_id,
                              {
                                comment:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Необязательно"
                          disabled={saving}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50"
                        />
                      </label>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              При повторном сохранении существующие
              отметки будут обновлены.
            </p>

            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={
                saving ||
                !selectedLessonId ||
                students.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Сохраняем...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Сохранить посещаемость
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
