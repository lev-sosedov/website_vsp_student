import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Users,
} from 'lucide-react';

import type { HomeworkSubmissionStatus } from '../../api/homeworkApi';
import type { StudentHomeworkItem } from '../../services/homeworkService';

interface HomeworkCardProps {
  item: StudentHomeworkItem;
  onOpen: (item: StudentHomeworkItem) => void;
  showGroupName?: boolean;
}

interface StatusInfo {
  label: string;
  icon: typeof Circle;
  badgeClass: string;
  iconClass: string;
}

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

function formatDate(dateString: string | null): string {
  if (!dateString) {
    return 'Без срока';
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Дата не указана';
  }

  return `${date.getDate()} ${
    MONTH_NAMES[date.getMonth()]
  } ${date.getFullYear()}, ${String(
    date.getHours()
  ).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

function isOverdue(
  dueAt: string | null,
  status: HomeworkSubmissionStatus | null
): boolean {
  if (!dueAt) {
    return false;
  }

  if (
    status === 'accepted' ||
    status === 'rejected'
  ) {
    return false;
  }

  return new Date(dueAt).getTime() < Date.now();
}

function getStatusInfo(
  status: HomeworkSubmissionStatus | null,
  overdue: boolean
): StatusInfo {
  if (
    overdue &&
    status !== 'submitted' &&
    status !== 'in_review' &&
    status !== 'accepted' &&
    status !== 'rejected'
  ) {
    return {
      label: 'Просрочено',
      icon: AlertTriangle,
      badgeClass: 'bg-red-50 text-red-700',
      iconClass: 'text-red-500',
    };
  }

  switch (status) {
    case 'draft':
      return {
        label: 'Черновик',
        icon: Circle,
        badgeClass: 'bg-gray-100 text-gray-600',
        iconClass: 'text-gray-400',
      };

    case 'submitted':
      return {
        label: 'Отправлено',
        icon: Clock,
        badgeClass: 'bg-amber-50 text-amber-700',
        iconClass: 'text-amber-500',
      };

    case 'in_review':
      return {
        label: 'На проверке',
        icon: Clock,
        badgeClass: 'bg-blue-50 text-blue-700',
        iconClass: 'text-blue-500',
      };

    case 'needs_revision':
      return {
        label: 'На доработке',
        icon: AlertTriangle,
        badgeClass: 'bg-orange-50 text-orange-700',
        iconClass: 'text-orange-500',
      };

    case 'accepted':
      return {
        label: 'Принято',
        icon: CheckCircle2,
        badgeClass: 'bg-green-50 text-green-700',
        iconClass: 'text-green-500',
      };

    case 'rejected':
      return {
        label: 'Отклонено',
        icon: AlertTriangle,
        badgeClass: 'bg-red-50 text-red-700',
        iconClass: 'text-red-500',
      };

    default:
      return {
        label: 'Ожидает',
        icon: Circle,
        badgeClass: 'bg-gray-100 text-gray-600',
        iconClass: 'text-gray-300',
      };
  }
}

export default function HomeworkCard({
  item,
  onOpen,
  showGroupName = false,
}: HomeworkCardProps) {
  const submissionStatus =
    item.submission?.status ?? null;

  const overdue = isOverdue(
    item.homework.due_at,
    submissionStatus
  );

  const statusInfo = getStatusInfo(
    submissionStatus,
    overdue
  );

  const StatusIcon = statusInfo.icon;

  const canOpen =
    !item.submission ||
    item.submission.status === 'draft' ||
    item.submission.status ===
      'needs_revision';

  const actionLabel = !item.submission
    ? 'Выполнить'
    : item.submission.status === 'draft'
      ? 'Продолжить'
      : item.submission.status ===
          'needs_revision'
        ? 'Исправить'
        : null;

  return (
    <article className="rounded-xl border border-gray-100 p-5 transition hover:border-red-100 hover:bg-gray-50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="pt-1">
            <StatusIcon
              className={`h-5 w-5 ${statusInfo.iconClass}`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-gray-900">
                {item.homework.title}
              </h2>

              {showGroupName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <Users className="h-3.5 w-3.5" />
                  {item.groupName}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />

                {item.lesson.topic ?? 'Занятие'}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />

                Срок: {formatDate(
                  item.homework.due_at
                )}
              </span>

              {item.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />

                  {item.attachments.length}{' '}
                  файл(а)
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {item.homework.description}
            </p>

            {item.homework.instructions && (
              <div className="mt-3 rounded-xl bg-gray-100 p-3 text-sm leading-6 text-gray-600">
                <span className="font-medium text-gray-800">
                  Инструкции:
                </span>{' '}
                {item.homework.instructions}
              </div>
            )}

            {item.submission?.teacher_comment && (
              <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                <span className="font-medium">
                  Комментарий преподавателя:
                </span>{' '}
                {
                  item.submission
                    .teacher_comment
                }
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusInfo.badgeClass}`}
          >
            {statusInfo.label}
          </span>

          {item.submission?.score !== null &&
            item.submission?.score !==
              undefined && (
              <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                {item.submission.score}/
                {item.homework.max_score}
              </span>
            )}

          {canOpen && actionLabel && (
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="btn-primary px-4 py-2 text-xs"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}