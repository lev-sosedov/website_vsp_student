import { useMemo, useState } from 'react';
import {
  Loader2,
  X,
} from 'lucide-react';

import type { LessonSchedule } from '../../../../api/scheduleApi';

export interface TeacherMaterialGroupOption {
  id: number;
  name: string;
  lessons: LessonSchedule[];
}

export interface TeacherMaterialFormValues {
  lessonId: number;
  title: string;
  summary: string;
  content: string;
  publishImmediately: boolean;
  file?: File;
}

interface TeacherMaterialFormModalProps {
  mode: 'create' | 'edit';
  groups: TeacherMaterialGroupOption[];
  initialGroupId?: number;
  initialValues?: TeacherMaterialFormValues;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: TeacherMaterialFormValues
  ) => Promise<void>;
}

function formatLessonLabel(
  lesson: LessonSchedule
): string {
  const date = new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  ).format(
    new Date(
      `${lesson.lesson_date}T00:00:00`
    )
  );

  return `${date} · ${
    lesson.topic?.trim() || 'Занятие'
  }`;
}

export default function TeacherMaterialFormModal({
  mode,
  groups,
  initialGroupId,
  initialValues,
  isSaving,
  error,
  onClose,
  onSubmit,
}: TeacherMaterialFormModalProps) {
  const firstGroupId =
    initialGroupId ?? groups[0]?.id ?? 0;

  const [groupId, setGroupId] =
    useState(firstGroupId);

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (group) => group.id === groupId
      ) ?? null,
    [groupId, groups]
  );

  const [lessonId, setLessonId] =
    useState(
      initialValues?.lessonId ??
        selectedGroup?.lessons[0]?.id ??
        0
    );

  const [title, setTitle] = useState(
    initialValues?.title ?? ''
  );

  const [summary, setSummary] = useState(
    initialValues?.summary ?? ''
  );

  const [content, setContent] = useState(
    initialValues?.content ?? ''
  );

  const [file, setFile] = useState<File | undefined>();
  const [fileError, setFileError] = useState<string | null>(null);

  const [
    publishImmediately,
    setPublishImmediately,
  ] = useState(
    initialValues?.publishImmediately ??
      false
  );

  const handleGroupChange = (
    nextGroupId: number
  ) => {
    setGroupId(nextGroupId);

    const nextGroup = groups.find(
      (group) =>
        group.id === nextGroupId
    );

    setLessonId(
      nextGroup?.lessons[0]?.id ?? 0
    );
  };

  const canSubmit =
    lessonId > 0 && title.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-form-title"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-6">
          <div>
            <h2
              id="material-form-title"
              className="text-xl font-bold text-gray-900"
            >
              {mode === 'create'
                ? 'Новый материал'
                : 'Редактирование материала'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Материал будет связан с выбранным занятием.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Закрыть окно"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();

            if (!canSubmit || isSaving) {
              return;
            }

            void onSubmit({
              lessonId,
              title: title.trim(),
              summary: summary.trim(),
              content: content.trim(),
              publishImmediately,
              file,
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Группа
              </span>

              <select
                value={groupId}
                onChange={(event) =>
                  handleGroupChange(
                    Number(event.target.value)
                  )
                }
                disabled={
                  isSaving || mode === 'edit'
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
              >
                {groups.map((group) => (
                  <option
                    key={group.id}
                    value={group.id}
                  >
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Занятие
              </span>

              <select
                value={lessonId}
                onChange={(event) =>
                  setLessonId(
                    Number(event.target.value)
                  )
                }
                disabled={
                  isSaving ||
                  mode === 'edit' ||
                  !selectedGroup
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
              >
                {selectedGroup?.lessons.length ? (
                  selectedGroup.lessons.map(
                    (lesson) => (
                      <option
                        key={lesson.id}
                        value={lesson.id}
                      >
                        {formatLessonLabel(
                          lesson
                        )}
                      </option>
                    )
                  )
                ) : (
                  <option value={0}>
                    В группе нет занятий
                  </option>
                )}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Название
            </span>

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              maxLength={255}
              placeholder="Например: Материалы к занятию «Основы Blender»"
              disabled={isSaving}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
            />
          </label>

          {mode === 'create' && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Файл материала (необязательно)
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.zip,.rar,.7z,.tar,.gz"
                disabled={isSaving}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0];
                  setFileError(null);
                  if (nextFile && nextFile.size > 100 * 1024 * 1024) {
                    setFile(undefined);
                    setFileError('Размер файла не должен превышать 100 МБ');
                    event.target.value = '';
                    return;
                  }
                  setFile(nextFile);
                }}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
              />
              <span className="block text-xs text-gray-500">
                Поддерживаются PDF, Word, Excel, презентации, изображения, видео и архивы.
              </span>
              {file && (
                <span className="block text-xs text-gray-700">
                  Выбран файл: {file.name}
                </span>
              )}
              {fileError && (
                <span className="block text-xs text-red-600">{fileError}</span>
              )}
            </label>
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Краткое описание
            </span>

            <textarea
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              maxLength={1000}
              rows={3}
              placeholder="Что студент найдёт в этом материале"
              disabled={isSaving}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Текст материала
            </span>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              rows={8}
              placeholder="Конспект, инструкция или дополнительная информация"
              disabled={isSaving}
              className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
            />
          </label>

          {mode === 'create' && (
            <label className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(event) =>
                  setPublishImmediately(
                    event.target.checked
                  )
                }
                disabled={isSaving}
                className="mt-0.5 h-4 w-4 accent-red-600"
              />

              <span>
                <span className="block text-sm font-medium text-gray-800">
                  Сразу опубликовать
                </span>

                <span className="mt-1 block text-xs text-gray-500">
                  Студенты увидят материал сразу после создания.
                </span>
              </span>
            </label>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={!canSubmit || isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {mode === 'create'
                ? 'Создать материал'
                : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
