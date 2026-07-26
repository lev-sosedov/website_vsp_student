import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import type {
  StudentDashboardHomework,
} from '../../../services/dashboardService';

interface StudentDashboardHomeworksProps {
  homeworks: StudentDashboardHomework[];
  isLoading: boolean;
}

function formatHomeworkDueDate(
  value: string | null
): string {
  if (!value) {
    return 'Без срока';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Срок не указан';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getHomeworkStatusContent(
  homework: StudentDashboardHomework
): {
  label: string;
  badgeClass: string;
  icon: typeof Circle;
  iconClass: string;
} {
  switch (homework.status) {
    case 'overdue':
      return {
        label: 'Просрочено',
        badgeClass: 'bg-red-50 text-red-600',
        icon: AlertTriangle,
        iconClass: 'text-red-500',
      };

    case 'revision':
      return {
        label: 'На доработке',
        badgeClass:
          'bg-orange-50 text-orange-600',
        icon: AlertCircle,
        iconClass: 'text-orange-500',
      };

    default:
      return {
        label: 'Ожидает',
        badgeClass: 'bg-gray-50 text-gray-500',
        icon: Circle,
        iconClass: 'text-gray-300',
      };
  }
}

export default function StudentDashboardHomeworks({
  homeworks,
  isLoading,
}: StudentDashboardHomeworksProps) {
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">
          Ближайшие задания
        </h2>

        <Link
          to="/dashboard/homework"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-red-600 hover:text-red-700"
        >
          Все задания
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading && homeworks.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        </div>
      ) : homeworks.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-gray-50 p-5 text-center">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
          <p className="mt-3 text-sm font-medium text-gray-700">
            Актуальных заданий нет
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Все опубликованные работы выполнены.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {homeworks.map((homework) => {
            const status =
              getHomeworkStatusContent(homework);

            const StatusIcon = status.icon;

            return (
              <Link
                key={homework.id}
                to="/dashboard/homework"
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 transition hover:border-red-100 hover:bg-gray-50"
              >
                <StatusIcon
                  className={`h-5 w-5 shrink-0 ${status.iconClass}`}
                />

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-gray-900">
                    {homework.title}
                  </p>

                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                    {homework.groupName}
                    {' · '}
                    {formatHomeworkDueDate(
                      homework.dueAt
                    )}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${status.badgeClass}`}
                >
                  {status.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
