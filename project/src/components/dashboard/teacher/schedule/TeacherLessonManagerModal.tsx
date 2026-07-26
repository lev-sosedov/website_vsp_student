import {
  CalendarClock,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

import type { AcademicGroup } from '../../../../api/academicApi';
import type {
  LessonSchedule,
  Room,
} from '../../../../api/scheduleApi';

interface TeacherLessonManagerModalProps {
  isOpen: boolean;
  lessons: LessonSchedule[];
  groups: AcademicGroup[];
  rooms: Room[];
  isLoading: boolean;
  actionLessonId: number | null;
  onClose: () => void;
  onEdit: (lesson: LessonSchedule) => void;
  onReschedule: (lesson: LessonSchedule) => void;
  onCancel: (lesson: LessonSchedule) => void;
  onComplete: (lesson: LessonSchedule) => void;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

export default function TeacherLessonManagerModal({
  isOpen,
  lessons,
  groups,
  rooms,
  isLoading,
  actionLessonId,
  onClose,
  onEdit,
  onReschedule,
  onCancel,
  onComplete,
}: TeacherLessonManagerModalProps) {
  if (!isOpen) {
    return null;
  }

  const groupNames = new Map(
    groups.map((group) => [group.id, group.name])
  );
  const roomNames = new Map(
    rooms.map((room) => [room.id, room.name])
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-lessons-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2
              id="teacher-lessons-title"
              className="text-lg font-bold text-gray-900"
            >
              Управление занятиями
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Редактирование, перенос, завершение и отмена.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-72 overflow-y-auto p-5">
          {isLoading ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Загружаем занятия…
            </p>
          ) : lessons.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              В выбранном периоде занятий нет.
            </p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => {
                const isFinal =
                  lesson.status === 'cancelled' ||
                  lesson.status === 'completed';
                const isBusy = actionLessonId === lesson.id;

                return (
                  <article
                    key={lesson.id}
                    className="rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {lesson.topic || 'Занятие без темы'}
                          </h3>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {groupNames.get(lesson.group_id) ??
                              'Группа'}
                          </span>
                          {isFinal && (
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                lesson.status === 'completed'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {lesson.status === 'completed'
                                ? 'Завершено'
                                : 'Отменено'}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          {formatDate(lesson.lesson_date)}
                          {' · '}
                          {formatTime(lesson.start_time)}–
                          {formatTime(lesson.end_time)}
                          {' · '}
                          {roomNames.get(lesson.room_id) ??
                            'Кабинет не указан'}
                        </p>
                      </div>

                      {!isFinal && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(lesson)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Изменить
                          </button>
                          <button
                            type="button"
                            onClick={() => onReschedule(lesson)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            Перенести
                          </button>
                          <button
                            type="button"
                            onClick={() => onComplete(lesson)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Завершить
                          </button>
                          <button
                            type="button"
                            onClick={() => onCancel(lesson)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Отменить
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
