import { useState } from 'react';
import {
  Loader2,
  X,
} from 'lucide-react';

export type TeacherResourceKind =
  | 'attachment'
  | 'link';

export interface TeacherMaterialResourceValues {
  title: string;
  url: string;
  description: string;
  attachmentType: string;
  sortOrder: number;
  isVisible: boolean;
}

interface TeacherMaterialResourceModalProps {
  kind: TeacherResourceKind;
  mode: 'create' | 'edit';
  initialValues?: TeacherMaterialResourceValues;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: TeacherMaterialResourceValues
  ) => Promise<void>;
}

const ATTACHMENT_TYPES = [
  {
    value: 'document',
    label: 'Документ',
  },
  {
    value: 'presentation',
    label: 'Презентация',
  },
  {
    value: 'image',
    label: 'Изображение',
  },
  {
    value: 'video',
    label: 'Видео',
  },
  {
    value: 'audio',
    label: 'Аудио',
  },
  {
    value: 'archive',
    label: 'Архив',
  },
  {
    value: 'code',
    label: 'Код',
  },
  {
    value: 'other',
    label: 'Другое',
  },
] as const;

export default function TeacherMaterialResourceModal({
  kind,
  mode,
  initialValues,
  isSaving,
  error,
  onClose,
  onSubmit,
}: TeacherMaterialResourceModalProps) {
  const [title, setTitle] = useState(
    initialValues?.title ?? ''
  );

  const [url, setUrl] = useState(
    initialValues?.url ?? ''
  );

  const [description, setDescription] =
    useState(
      initialValues?.description ?? ''
    );

  const [
    attachmentType,
    setAttachmentType,
  ] = useState(
    initialValues?.attachmentType ??
      'document'
  );

  const [sortOrder, setSortOrder] =
    useState(
      initialValues?.sortOrder ?? 0
    );

  const [isVisible, setIsVisible] =
    useState(
      initialValues?.isVisible ?? true
    );

  const resourceName =
    kind === 'attachment'
      ? 'вложение'
      : 'ссылку';

  const canSubmit =
    title.trim().length > 0 &&
    url.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-form-title"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-6">
          <div>
            <h2
              id="resource-form-title"
              className="text-xl font-bold text-gray-900"
            >
              {mode === 'create'
                ? `Добавить ${resourceName}`
                : `Изменить ${resourceName}`}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {kind === 'attachment'
                ? 'Укажите готовую ссылку на файл.'
                : 'Добавьте полезный ресурс для студентов.'}
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
              title: title.trim(),
              url: url.trim(),
              description:
                description.trim(),
              attachmentType,
              sortOrder: Math.max(
                0,
                sortOrder
              ),
              isVisible,
            });
          }}
        >
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
              placeholder={
                kind === 'attachment'
                  ? 'Например: Презентация к уроку'
                  : 'Например: Документация Blender'
              }
              disabled={isSaving}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              {kind === 'attachment'
                ? 'Ссылка на файл'
                : 'Адрес ссылки'}
            </span>

            <input
              type="url"
              value={url}
              onChange={(event) =>
                setUrl(event.target.value)
              }
              maxLength={3000}
              placeholder="https://..."
              disabled={isSaving}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
            />
          </label>

          {kind === 'attachment' ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Тип файла
              </span>

              <select
                value={attachmentType}
                onChange={(event) =>
                  setAttachmentType(
                    event.target.value
                  )
                }
                disabled={isSaving}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
              >
                {ATTACHMENT_TYPES.map(
                  (type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  )
                )}
              </select>
            </label>
          ) : (
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Описание
              </span>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                maxLength={2000}
                rows={4}
                placeholder="Краткое пояснение к ссылке"
                disabled={isSaving}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
              />
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Порядок
              </span>

              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    Number(event.target.value) ||
                      0
                  )
                }
                disabled={isSaving}
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 sm:self-end">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(event) =>
                  setIsVisible(
                    event.target.checked
                  )
                }
                disabled={isSaving}
                className="h-4 w-4 accent-red-600"
              />

              <span className="text-sm font-medium text-gray-700">
                Видно студентам
              </span>
            </label>
          </div>

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
                ? 'Добавить'
                : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
