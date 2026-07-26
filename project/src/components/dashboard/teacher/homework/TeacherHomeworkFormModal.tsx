import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  BookOpen,
  Loader2,
  X,
} from 'lucide-react';

import type { AcademicGroup } from '../../../../api/academicApi';
import type {
  CreateHomeworkData,
  Homework,
} from '../../../../api/homeworkApi';
import type { LessonSchedule } from '../../../../api/scheduleApi';

interface TeacherHomeworkFormModalProps {
  isOpen: boolean;
  homework: Homework | null;
  teacherId: number;
  lessons: LessonSchedule[];
  groups: AcademicGroup[];
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: CreateHomeworkData) => Promise<void>;
}

function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function lessonLabel(
  lesson: LessonSchedule,
  groups: Map<number, string>
): string {
  const date = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(
    new Date(`${lesson.lesson_date}T00:00:00`)
  );

  return `${groups.get(lesson.group_id) ?? 'Группа'} · ${date} · ${lesson.start_time.slice(0, 5)} · ${lesson.topic ?? 'Без темы'}`;
}

export default function TeacherHomeworkFormModal({
  isOpen,
  homework,
  teacherId,
  lessons,
  groups,
  isSaving,
  error,
  onClose,
  onSubmit,
}: TeacherHomeworkFormModalProps) {
  const [lessonId, setLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [dueAt, setDueAt] = useState('');
  const [allowLate, setAllowLate] = useState(true);
  const [publishNow, setPublishNow] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLessonId(
      String(homework?.lesson_id ?? lessons[0]?.id ?? '')
    );
    setTitle(homework?.title ?? '');
    setDescription(homework?.description ?? '');
    setInstructions(homework?.instructions ?? '');
    setMaxScore(String(homework?.max_score ?? 100));
    setDueAt(toDateTimeLocal(homework?.due_at ?? null));
    setAllowLate(
      homework?.allow_late_submission ?? true
    );
    setPublishNow(homework?.is_published ?? false);
  }, [homework, isOpen, lessons]);

  if (!isOpen) {
    return null;
  }

  const groupNames = new Map(
    groups.map((group) => [group.id, group.name])
  );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await onSubmit({
      lesson_id: Number(lessonId),
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim() || null,
      max_score: Number(maxScore),
      due_at: dueAt
        ? new Date(dueAt).toISOString()
        : null,
      allow_late_submission: allowLate,
      created_by: teacherId,
      is_published: publishNow,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-homework-form-title"
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="teacher-homework-form-title"
                className="text-lg font-bold text-gray-900"
              >
                {homework
                  ? 'Изменить домашнее задание'
                  : 'Создать домашнее задание'}
              </h2>
              <p className="text-sm text-gray-500">
                Задание привязывается к конкретному занятию.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-5 overflow-y-auto p-6 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Занятие
            </span>
            <select
              required
              value={lessonId}
              onChange={(event) =>
                setLessonId(event.target.value)
              }
              disabled={Boolean(homework)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="" disabled>
                Выберите занятие
              </option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lessonLabel(lesson, groupNames)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Название
            </span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              placeholder="Например: Домашняя работа по основам Python"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Описание задания
            </span>
            <textarea
              required
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              maxLength={10000}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Дополнительные инструкции
            </span>
            <textarea
              value={instructions}
              onChange={(event) =>
                setInstructions(event.target.value)
              }
              rows={3}
              maxLength={10000}
              placeholder="Необязательно"
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Максимальный балл
            </span>
            <input
              required
              type="number"
              min="1"
              max="10000"
              value={maxScore}
              onChange={(event) =>
                setMaxScore(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Срок сдачи
            </span>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
            <input
              type="checkbox"
              checked={allowLate}
              onChange={(event) =>
                setAllowLate(event.target.checked)
              }
              className="h-4 w-4 accent-red-600"
            />
            <span className="text-sm text-gray-700">
              Разрешить сдачу после срока
            </span>
          </label>

          {!homework && (
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(event) =>
                  setPublishNow(event.target.checked)
                }
                className="h-4 w-4 accent-red-600"
              />
              <span className="text-sm text-gray-700">
                Сразу опубликовать студентам
              </span>
            </label>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={
              isSaving ||
              !lessonId ||
              !title.trim() ||
              !description.trim() ||
              Number(maxScore) < 1
            }
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-gray-300"
          >
            {isSaving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {homework ? 'Сохранить' : 'Создать задание'}
          </button>
        </footer>
      </form>
    </div>
  );
}
