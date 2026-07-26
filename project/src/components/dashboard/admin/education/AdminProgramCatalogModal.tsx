import {
  ArchiveRestore,
  Boxes,
  Compass,
  Loader2,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import type {
  AcademicDirection,
  AcademicModule,
} from '../../../../api/academicApi';

export type ProgramCatalogKind =
  | 'direction'
  | 'module';

export interface ProgramCatalogFormValues {
  name: string;
  description: string | null;
}

interface AdminProgramCatalogModalProps {
  isOpen: boolean;
  kind: ProgramCatalogKind;
  item:
    | AcademicDirection
    | AcademicModule
    | null;
  isSaving: boolean;
  activeAction: string | null;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: ProgramCatalogFormValues
  ) => Promise<void>;
  onToggleActive: () => Promise<void>;
  onDelete: () => Promise<void>;
}

const inputClassName =
  'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50';

export default function AdminProgramCatalogModal({
  isOpen,
  kind,
  item,
  isSaving,
  activeAction,
  error,
  onClose,
  onSubmit,
  onToggleActive,
  onDelete,
}: AdminProgramCatalogModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] =
    useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(item?.name ?? '');
    setDescription(
      item?.description ?? ''
    );
  }, [isOpen, item]);

  if (!isOpen) {
    return null;
  }

  const isBusy =
    isSaving || activeAction !== null;
  const isActive =
    item?.is_active !== false;
  const isDirection =
    kind === 'direction';
  const EntityIcon = isDirection
    ? Compass
    : Boxes;
  const entityLabel = isDirection
    ? 'направление'
    : 'модуль';

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    void onSubmit({
      name: name.trim(),
      description:
        description.trim() || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-3 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !isBusy
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <EntityIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {item
                  ? `Изменить ${entityLabel}`
                  : `Создать ${entityLabel}`}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isDirection
                  ? 'Область обучения, объединяющая учебные планы.'
                  : 'Тематический этап, который можно включать в разные планы.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Закрыть окно"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label>
            <span className="text-sm font-medium text-gray-700">
              Название
            </span>
            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className={inputClassName}
              maxLength={150}
              required
              disabled={isBusy}
            />
          </label>

          <label className="mt-4 block">
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
              className={`${inputClassName} min-h-28 resize-y`}
              placeholder="Необязательно"
              disabled={isBusy}
            />
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {item && (
                <button
                  type="button"
                  onClick={() =>
                    void onToggleActive()
                  }
                  disabled={isBusy}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    isActive
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {activeAction ===
                  'toggle' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArchiveRestore className="h-4 w-4" />
                  )}
                  {isActive
                    ? 'Закрыть'
                    : 'Восстановить'}
                </button>
              )}

              {item && (
                <button
                  type="button"
                  onClick={() =>
                    void onDelete()
                  }
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {activeAction ===
                  'delete' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Удалить
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={
                isBusy || !name.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {item
                ? 'Сохранить изменения'
                : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

