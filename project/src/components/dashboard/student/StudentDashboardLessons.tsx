import {
  ArrowRight,
  Calendar,
  Loader2,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import type {
  StudentDashboardLesson,
} from '../../../services/dashboardService';

import type {
  StudentDashboardGroupCard,
} from './StudentDashboardGroups';

interface StudentDashboardLessonsProps {
  groups: StudentDashboardGroupCard[];
  lessons: StudentDashboardLesson[];
  isLoading: boolean;
  hasError: boolean;
}

function formatLessonTime(
  time: string | null | undefined
): string {
  if (!time) {
    return '--:--';
  }

  return time.slice(0, 5);
}

export default function StudentDashboardLessons({
  groups,
  lessons,
  isLoading,
  hasError,
}: StudentDashboardLessonsProps) {
  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<string>('all');

  const visibleLessons = useMemo(
    () =>
      selectedGroupId === 'all'
        ? lessons
        : lessons.filter(
            (lesson) =>
              lesson.groupId.toString() ===
              selectedGroupId
          ),
    [lessons, selectedGroupId]
  );

  const selectedGroup = useMemo(
    () =>
      selectedGroupId === 'all'
        ? null
        : groups.find(
            (group) =>
              group.id.toString() ===
              selectedGroupId
          ) ?? null,
    [groups, selectedGroupId]
  );

  return (
    <div className="card p-6 lg:col-span-2">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Сегодняшние занятия
          </h2>

          {groups.length === 1 && (
            <p className="mt-0.5 text-xs text-gray-400">
              {groups[0].name}
            </p>
          )}

          {groups.length > 1 && (
            <div className="mt-2">
              <label
                htmlFor="dashboard-group"
                className="sr-only"
              >
                Выберите учебную группу
              </label>

              <select
                id="dashboard-group"
                value={selectedGroupId}
                onChange={(event) =>
                  setSelectedGroupId(
                    event.target.value
                  )
                }
                className="min-w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                <option value="all">
                  Все группы
                </option>

                {groups.map((group) => (
                  <option
                    key={group.id}
                    value={group.id.toString()}
                  >
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <Link
          to="/dashboard/schedule"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-red-600 hover:text-red-700"
        >
          Расписание
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading && lessons.length === 0 && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
            <Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-red-500" />
            <p className="text-sm text-gray-500">
              Загружаем расписание…
            </p>
          </div>
        )}

        {!isLoading &&
          !hasError &&
          visibleLessons.length === 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">
                Сегодня занятий нет
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {selectedGroup
                  ? `В группе «${selectedGroup.name}» сегодня нет занятий.`
                  : 'Во всех ваших группах сегодня нет занятий.'}
              </p>
            </div>
          )}

        {!isLoading &&
          visibleLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50"
            >
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-red-50">
                <span className="text-sm font-semibold text-red-600">
                  {formatLessonTime(
                    lesson.startTime
                  )}
                </span>
                <span className="text-[10px] text-red-400">
                  до{' '}
                  {formatLessonTime(
                    lesson.endTime
                  )}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {lesson.title}
                </p>

                {selectedGroupId === 'all' &&
                  groups.length > 1 && (
                    <p className="mt-0.5 text-xs font-medium text-red-500">
                      {lesson.groupName}
                    </p>
                  )}

                <p className="text-xs text-gray-500">
                  {lesson.teacherName}
                  {' · '}
                  {lesson.roomName}
                </p>

                {lesson.description?.trim() && (
                  <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                    {lesson.description}
                  </p>
                )}
              </div>

              <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                {lesson.lessonTypeLabel}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
