import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Loader2,
  RefreshCw,
  Star,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  type HomeworkSubmission,
} from '../../../api/homeworkApi';

import {
  useAuth,
} from '../../../context/AuthContext';

import {
  loadParentChildProgress,
  loadParentProgressChildren,
  type ParentProgressAttendanceItem,
  type ParentProgressChild,
  type ParentProgressData,
  type ParentProgressGroup,
  type ParentProgressHomeworkItem,
} from '../../../services/parentProgressService';


const EMPTY_DATA: ParentProgressData = {
  groups: [],
  homeworkItems: [],
  attendanceItems: [],
  hasActiveGroup: false,
  warnings: [],
};


const COMPLETED_STATUSES =
  new Set([
    'submitted',
    'in_review',
    'accepted',
    'rejected',
  ]);


interface ProgressMetrics {
  averageScore: number | null;
  completedCount: number;
  totalHomework: number;
  completionPercentage: number | null;
  overdueCount: number;
  attendancePercentage: number | null;
  overallProgress: number | null;
}


interface MonthlyPoint {
  key: string;
  label: string;
  value: number | null;
}


interface GroupProgress {
  group: ParentProgressGroup;
  metrics: ProgressMetrics;
}


interface AchievementItem {
  title: string;
  description: string;
  earned: boolean;
  icon: LucideIcon;
}


function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось загрузить успеваемость';
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


function formatDate(
  value: string | null
): string {
  if (!value) {
    return 'Дата не указана';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Дата не указана';
  }

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  ).format(date);
}


function isCompleted(
  submission:
    | HomeworkSubmission
    | null
): boolean {
  return Boolean(
    submission &&
      COMPLETED_STATUSES.has(
        submission.status
      )
  );
}


function isOverdue(
  item: ParentProgressHomeworkItem
): boolean {
  if (
    !item.homework.due_at ||
    isCompleted(
      item.submission
    )
  ) {
    return false;
  }

  return (
    new Date(
      item.homework.due_at
    ).getTime() <
    Date.now()
  );
}


function getGradedItems(
  items:
    ParentProgressHomeworkItem[]
): ParentProgressHomeworkItem[] {
  return items.filter(
    (item) =>
      typeof item.submission
        ?.score === 'number' &&
      item.homework.max_score > 0
  );
}


function calculateAverageScore(
  items:
    ParentProgressHomeworkItem[]
): number | null {
  const graded =
    getGradedItems(items);

  if (
    graded.length === 0
  ) {
    return null;
  }

  const earned =
    graded.reduce(
      (total, item) =>
        total +
        (
          item.submission
            ?.score ?? 0
        ),
      0
    );

  const maximum =
    graded.reduce(
      (total, item) =>
        total +
        item.homework.max_score,
      0
    );

  if (maximum <= 0) {
    return null;
  }

  return Math.round(
    (
      earned /
      maximum
    ) * 100
  );
}


function calculateAttendance(
  items:
    ParentProgressAttendanceItem[]
): number | null {
  const present =
    items.filter(
      (item) =>
        item.attendance.status ===
          'present' ||
        item.attendance.status ===
          'remote'
    ).length;

  const late =
    items.filter(
      (item) =>
        item.attendance
          .status === 'late'
    ).length;

  const absent =
    items.filter(
      (item) =>
        item.attendance
          .status === 'absent'
    ).length;

  const counted =
    present + late + absent;

  if (counted === 0) {
    return null;
  }

  return Math.round(
    (
      (
        present +
        late
      ) /
      counted
    ) * 100
  );
}


function calculateMetrics(
  homeworkItems:
    ParentProgressHomeworkItem[],
  attendanceItems:
    ParentProgressAttendanceItem[]
): ProgressMetrics {
  const averageScore =
    calculateAverageScore(
      homeworkItems
    );

  const completedCount =
    homeworkItems.filter(
      (item) =>
        isCompleted(
          item.submission
        )
    ).length;

  const totalHomework =
    homeworkItems.length;

  const completionPercentage =
    totalHomework > 0
      ? Math.round(
          (
            completedCount /
            totalHomework
          ) * 100
        )
      : null;

  const overdueCount =
    homeworkItems.filter(
      isOverdue
    ).length;

  const attendancePercentage =
    calculateAttendance(
      attendanceItems
    );

  const availableValues = [
    averageScore,
    completionPercentage,
    attendancePercentage,
  ].filter(
    (
      value
    ): value is number =>
      value !== null
  );

  const overallProgress =
    availableValues.length > 0
      ? Math.round(
          availableValues.reduce(
            (
              total,
              value
            ) =>
              total + value,
            0
          ) /
            availableValues.length
        )
      : null;

  return {
    averageScore,
    completedCount,
    totalHomework,
    completionPercentage,
    overdueCount,
    attendancePercentage,
    overallProgress,
  };
}


function getMonthKey(
  date: Date
): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}


function getMonthlyPoints(
  items:
    ParentProgressHomeworkItem[]
): MonthlyPoint[] {
  const months =
    Array.from(
      {
        length: 6,
      },
      (
        _,
        index
      ) => {
        const current =
          new Date();

        return new Date(
          current.getFullYear(),
          current.getMonth() -
            (5 - index),
          1
        );
      }
    );

  return months.map(
    (month) => {
      const key =
        getMonthKey(month);

      const monthItems =
        getGradedItems(
          items
        ).filter((item) => {
          const checkedAt =
            item.submission
              ?.checked_at ??
            item.submission
              ?.updated_at;

          if (!checkedAt) {
            return false;
          }

          const date =
            new Date(
              checkedAt
            );

          return (
            !Number.isNaN(
              date.getTime()
            ) &&
            getMonthKey(date) ===
              key
          );
        });

      return {
        key,
        label:
          new Intl.DateTimeFormat(
            'ru-RU',
            {
              month: 'short',
            }
          )
            .format(month)
            .replace('.', ''),
        value:
          calculateAverageScore(
            monthItems
          ),
      };
    }
  );
}


function getProgressBarClass(
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


function ProgressLine({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-gray-600">
          {label}
        </span>

        <span className="font-bold text-gray-900">
          {value === null
            ? '—'
            : `${value}%`}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${
            value === null
              ? 'bg-gray-200'
              : getProgressBarClass(
                  value
                )
          }`}
          style={{
            width:
              `${value ?? 0}%`,
          }}
        />
      </div>
    </div>
  );
}


function ChildAvatar({
  child,
}: {
  child: ParentProgressChild;
}) {
  if (child.avatarUrl) {
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


function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBackground,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  iconBackground: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
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

          <p className="text-sm font-medium text-gray-700">
            {label}
          </p>

          <p className="mt-0.5 text-xs text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}


export default function ParentProgress() {
  const {
    user,
  } = useAuth();

  const parentId =
    Number(user?.id ?? 0);

  const [
    children,
    setChildren,
  ] = useState<
    ParentProgressChild[]
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
    data,
    setData,
  ] = useState<
    ParentProgressData
  >(EMPTY_DATA);

  const [
    loadingChildren,
    setLoadingChildren,
  ] = useState(true);

  const [
    loadingProgress,
    setLoadingProgress,
  ] = useState(false);

  const [
    pageError,
    setPageError,
  ] = useState<string | null>(
    null
  );

  const [
    progressError,
    setProgressError,
  ] = useState<string | null>(
    null
  );


  const loadChildren =
    useCallback(async () => {
      setLoadingChildren(true);
      setPageError(null);

      try {
        const loadedChildren =
          await loadParentProgressChildren(
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

  const loadProgress =
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

      setLoadingProgress(true);
      setProgressError(null);

      try {
        const loadedData =
          await loadParentChildProgress(
            selectedChildId
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
        setProgressError(
          getErrorMessage(error)
        );
      } finally {
        if (sequence === childLoadSequence.current) {
          setLoadingProgress(false);
        }
      }
    }, [selectedChildId]);


  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);


  useEffect(() => {
    setSelectedGroupId(
      null
    );

    void loadProgress();
  }, [loadProgress]);


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


  const visibleHomework =
    useMemo(
      () =>
        data.homeworkItems.filter(
          (item) =>
            selectedGroupId ===
              null ||
            item.groupId ===
              selectedGroupId
        ),
      [
        data.homeworkItems,
        selectedGroupId,
      ]
    );


  const visibleAttendance =
    useMemo(
      () =>
        data.attendanceItems.filter(
          (item) =>
            selectedGroupId ===
              null ||
            item.groupId ===
              selectedGroupId
        ),
      [
        data.attendanceItems,
        selectedGroupId,
      ]
    );


  const metrics =
    useMemo(
      () =>
        calculateMetrics(
          visibleHomework,
          visibleAttendance
        ),
      [
        visibleHomework,
        visibleAttendance,
      ]
    );


  const monthlyPoints =
    useMemo(
      () =>
        getMonthlyPoints(
          visibleHomework
        ),
      [visibleHomework]
    );


  const monthlyTrend =
    useMemo(() => {
      const values =
        monthlyPoints
          .map(
            (point) =>
              point.value
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      if (
        values.length < 2
      ) {
        return null;
      }

      return (
        values[
          values.length - 1
        ] -
        values[
          values.length - 2
        ]
      );
    }, [monthlyPoints]);


  const groupProgress =
    useMemo(
      (): GroupProgress[] =>
        data.groups
          .filter(
            (group) =>
              selectedGroupId ===
                null ||
              group.id ===
                selectedGroupId
          )
          .map((group) => ({
            group,
            metrics:
              calculateMetrics(
                data.homeworkItems.filter(
                  (item) =>
                    item.groupId ===
                    group.id
                ),
                data.attendanceItems.filter(
                  (item) =>
                    item.groupId ===
                    group.id
                )
              ),
          })),
      [
        data.attendanceItems,
        data.groups,
        data.homeworkItems,
        selectedGroupId,
      ]
    );


  const achievements =
    useMemo(
      (): AchievementItem[] => {
        const graded =
          getGradedItems(
            visibleHomework
          );

        const hasExcellentScore =
          graded.some((item) => {
            const score =
              item.submission
                ?.score;

            return (
              typeof score ===
                'number' &&
              item.homework
                .max_score > 0 &&
              (
                score /
                item.homework
                  .max_score
              ) *
                100 >=
                90
            );
          });

        return [
          {
            title:
              'Первая проверенная работа',
            description:
              'Получена первая оценка',
            earned:
              graded.length > 0,
            icon: Trophy,
          },
          {
            title:
              'Высокий результат',
            description:
              'Оценка не ниже 90%',
            earned:
              hasExcellentScore,
            icon: Star,
          },
          {
            title:
              'Ответственный ученик',
            description:
              'Нет просроченных заданий',
            earned:
              metrics.totalHomework >
                0 &&
              metrics.overdueCount ===
                0,
            icon: ClipboardCheck,
          },
          {
            title:
              'Отличная посещаемость',
            description:
              'Посещаемость не ниже 90%',
            earned:
              (
                metrics
                  .attendancePercentage ??
                0
              ) >= 90,
            icon: CalendarCheck2,
          },
          {
            title:
              'Все задания выполнены',
            description:
              'Сданы все опубликованные работы',
            earned:
              metrics.totalHomework >
                0 &&
              metrics.completedCount ===
                metrics.totalHomework,
            icon: CheckCircle2,
          },
          {
            title:
              'Положительная динамика',
            description:
              'Результат вырос относительно прошлого месяца',
            earned:
              (
                monthlyTrend ??
                0
              ) > 0,
            icon: TrendingUp,
          },
        ];
      },
      [
        metrics,
        monthlyTrend,
        visibleHomework,
      ]
    );


  const recentGrades =
    useMemo(
      () =>
        getGradedItems(
          visibleHomework
        )
          .sort(
            (
              first,
              second
            ) => {
              const firstDate =
                first.submission
                  ?.checked_at ??
                first.submission
                  ?.updated_at ??
                '';

              const secondDate =
                second.submission
                  ?.checked_at ??
                second.submission
                  ?.updated_at ??
                '';

              return secondDate.localeCompare(
                firstDate
              );
            }
          )
          .slice(0, 6),
      [visibleHomework]
    );


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


  const overallValue =
    metrics.overallProgress;

  const trendText =
    monthlyTrend === null
      ? 'Недостаточно данных'
      : `${monthlyTrend > 0 ? '+' : ''}${monthlyTrend}% к прошлому месяцу`;

  const trendClass =
    monthlyTrend === null
      ? 'text-gray-500'
      : monthlyTrend >= 0
        ? 'text-green-700'
        : 'text-red-700';


  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Успеваемость
          </h1>

          <p className="mt-1 text-gray-500">
            Оценки, выполненные задания и посещаемость ребёнка
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadChildren();
            void loadProgress();
          }}
          disabled={
            loadingProgress
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loadingProgress
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
                      (event) =>
                        setSelectedChildId(
                          Number(
                            event.target
                              .value
                          )
                        )
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
                htmlFor="parent-progress-group"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Учебная группа
              </label>

              <select
                id="parent-progress-group"
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


      {progressError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-semibold text-red-800">
              Не удалось загрузить успеваемость
            </p>

            <p className="mt-1 text-sm text-red-700">
              {progressError}
            </p>
          </div>
        </div>
      )}


      {!progressError &&
        selectedChild &&
        !data.hasActiveGroup && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <p className="font-semibold text-amber-900">
                Ребёнок пока не добавлен в активную учебную группу
              </p>

              <p className="mt-1 text-sm text-amber-700">
                Показатели появятся после добавления ребёнка в группу и проверки первых работ.
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


      {loadingProgress ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />

            <p>
              Рассчитываем успеваемость ребёнка...
            </p>
          </div>
        </div>
      ) : selectedChild &&
        !progressError ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <MetricCard
              label="Средний результат"
              value={
                metrics.averageScore ===
                null
                  ? '—'
                  : `${metrics.averageScore}%`
              }
              description={
                metrics.averageScore ===
                null
                  ? 'Нет проверенных работ'
                  : 'По проверенным заданиям'
              }
              icon={Award}
              iconClass="text-green-600"
              iconBackground="bg-green-50"
            />

            <MetricCard
              label="Выполнено заданий"
              value={`${metrics.completedCount}/${metrics.totalHomework}`}
              description={
                metrics.completionPercentage ===
                null
                  ? 'Заданий пока нет'
                  : `${metrics.completionPercentage}% от опубликованных`
              }
              icon={
                ClipboardCheck
              }
              iconClass="text-blue-600"
              iconBackground="bg-blue-50"
            />

            <MetricCard
              label="Посещаемость"
              value={
                metrics.attendancePercentage ===
                null
                  ? '—'
                  : `${metrics.attendancePercentage}%`
              }
              description={
                metrics.attendancePercentage ===
                null
                  ? 'Отметок пока нет'
                  : 'С учётом опозданий'
              }
              icon={
                CalendarCheck2
              }
              iconClass="text-violet-600"
              iconBackground="bg-violet-50"
            />

            <MetricCard
              label="Просрочено"
              value={
                String(
                  metrics.overdueCount
                )
              }
              description="Задания без своевременной сдачи"
              icon={
                AlertTriangle
              }
              iconClass="text-red-600"
              iconBackground="bg-red-50"
            />

            <MetricCard
              label="Динамика"
              value={
                monthlyTrend ===
                null
                  ? '—'
                  : `${monthlyTrend > 0 ? '+' : ''}${monthlyTrend}%`
              }
              description={
                trendText
              }
              icon={
                TrendingUp
              }
              iconClass={
                trendClass
              }
              iconBackground="bg-gray-100"
            />
          </div>


          <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-600" />

                <h2 className="font-bold text-gray-900">
                  Общий прогресс
                </h2>
              </div>

              <div className="mt-6 flex justify-center">
                <div
                  className="flex h-44 w-44 items-center justify-center rounded-full"
                  style={{
                    background:
                      `conic-gradient(#dc2626 ${(overallValue ?? 0) * 3.6}deg, #f3f4f6 0deg)`,
                  }}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <p className="text-4xl font-bold text-gray-900">
                      {overallValue ===
                      null
                        ? '—'
                        : `${overallValue}%`}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Общий индекс
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="rounded-xl bg-green-50 p-3 text-center">
                  <p className="text-xl font-bold text-green-700">
                    {metrics.averageScore ===
                    null
                      ? '—'
                      : `${metrics.averageScore}%`}
                  </p>

                  <p className="text-xs text-green-700/70">
                    Средний результат
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-3 text-center">
                  <p className="text-xl font-bold text-blue-700">
                    {metrics.completionPercentage ===
                    null
                      ? '—'
                      : `${metrics.completionPercentage}%`}
                  </p>

                  <p className="text-xs text-blue-700/70">
                    Заданий выполнено
                  </p>
                </div>
              </div>

              <p className={`mt-5 text-center text-sm font-medium ${trendClass}`}>
                {trendText}
              </p>
            </section>


            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-gray-900">
                Динамика оценок по месяцам
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Средний процент по проверенным работам
              </p>

              <div className="mt-6 flex h-64 items-end gap-2 sm:gap-4">
                {monthlyPoints.map(
                  (point) => {
                    const height =
                      point.value ===
                      null
                        ? 6
                        : Math.max(
                            point.value,
                            8
                          );

                    return (
                      <div
                        key={
                          point.key
                        }
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                      >
                        <p className="mb-2 text-xs font-bold text-gray-800">
                          {point.value ??
                            '—'}
                        </p>

                        <div className="flex h-44 w-full items-end overflow-hidden rounded-t-xl bg-gray-100">
                          <div
                            className={`w-full rounded-t-xl transition-all ${
                              point.value ===
                              null
                                ? 'bg-gray-200'
                                : 'bg-red-500'
                            }`}
                            style={{
                              height:
                                `${height}%`,
                            }}
                          />
                        </div>

                        <p className="mt-2 truncate text-xs text-gray-500">
                          {
                            point.label
                          }
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          </div>


          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />

              <h2 className="font-bold text-gray-900">
                Результаты по учебным группам
              </h2>
            </div>

            {groupProgress.length ===
            0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Учебные группы не найдены
              </div>
            ) : (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {groupProgress.map(
                  (groupData) => (
                    <article
                      key={
                        groupData
                          .group.id
                      }
                      className="rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-bold text-gray-900">
                          {
                            groupData
                              .group.name
                          }
                        </h3>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          {
                            groupData
                              .metrics
                              .completedCount
                          }
                          /
                          {
                            groupData
                              .metrics
                              .totalHomework
                          }
                          {' '}
                          заданий
                        </span>
                      </div>

                      <div className="mt-4 space-y-4">
                        <ProgressLine
                          label="Средний результат"
                          value={
                            groupData
                              .metrics
                              .averageScore
                          }
                        />

                        <ProgressLine
                          label="Выполнение заданий"
                          value={
                            groupData
                              .metrics
                              .completionPercentage
                          }
                        />

                        <ProgressLine
                          label="Посещаемость"
                          value={
                            groupData
                              .metrics
                              .attendancePercentage
                          }
                        />
                      </div>

                      {groupData.metrics
                        .overdueCount >
                        0 && (
                        <p className="mt-4 text-sm font-medium text-red-600">
                          Просрочено:
                          {' '}
                          {
                            groupData
                              .metrics
                              .overdueCount
                          }
                        </p>
                      )}
                    </article>
                  )
                )}
              </div>
            )}
          </section>


          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />

                <h2 className="font-bold text-gray-900">
                  Достижения
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Рассчитываются автоматически по текущим результатам
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {achievements.map(
                  (achievement) => {
                    const Icon =
                      achievement.icon;

                    return (
                      <div
                        key={
                          achievement.title
                        }
                        className={`rounded-xl border p-4 text-center ${
                          achievement.earned
                            ? 'border-red-100 bg-red-50'
                            : 'border-gray-100 bg-gray-50 opacity-55'
                        }`}
                      >
                        <Icon
                          className={`mx-auto h-7 w-7 ${
                            achievement.earned
                              ? 'text-red-600'
                              : 'text-gray-400'
                          }`}
                        />

                        <p className="mt-3 text-sm font-bold text-gray-900">
                          {
                            achievement.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {
                            achievement.description
                          }
                        </p>

                        <span
                          className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            achievement.earned
                              ? 'bg-white text-red-600'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {achievement.earned
                            ? 'Получено'
                            : 'Не получено'}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </section>


            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />

                  <h2 className="font-bold text-gray-900">
                    Последние оценки
                  </h2>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Недавно проверенные домашние работы
                </p>
              </div>

              {recentGrades.length ===
              0 ? (
                <div className="px-6 py-14 text-center">
                  <Clock3 className="mx-auto h-9 w-9 text-gray-300" />

                  <p className="mt-3 font-semibold text-gray-800">
                    Проверенных работ пока нет
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentGrades.map(
                    (item) => {
                      const score =
                        item.submission
                          ?.score ?? 0;

                      const percent =
                        item.homework
                          .max_score >
                        0
                          ? Math.round(
                              (
                                score /
                                item
                                  .homework
                                  .max_score
                              ) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          key={
                            item.homework
                              .id
                          }
                          className="flex items-start gap-3 px-5 py-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50">
                            <Award className="h-5 w-5 text-green-600" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-gray-900">
                                  {
                                    item
                                      .homework
                                      .title
                                  }
                                </p>

                                <p className="mt-1 truncate text-xs text-gray-500">
                                  {
                                    item.groupName
                                  }
                                  {' · '}
                                  {formatDate(
                                    item
                                      .submission
                                      ?.checked_at ??
                                      item
                                        .submission
                                        ?.updated_at ??
                                      null
                                  )}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  percent >=
                                  80
                                    ? 'bg-green-50 text-green-700'
                                    : percent >=
                                        60
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {score}/
                                {
                                  item
                                    .homework
                                    .max_score
                                }
                              </span>
                            </div>

                            {item.submission
                              ?.teacher_comment && (
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
                                {
                                  item
                                    .submission
                                    .teacher_comment
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
