import {
  Archive,
  Eye,
  EyeOff,
  FilePlus2,
  Loader2,
  Pencil,
  Send,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';

import type { AcademicGroup } from '../../../../api/academicApi';
import type {
  Homework,
  HomeworkAttachment,
} from '../../../../api/homeworkApi';
import type { LessonSchedule } from '../../../../api/scheduleApi';

interface TeacherHomeworkManagerModalProps {
  isOpen: boolean;
  homeworks: Homework[];
  attachments: Map<number, HomeworkAttachment[]>;
  lessons: LessonSchedule[];
  groups: AcademicGroup[];
  isLoading: boolean;
  actionKey: string | null;
  onClose: () => void;
  onEdit: (homework: Homework) => void;
  onPublishToggle: (homework: Homework) => void;
  onActiveToggle: (homework: Homework) => void;
  onAddAttachment: (homework: Homework) => void;
  onEditAttachment: (
    homework: Homework,
    attachment: HomeworkAttachment
  ) => void;
  onVisibilityToggle: (
    attachment: HomeworkAttachment
  ) => void;
  onDeleteAttachment: (
    attachment: HomeworkAttachment
  ) => void;
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Срок не указан';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function TeacherHomeworkManagerModal({
  isOpen,
  homeworks,
  attachments,
  lessons,
  groups,
  isLoading,
  actionKey,
  onClose,
  onEdit,
  onPublishToggle,
  onActiveToggle,
  onAddAttachment,
  onEditAttachment,
  onVisibilityToggle,
  onDeleteAttachment,
}: TeacherHomeworkManagerModalProps) {
  if (!isOpen) {
    return null;
  }

  const lessonMap = new Map(
    lessons.map((lesson) => [lesson.id, lesson])
  );
  const groupNames = new Map(
    groups.map((group) => [group.id, group.name])
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="homework-manager-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2
              id="homework-manager-title"
              className="text-lg font-bold text-gray-900"
            >
              Управление домашними заданиями
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Редактирование, публикация и вложения.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-72 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          ) : homeworks.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Вы ещё не создали домашних заданий.
            </p>
          ) : (
            <div className="space-y-4">
              {homeworks.map((homework) => {
                const lesson = lessonMap.get(homework.lesson_id);
                const homeworkAttachments =
                  attachments.get(homework.id) ?? [];
                const homeworkBusy = actionKey?.startsWith(
                  `homework-${homework.id}-`
                );

                return (
                  <article
                    key={homework.id}
                    className={`rounded-2xl border p-5 ${
                      homework.is_active
                        ? 'border-gray-100'
                        : 'border-gray-200 bg-gray-50 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {homework.title}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              homework.is_published
                                ? 'bg-green-50 text-green-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {homework.is_published
                              ? 'Опубликовано'
                              : 'Черновик'}
                          </span>
                          {!homework.is_active && (
                            <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                              В архиве
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          {groupNames.get(
                            homework.group_id ??
                              lesson?.group_id ??
                              0
                          ) ?? 'Группа'}
                          {' · '}
                          {lesson?.topic ?? 'Занятие'}
                          {' · '}
                          {formatDate(homework.due_at)}
                          {' · '}
                          {homework.max_score} баллов
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(homework)}
                          disabled={Boolean(homeworkBusy)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Изменить
                        </button>
                        {homework.is_active && (
                          <button
                            type="button"
                            onClick={() =>
                              onPublishToggle(homework)
                            }
                            disabled={Boolean(homeworkBusy)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                          >
                            {homework.is_published ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            {homework.is_published
                              ? 'Снять публикацию'
                              : 'Опубликовать'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onActiveToggle(homework)
                          }
                          disabled={Boolean(homeworkBusy)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {homework.is_active ? (
                            <Archive className="h-3.5 w-3.5" />
                          ) : (
                            <Undo2 className="h-3.5 w-3.5" />
                          )}
                          {homework.is_active
                            ? 'Удалить в архив'
                            : 'Восстановить'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-gray-800">
                          Вложения ({homeworkAttachments.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            onAddAttachment(homework)
                          }
                          disabled={!homework.is_active}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm disabled:opacity-50"
                        >
                          <FilePlus2 className="h-3.5 w-3.5" />
                          Добавить
                        </button>
                      </div>

                      {homeworkAttachments.length === 0 ? (
                        <p className="mt-3 text-sm text-gray-400">
                          Вложений пока нет.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {homeworkAttachments.map(
                            (attachment) => {
                              const attachmentBusy =
                                actionKey?.startsWith(
                                  `attachment-${attachment.id}-`
                                );

                              return (
                                <div
                                  key={attachment.id}
                                  className="flex flex-col gap-3 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="min-w-0">
                                    <a
                                      href={attachment.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block truncate text-sm font-medium text-blue-700 hover:underline"
                                    >
                                      {attachment.title}
                                    </a>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                      {attachment.is_visible
                                        ? 'Видно студентам'
                                        : 'Скрыто от студентов'}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onEditAttachment(
                                          homework,
                                          attachment
                                        )
                                      }
                                      disabled={Boolean(
                                        attachmentBusy
                                      )}
                                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                                      aria-label="Изменить вложение"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onVisibilityToggle(
                                          attachment
                                        )
                                      }
                                      disabled={Boolean(
                                        attachmentBusy
                                      )}
                                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                                      aria-label={
                                        attachment.is_visible
                                          ? 'Скрыть вложение'
                                          : 'Показать вложение'
                                      }
                                    >
                                      {attachment.is_visible ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onDeleteAttachment(
                                          attachment
                                        )
                                      }
                                      disabled={Boolean(
                                        attachmentBusy
                                      )}
                                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                      aria-label="Удалить вложение"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          )}
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
