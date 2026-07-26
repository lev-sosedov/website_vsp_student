import {
  ArrowRight,
  Calendar,
  Loader2,
  MessageSquare,
  Users,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import type {
  StudentDashboardGroup,
} from '../../../services/dashboardService';

export interface StudentDashboardGroupCard
  extends StudentDashboardGroup {
  branchId: number | null;
  studentsCount: number | null;
}

interface StudentDashboardGroupsProps {
  groups: StudentDashboardGroupCard[];
  isLoading: boolean;
  hasError: boolean;
}

export default function StudentDashboardGroups({
  groups,
  isLoading,
  hasError,
}: StudentDashboardGroupsProps) {
  return (
    <div className="card min-h-[270px] p-6 lg:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Мои группы
        </h2>

        <Link
          to="/dashboard/schedule"
          className="inline-flex items-center gap-1 text-sm text-red-600 transition hover:text-red-700"
        >
          Все
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading && groups.length === 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-8 text-center">
          <Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-red-500" />
          <p className="text-sm text-gray-500">
            Загружаем ваши группы…
          </p>
        </div>
      )}

      {!isLoading &&
        !hasError &&
        groups.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">
              Учебные группы не найдены
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Вы пока не добавлены ни в одну
              активную группу.
            </p>
          </div>
        )}

      {groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <Users className="h-5 w-5 text-red-600" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {group.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Филиал:{' '}
                    {group.branchId ?? 'не указан'}
                    {' · '}
                    Студентов:{' '}
                    {group.studentsCount ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link
                  to={`/dashboard/messages?groupId=${group.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100"
                >
                  <MessageSquare className="h-4 w-4" />
                  Сообщения
                </Link>

                <Link
                  to={`/dashboard/schedule?groupId=${group.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <Calendar className="h-4 w-4" />
                  Расписание
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
