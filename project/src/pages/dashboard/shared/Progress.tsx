import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  AlertTriangle,
  Award,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';

import {
  getGroup,
  getStudentGroupMemberships,
} from '../../../api/academicApi';

import {
  getStudentAttendance,
  type AttendanceRecord,
} from '../../../api/attendanceApi';

import {
  getPublishedHomeworks,
  getStudentSubmissions,
  type Homework,
  type HomeworkSubmission,
} from '../../../api/homeworkApi';

import {
  getGroupLessons,
  type LessonSchedule,
} from '../../../api/scheduleApi';

import ProgressBar from '../../../components/dashboard/ProgressBar';
import { useAuth } from '../../../context/AuthContext';

interface StudentProgressGroup {
  id: number;
  name: string;
}

interface ProgressHomeworkItem {
  homework: Homework;
  submission: HomeworkSubmission | null;
  groupId: number;
  groupName: string;
}

interface ProgressAttendanceItem {
  attendance: AttendanceRecord;
  groupId: number;
}

interface ProgressData {
  homeworkItems: ProgressHomeworkItem[];
  attendanceItems: ProgressAttendanceItem[];
}

const EMPTY_DATA: ProgressData = {
  homeworkItems: [],
  attendanceItems: [],
};

const COMPLETED_STATUSES = new Set([
  'submitted',
  'in_review',
  'accepted',
  'rejected',
]);

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить данные об успеваемости';
}

function isCompleted(
  submission: HomeworkSubmission | null
): boolean {
  return Boolean(
    submission &&
      COMPLETED_STATUSES.has(submission.status)
  );
}

function isOverdue(
  homework: Homework,
  submission: HomeworkSubmission | null
): boolean {
  if (!homework.due_at || isCompleted(submission)) {
    return false;
  }

  return (
    new Date(homework.due_at).getTime() <
    Date.now()
  );
}

function getGradedItems(
  items: ProgressHomeworkItem[]
): ProgressHomeworkItem[] {
  return items.filter(
    (item) =>
      item.submission?.score !== null &&
      item.submission?.score !== undefined &&
      item.homework.max_score > 0
  );
}

function calculateAverageScore(
  items: ProgressHomeworkItem[]
): number | null {
  const gradedItems = getGradedItems(items);

  if (gradedItems.length === 0) {
    return null;
  }

  const earnedScore = gradedItems.reduce(
    (total, item) =>
      total + (item.submission?.score ?? 0),
    0
  );

  const maximumScore = gradedItems.reduce(
    (total, item) =>
      total + item.homework.max_score,
    0
  );

  if (maximumScore <= 0) {
    return null;
  }

  return Math.round(
    (earnedScore / maximumScore) * 100
  );
}

function calculateAttendancePercentage(
  items: ProgressAttendanceItem[]
): number | null {
  const present = items.filter(
    (item) =>
      item.attendance.status === 'present'
  ).length;

  const absent = items.filter(
    (item) =>
      item.attendance.status === 'absent'
  ).length;

  const late = items.filter(
    (item) => item.attendance.status === 'late'
  ).length;

  const countedLessons = present + absent + late;

  if (countedLessons === 0) {
    return null;
  }

  return Math.round(
    ((present + late) / countedLessons) * 100
  );
}

function calculateMonthlyTrend(
  items: ProgressHomeworkItem[]
): number | null {
  const now = Date.now();
  const currentPeriodStart = now - 30 * DAY_IN_MS;
  const previousPeriodStart = now - 60 * DAY_IN_MS;

  const currentItems = items.filter((item) => {
    const checkedAt =
      item.submission?.checked_at;

    if (!checkedAt) {
      return false;
    }

    const checkedTime =
      new Date(checkedAt).getTime();

    return (
      checkedTime >= currentPeriodStart &&
      checkedTime <= now
    );
  });

  const previousItems = items.filter((item) => {
    const checkedAt =
      item.submission?.checked_at;

    if (!checkedAt) {
      return false;
    }

    const checkedTime =
      new Date(checkedAt).getTime();

    return (
      checkedTime >= previousPeriodStart &&
      checkedTime < currentPeriodStart
    );
  });

  const currentAverage =
    calculateAverageScore(currentItems);

  const previousAverage =
    calculateAverageScore(previousItems);

  if (
    currentAverage === null ||
    previousAverage === null
  ) {
    return null;
  }

  return currentAverage - previousAverage;
}

function formatCheckedDate(
  value: string | null
): string {
  if (!value) {
    return 'Дата проверки не указана';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Дата проверки не указана';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getProgressColor(
  value: number
): string {
  if (value >= 80) {
    return 'bg-green-500';
  }

  if (value >= 60) {
    return 'bg-amber-500';
  }

  return 'bg-red-500';
}

export default function Progress() {
  const { user } = useAuth();

  const [groups, setGroups] = useState<
    StudentProgressGroup[]
  >([]);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(null);

  const [data, setData] =
    useState<ProgressData>(EMPTY_DATA);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadProgress = useCallback(
    async () => {
      if (!user?.id) {
        setGroups([]);
        setData(EMPTY_DATA);
        setError(
          'Не удалось определить текущего пользователя'
        );
        setIsLoading(false);

        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const memberships =
          await getStudentGroupMemberships(
            user.id
          );

        const groupIds = [
          ...new Set(
            memberships.map(
              (membership) =>
                membership.group_id
            )
          ),
        ];

        if (groupIds.length === 0) {
          setGroups([]);
          setData(EMPTY_DATA);
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

        const groupsToLoad =
          normalizedGroupId === null
            ? studentGroups
            : studentGroups.filter(
                (group) =>
                  group.id ===
                  normalizedGroupId
              );

        const [
          lessonLists,
          homeworks,
          submissions,
          attendanceResponse,
        ] = await Promise.all([
          Promise.all(
            groupsToLoad.map((group) =>
              getGroupLessons(group.id)
            )
          ),
          getPublishedHomeworks(),
          getStudentSubmissions(user.id),
          getStudentAttendance(user.id),
        ]);

        const lessons = lessonLists.flat();

        const lessonsById = new Map<
          number,
          LessonSchedule
        >(
          lessons.map((lesson) => [
            lesson.id,
            lesson,
          ])
        );

        const groupNamesById = new Map(
          studentGroups.map((group) => [
            group.id,
            group.name,
          ])
        );

        const submissionsByHomeworkId =
          new Map(
            submissions.map((submission) => [
              submission.homework_id,
              submission,
            ])
          );

        const homeworkItems = homeworks
          .filter((homework) =>
            lessonsById.has(
              homework.lesson_id
            )
          )
          .map(
            (
              homework
            ): ProgressHomeworkItem => {
              const lesson = lessonsById.get(
                homework.lesson_id
              );

              if (!lesson) {
                throw new Error(
                  `Занятие №${homework.lesson_id} не найдено`
                );
              }

              return {
                homework,
                submission:
                  submissionsByHomeworkId.get(
                    homework.id
                  ) ?? null,
                groupId: lesson.group_id,
                groupName:
                  groupNamesById.get(
                    lesson.group_id
                  ) ??
                  `Группа №${lesson.group_id}`,
              };
            }
          );

        const attendanceItems =
          attendanceResponse.items
            .map(
              (
                attendance
              ): ProgressAttendanceItem | null => {
                const lesson =
                  lessonsById.get(
                    attendance.lesson_id
                  );

                if (!lesson) {
                  return null;
                }

                return {
                  attendance,
                  groupId: lesson.group_id,
                };
              }
            )
            .filter(
              (
                item
              ): item is ProgressAttendanceItem =>
                item !== null
            );

        setData({
          homeworkItems,
          attendanceItems,
        });
      } catch (loadError) {
        setData(EMPTY_DATA);
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [selectedGroupId, user?.id]
  );

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const statistics = useMemo(() => {
    const averageScore =
      calculateAverageScore(
        data.homeworkItems
      );

    const completedCount =
      data.homeworkItems.filter((item) =>
        isCompleted(item.submission)
      ).length;

    const overdueCount =
      data.homeworkItems.filter((item) =>
        isOverdue(
          item.homework,
          item.submission
        )
      ).length;

    return {
      averageScore,
      completedCount,
      totalHomework:
        data.homeworkItems.length,
      overdueCount,
      attendancePercentage:
        calculateAttendancePercentage(
          data.attendanceItems
        ),
      monthlyTrend:
        calculateMonthlyTrend(
          data.homeworkItems
        ),
    };
  }, [data]);

  const visibleGroups = useMemo(
    () =>
      selectedGroupId === null
        ? groups
        : groups.filter(
            (group) =>
              group.id === selectedGroupId
          ),
    [groups, selectedGroupId]
  );

  const groupStatistics = useMemo(
    () =>
      visibleGroups.map((group) => {
        const homeworkItems =
          data.homeworkItems.filter(
            (item) =>
              item.groupId === group.id
          );

        const attendanceItems =
          data.attendanceItems.filter(
            (item) =>
              item.groupId === group.id
          );

        return {
          group,
          averageScore:
            calculateAverageScore(
              homeworkItems
            ),
          attendancePercentage:
            calculateAttendancePercentage(
              attendanceItems
            ),
          completedCount:
            homeworkItems.filter((item) =>
              isCompleted(item.submission)
            ).length,
          totalHomework:
            homeworkItems.length,
          overdueCount:
            homeworkItems.filter((item) =>
              isOverdue(
                item.homework,
                item.submission
              )
            ).length,
        };
      }),
    [
      data.attendanceItems,
      data.homeworkItems,
      visibleGroups,
    ]
  );

  const recentGrades = useMemo(
    () =>
      getGradedItems(data.homeworkItems)
        .sort((first, second) => {
          const firstDate =
            first.submission?.checked_at ??
            first.submission?.updated_at ??
            '';

          const secondDate =
            second.submission?.checked_at ??
            second.submission?.updated_at ??
            '';

          return secondDate.localeCompare(
            firstDate
          );
        })
        .slice(0, 5),
    [data.homeworkItems]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />

          <p className="text-sm text-gray-500">
            Загружаем успеваемость…
          </p>
        </div>
      </div>
    );
  }

  const trendValue =
    statistics.monthlyTrend;

  const trendText =
    trendValue === null
      ? '—'
      : `${trendValue > 0 ? '+' : ''}${trendValue}%`;

  const trendClass =
    trendValue === null
      ? 'text-gray-900'
      : trendValue >= 0
        ? 'text-green-700'
        : 'text-red-700';

  const lowerPanelsHeight =
    'xl:h-[430px]';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Успеваемость
          </h1>

          <p className="mt-1 text-gray-500">
            Ваши результаты по заданиям и посещаемости
          </p>
        </div>
      </div>

      {error && (
        <div className="card border border-red-100 bg-red-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <p className="font-semibold text-red-800">
                  Не удалось загрузить успеваемость
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadProgress()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </button>
          </div>
        </div>
      )}

      {!error && groups.length > 1 && (
        <div className="card p-4 sm:p-5">
          <label
            htmlFor="progress-group"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Группа
          </label>

          <select
            id="progress-group"
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

      {!error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {statistics.averageScore ===
                    null
                      ? '—'
                      : `${statistics.averageScore}%`}
                  </p>

                  <p className="text-xs text-gray-500">
                    {statistics.averageScore ===
                    null
                      ? 'Нет проверенных работ'
                      : 'Средний результат'}
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {
                      statistics.completedCount
                    }
                    /
                    {
                      statistics.totalHomework
                    }
                  </p>

                  <p className="text-xs text-gray-500">
                    Выполнено заданий
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {statistics.overdueCount}
                  </p>

                  <p className="text-xs text-gray-500">
                    Просрочено
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <CalendarCheck2 className="h-5 w-5 text-purple-500" />

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {statistics.attendancePercentage ===
                    null
                      ? '—'
                      : `${statistics.attendancePercentage}%`}
                  </p>

                  <p className="text-xs text-gray-500">
                    {statistics.attendancePercentage ===
                    null
                      ? 'Нет отметок посещаемости'
                      : 'Посещаемость'}
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-amber-500" />

                <div>
                  <p
                    className={`text-xl font-bold ${trendClass}`}
                  >
                    {trendText}
                  </p>

                  <p className="text-xs text-gray-500">
                    {trendValue === null
                      ? 'Недостаточно данных'
                      : 'За последние 30 дней'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
            <section
              className={`card flex min-h-[280px] flex-col overflow-hidden ${lowerPanelsHeight}`}
            >
              <div className="shrink-0 border-b border-gray-100 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Результаты по группам
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Оценки, выполненные задания и посещаемость
                </p>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
                {groupStatistics.map(
                  (groupData) => (
                    <div
                      key={groupData.group.id}
                      className="rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />

                          <h3 className="font-semibold text-gray-900">
                            {
                              groupData.group
                                .name
                            }
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            Выполнено{' '}
                            {
                              groupData.completedCount
                            }
                            /
                            {
                              groupData.totalHomework
                            }
                          </span>

                          {groupData.overdueCount >
                            0 && (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                              Просрочено:{' '}
                              {
                                groupData.overdueCount
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        {groupData.averageScore ===
                        null ? (
                          <p className="text-sm text-gray-500">
                            Проверенных заданий пока нет
                          </p>
                        ) : (
                          <ProgressBar
                            label="Средний результат"
                            value={
                              groupData.averageScore
                            }
                            color={getProgressColor(
                              groupData.averageScore
                            )}
                          />
                        )}

                        {groupData.attendancePercentage ===
                        null ? (
                          <p className="text-sm text-gray-500">
                            Отметок посещаемости пока нет
                          </p>
                        ) : (
                          <ProgressBar
                            label="Посещаемость"
                            value={
                              groupData.attendancePercentage
                            }
                            color={getProgressColor(
                              groupData.attendancePercentage
                            )}
                          />
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>

            <section
              className={`card flex min-h-[280px] flex-col overflow-hidden ${lowerPanelsHeight}`}
            >
              <div className="shrink-0 border-b border-gray-100 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Последние проверенные работы
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Пять последних результатов преподавателя
                </p>
              </div>

              {recentGrades.length === 0 ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto p-8 text-center">
                  <ClipboardCheck className="h-10 w-10 text-gray-300" />

                  <h3 className="mt-4 font-semibold text-gray-900">
                    Проверенных работ пока нет
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    После проверки задания результат появится здесь.
                  </p>
                </div>
              ) : (
                <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
                  {recentGrades.map((item) => {
                    const score =
                      item.submission?.score ?? 0;

                    const percentage =
                      item.homework.max_score >
                      0
                        ? Math.round(
                            (score /
                              item.homework
                                .max_score) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={item.homework.id}
                        className="p-5 transition hover:bg-gray-50/70 sm:p-6"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {
                                  item.homework
                                    .title
                                }
                              </h3>

                              {groups.length >
                                1 &&
                                selectedGroupId ===
                                  null && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                    <Users className="h-3.5 w-3.5" />
                                    {
                                      item.groupName
                                    }
                                  </span>
                                )}
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                              Проверено:{' '}
                              {formatCheckedDate(
                                item.submission
                                  ?.checked_at ??
                                  null
                              )}
                            </p>

                            {item.submission
                              ?.teacher_comment && (
                              <p className="mt-2 text-sm leading-6 text-gray-600">
                                {
                                  item.submission
                                    .teacher_comment
                                }
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-left sm:text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {score}/
                              {
                                item.homework
                                  .max_score
                              }
                            </p>

                            <span
                              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                percentage >= 80
                                  ? 'bg-green-50 text-green-700'
                                  : percentage >=
                                      60
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
