import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
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
  type HomeworkSubmissionStatus,
} from '../../../api/homeworkApi';

import {
  useAuth,
} from '../../../context/AuthContext';

import {
  type StudentHomeworkItem,
} from '../../../services/homeworkService';

import {
  loadParentChildHomework,
  loadParentHomeworkChildren,
  type ParentHomeworkChild,
  type ParentHomeworkResult,
} from '../../../services/parentHomeworkService';


type HomeworkFilter =
  | 'all'
  | 'pending'
  | 'submitted'
  | 'graded';


interface HomeworkStatusInfo {
  label: string;
  badgeClass: string;
  icon: typeof Circle;
  iconClass: string;
}


const EMPTY_RESULT: ParentHomeworkResult = {
  groups: [],
  homework: {
    items: [],
    pendingCount: 0,
    submittedCount: 0,
    gradedCount: 0,
    overdueCount: 0,
  },
  hasActiveGroup: false,
  warnings: [],
};


function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось загрузить домашние задания';
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
    return 'Без срока';
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
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}


function isSubmittedStatus(
  status:
    | HomeworkSubmissionStatus
    | null
): boolean {
  return (
    status === 'submitted' ||
    status === 'in_review'
  );
}


function isGradedStatus(
  status:
    | HomeworkSubmissionStatus
    | null
): boolean {
  return (
    status === 'accepted' ||
    status === 'rejected'
  );
}


function isHomeworkOverdue(
  item: StudentHomeworkItem
): boolean {
  const dueAt =
    item.homework.due_at;

  const status =
    item.submission?.status ??
    null;

  if (!dueAt) {
    return false;
  }

  if (
    isSubmittedStatus(status) ||
    isGradedStatus(status)
  ) {
    return false;
  }

  return (
    new Date(dueAt).getTime() <
    Date.now()
  );
}


function getStatusInfo(
  item: StudentHomeworkItem
): HomeworkStatusInfo {
  const status =
    item.submission?.status ??
    null;

  if (
    isHomeworkOverdue(item)
  ) {
    return {
      label: 'Просрочено',
      badgeClass:
        'border-red-200 bg-red-50 text-red-700',
      icon: AlertTriangle,
      iconClass:
        'text-red-500',
    };
  }

  switch (status) {
    case 'draft':
      return {
        label: 'Черновик',
        badgeClass:
          'border-gray-200 bg-gray-100 text-gray-600',
        icon: Circle,
        iconClass:
          'text-gray-400',
      };

    case 'submitted':
      return {
        label: 'Сдано',
        badgeClass:
          'border-blue-200 bg-blue-50 text-blue-700',
        icon: Send,
        iconClass:
          'text-blue-500',
      };

    case 'in_review':
      return {
        label: 'На проверке',
        badgeClass:
          'border-blue-200 bg-blue-50 text-blue-700',
        icon: Clock3,
        iconClass:
          'text-blue-500',
      };

    case 'needs_revision':
      return {
        label: 'На доработке',
        badgeClass:
          'border-orange-200 bg-orange-50 text-orange-700',
        icon: AlertTriangle,
        iconClass:
          'text-orange-500',
      };

    case 'accepted':
      return {
        label: 'Оценено',
        badgeClass:
          'border-green-200 bg-green-50 text-green-700',
        icon: CheckCircle2,
        iconClass:
          'text-green-500',
      };

    case 'rejected':
      return {
        label: 'Отклонено',
        badgeClass:
          'border-red-200 bg-red-50 text-red-700',
        icon: AlertTriangle,
        iconClass:
          'text-red-500',
      };

    default:
      return {
        label: 'Ожидает сдачи',
        badgeClass:
          'border-red-200 bg-red-50 text-red-700',
        icon: Circle,
        iconClass:
          'text-red-400',
      };
  }
}


function matchesFilter(
  item: StudentHomeworkItem,
  filter: HomeworkFilter
): boolean {
  const status =
    item.submission?.status ??
    null;

  if (filter === 'all') {
    return true;
  }

  if (filter === 'submitted') {
    return isSubmittedStatus(
      status
    );
  }

  if (filter === 'graded') {
    return isGradedStatus(
      status
    );
  }

  return (
    !isSubmittedStatus(status) &&
    !isGradedStatus(status)
  );
}


function ChildAvatar({
  child,
}: {
  child: ParentHomeworkChild;
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


function HomeworkStat({
  label,
  value,
  icon: Icon,
  iconClass,
  iconBackground,
}: {
  label: string;
  value: number;
  icon: typeof Circle;
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

        <div>
          <p className="text-xl font-bold text-gray-900">
            {value}
          </p>

          <p className="text-xs text-gray-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}


function ParentHomeworkCard({
  item,
  expanded,
  showGroupName,
  onToggle,
}: {
  item: StudentHomeworkItem;
  expanded: boolean;
  showGroupName: boolean;
  onToggle: () => void;
}) {
  const statusInfo =
    getStatusInfo(item);

  const StatusIcon =
    statusInfo.icon;

  const score =
    item.submission?.score;

  const maxScore =
    item.homework.max_score;

  const scorePercent =
    typeof score === 'number' &&
    maxScore > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (
                score /
                maxScore
              ) * 100
            )
          )
        )
      : 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-red-100 hover:shadow-md">
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <BookOpen className="h-5 w-5 text-red-600" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-gray-900">
                  {item.homework.title}
                </h2>

                {showGroupName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    <GraduationCap className="h-3.5 w-3.5" />

                    {item.groupName}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {item.lesson.topic?.trim() ||
                  'Тема занятия не указана'}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusInfo.badgeClass}`}
          >
            <StatusIcon
              className={`h-3.5 w-3.5 ${statusInfo.iconClass}`}
            />

            {statusInfo.label}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />

            Срок:
            {' '}
            <span
              className={
                isHomeworkOverdue(item)
                  ? 'font-semibold text-red-600'
                  : 'font-medium text-gray-700'
              }
            >
              {formatDate(
                item.homework.due_at
              )}
            </span>
          </span>

          {item.attachments.length >
            0 && (
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-4 w-4" />

              Вложений:
              {' '}
              {
                item.attachments.length
              }
            </span>
          )}
        </div>

        {typeof score ===
          'number' && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500">
                Оценка
              </span>

              <span className="font-bold text-green-700">
                {score}/
                {maxScore}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-500"
                style={{
                  width:
                    `${scorePercent}%`,
                }}
              />
            </div>
          </div>
        )}

        {isSubmittedStatus(
          item.submission?.status ??
            null
        ) && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />

            Работа ребёнка отправлена преподавателю.
          </div>
        )}

        {item.submission?.status ===
          'needs_revision' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />

            Преподаватель вернул работу на доработку.
          </div>
        )}

        {item.submission
          ?.teacher_comment && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            <span className="font-semibold">
              Комментарий преподавателя:
            </span>
            {' '}
            {
              item.submission
                .teacher_comment
            }
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
        >
          {expanded ? (
            <>
              Скрыть подробности
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Подробнее
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/70 p-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Задание
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {item.homework.description ||
                  'Описание не указано'}
              </p>

              {item.homework
                .instructions && (
                <div className="mt-4 rounded-xl bg-white p-3 text-sm leading-6 text-gray-600 ring-1 ring-gray-200">
                  <span className="font-semibold text-gray-800">
                    Инструкции:
                  </span>
                  {' '}
                  {
                    item.homework
                      .instructions
                  }
                </div>
              )}

              {item.attachments.length >
                0 && (
                <div className="mt-4">
                  <p className="text-sm font-bold text-gray-900">
                    Материалы задания
                  </p>

                  <div className="mt-2 space-y-2">
                    {item.attachments.map(
                      (attachment) => (
                        <a
                          key={
                            attachment.id
                          }
                          href={
                            attachment.file_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-blue-700 ring-1 ring-gray-200 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4 shrink-0" />

                          <span className="truncate">
                            {attachment.title ||
                              attachment.file_name ||
                              `Файл №${attachment.id}`}
                          </span>
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Работа ребёнка
              </h3>

              {item.submission ? (
                <div className="mt-2 space-y-3">
                  <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Ответ
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {item.submission
                        .answer_text ||
                        'Текстовый ответ не указан'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                      <p className="text-xs text-gray-500">
                        Отправлено
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {item.submission
                          .submitted_at
                          ? formatDate(
                              item.submission
                                .submitted_at
                            )
                          : 'Ещё не отправлено'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                      <p className="text-xs text-gray-500">
                        Проверено
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {item.submission
                          .checked_at
                          ? formatDate(
                              item.submission
                                .checked_at
                            )
                          : 'Ещё не проверено'}
                      </p>
                    </div>
                  </div>

                  {item.submission
                    .is_late && (
                    <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                      Работа была сдана после установленного срока.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
                  <MessageSquareText className="mx-auto h-8 w-8 text-gray-300" />

                  <p className="mt-3 font-semibold text-gray-800">
                    Работа ещё не начата
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Ответ ребёнка появится здесь после создания черновика.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}


export default function ParentHomework() {
  const {
    user,
  } = useAuth();

  const parentId =
    Number(user?.id ?? 0);

  const [
    children,
    setChildren,
  ] = useState<
    ParentHomeworkChild[]
  >([]);

  const [
    selectedChildId,
    setSelectedChildId,
  ] = useState<number | null>(
    null
  );

  const [
    result,
    setResult,
  ] = useState<
    ParentHomeworkResult
  >(EMPTY_RESULT);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(
    null
  );

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<HomeworkFilter>(
    'all'
  );

  const [
    expandedHomeworkId,
    setExpandedHomeworkId,
  ] = useState<number | null>(
    null
  );

  const [
    loadingChildren,
    setLoadingChildren,
  ] = useState(true);

  const [
    loadingHomework,
    setLoadingHomework,
  ] = useState(false);

  const [
    pageError,
    setPageError,
  ] = useState<string | null>(
    null
  );

  const [
    homeworkError,
    setHomeworkError,
  ] = useState<string | null>(
    null
  );


  const loadChildren =
    useCallback(async () => {
      setLoadingChildren(true);
      setPageError(null);

      try {
        const loadedChildren =
          await loadParentHomeworkChildren(
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

  const loadHomework =
    useCallback(async () => {
      const sequence = ++childLoadSequence.current;
      if (
        selectedChildId === null
      ) {
        setResult(
          EMPTY_RESULT
        );
        return;
      }

      setLoadingHomework(true);
      setHomeworkError(null);

      try {
        const loadedResult =
          await loadParentChildHomework(
            selectedChildId
          );
        if (sequence !== childLoadSequence.current) return;

        setResult(
          loadedResult
        );

        setSelectedGroupId(
          (current) =>
            current !== null &&
            loadedResult.groups.some(
              (group) =>
                group.id ===
                current
            )
              ? current
              : null
        );
      } catch (error) {
        if (sequence !== childLoadSequence.current) return;
        setResult(
          EMPTY_RESULT
        );
        setHomeworkError(
          getErrorMessage(error)
        );
      } finally {
        if (sequence === childLoadSequence.current) {
          setLoadingHomework(false);
        }
      }
    }, [selectedChildId]);


  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);


  useEffect(() => {
    setActiveFilter('all');
    setExpandedHomeworkId(
      null
    );
    setSelectedGroupId(
      null
    );

    void loadHomework();
  }, [loadHomework]);


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


  const groupItems =
    useMemo(
      () =>
        result.homework.items.filter(
          (item) =>
            selectedGroupId ===
              null ||
            item.groupId ===
              selectedGroupId
        ),
      [
        result.homework.items,
        selectedGroupId,
      ]
    );


  const statistics =
    useMemo(() => {
      const pending =
        groupItems.filter(
          (item) =>
            matchesFilter(
              item,
              'pending'
            )
        ).length;

      const submitted =
        groupItems.filter(
          (item) =>
            matchesFilter(
              item,
              'submitted'
            )
        ).length;

      const graded =
        groupItems.filter(
          (item) =>
            matchesFilter(
              item,
              'graded'
            )
        ).length;

      const overdue =
        groupItems.filter(
          isHomeworkOverdue
        ).length;

      return {
        total:
          groupItems.length,
        pending,
        submitted,
        graded,
        overdue,
      };
    }, [groupItems]);


  const filteredItems =
    useMemo(
      () =>
        groupItems.filter(
          (item) =>
            matchesFilter(
              item,
              activeFilter
            )
        ),
      [
        activeFilter,
        groupItems,
      ]
    );


  const filterButtons: Array<{
    id: HomeworkFilter;
    label: string;
    count: number;
  }> = [
    {
      id: 'all',
      label: 'Все',
      count:
        statistics.total,
    },
    {
      id: 'pending',
      label: 'Ожидают',
      count:
        statistics.pending,
    },
    {
      id: 'submitted',
      label: 'Сданы',
      count:
        statistics.submitted,
    },
    {
      id: 'graded',
      label: 'Оценены',
      count:
        statistics.graded,
    },
  ];


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
            Домашние задания
          </h1>

          <p className="mt-1 text-gray-500">
            Задания, работы и оценки ребёнка
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadChildren();
            void loadHomework();
          }}
          disabled={
            loadingHomework
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loadingHomework
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
                htmlFor="parent-homework-group"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Учебная группа
              </label>

              <select
                id="parent-homework-group"
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

                    setActiveFilter(
                      'all'
                    );
                    setExpandedHomeworkId(
                      null
                    );
                  }
                }
                disabled={
                  result.groups.length <=
                  1
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">
                  {result.groups.length ===
                  0
                    ? 'Группа не найдена'
                    : result.groups.length ===
                        1
                      ? result.groups[0]
                          .name
                      : 'Все группы'}
                </option>

                {result.groups.length >
                  1 &&
                  result.groups.map(
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


      {homeworkError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-semibold text-red-800">
              Не удалось загрузить задания
            </p>

            <p className="mt-1 text-sm text-red-700">
              {homeworkError}
            </p>
          </div>
        </div>
      )}


      {!homeworkError &&
        selectedChild &&
        !result.hasActiveGroup && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <p className="font-semibold text-amber-900">
                Ребёнок пока не добавлен в активную учебную группу
              </p>

              <p className="mt-1 text-sm text-amber-700">
                После добавления в группу опубликованные задания появятся на этой странице.
              </p>
            </div>
          </div>
        )}


      {result.warnings.length >
        0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <p className="text-sm text-amber-800">
            {result.warnings.join(
              ' '
            )}
          </p>
        </div>
      )}


      {loadingHomework ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />

            <p>
              Загружаем домашние задания ребёнка...
            </p>
          </div>
        </div>
      ) : selectedChild &&
        !homeworkError ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HomeworkStat
              label="Ожидают"
              value={
                statistics.pending
              }
              icon={Circle}
              iconClass="text-gray-500"
              iconBackground="bg-gray-100"
            />

            <HomeworkStat
              label="Сданы"
              value={
                statistics.submitted
              }
              icon={Send}
              iconClass="text-blue-600"
              iconBackground="bg-blue-50"
            />

            <HomeworkStat
              label="Оценены"
              value={
                statistics.graded
              }
              icon={
                CheckCircle2
              }
              iconClass="text-green-600"
              iconBackground="bg-green-50"
            />

            <HomeworkStat
              label="Просрочены"
              value={
                statistics.overdue
              }
              icon={
                AlertTriangle
              }
              iconClass="text-red-600"
              iconBackground="bg-red-50"
            />
          </div>


          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900">
                Список заданий
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Показано:
                {' '}
                {
                  filteredItems.length
                }
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterButtons.map(
                (filter) => {
                  const active =
                    activeFilter ===
                    filter.id;

                  return (
                    <button
                      key={
                        filter.id
                      }
                      type="button"
                      onClick={() => {
                        setActiveFilter(
                          filter.id
                        );
                        setExpandedHomeworkId(
                          null
                        );
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                        active
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {
                        filter.label
                      }

                      <span
                        className={`rounded-full px-1.5 py-0.5 text-xs ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-gray-500'
                        }`}
                      >
                        {
                          filter.count
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>


          {filteredItems.length ===
          0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <BookOpen className="h-11 w-11 text-gray-300" />

              <h3 className="mt-4 font-bold text-gray-900">
                Заданий в этом разделе нет
              </h3>

              <p className="mt-1 max-w-md text-sm text-gray-500">
                Выберите другой статус или дождитесь публикации нового задания.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredItems.map(
                (item) => (
                  <ParentHomeworkCard
                    key={
                      item.homework.id
                    }
                    item={item}
                    expanded={
                      expandedHomeworkId ===
                      item.homework.id
                    }
                    showGroupName={
                      result.groups.length >
                        1 &&
                      selectedGroupId ===
                        null
                    }
                    onToggle={() =>
                      setExpandedHomeworkId(
                        (current) =>
                          current ===
                          item.homework.id
                            ? null
                            : item
                                .homework
                                .id
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
