import {
  ArchiveRestore,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import type {
  AcademicDirection,
  AcademicModule,
} from '../../../../api/academicApi';
import type { AdminProgramPlanItem } from '../../../../services/adminEducationProgramsService';

export interface AdminEducationPlanFormValues {
  directionId: number;
  name: string;
  durationMonths: number;
  lessonsPerWeek: number;
  moduleIds: number[];
}

interface AdminEducationPlanModalProps {
  isOpen: boolean;
  item: AdminProgramPlanItem | null;
  directions: AcademicDirection[];
  modules: AcademicModule[];
  isSaving: boolean;
  activeAction: string | null;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: AdminEducationPlanFormValues
  ) => Promise<void>;
  onToggleActive: () => Promise<void>;
  onDelete: () => Promise<void>;
}

const inputClassName =
  'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50';

export default function AdminEducationPlanModal({
  isOpen,
  item,
  directions,
  modules,
  isSaving,
  activeAction,
  error,
  onClose,
  onSubmit,
  onToggleActive,
  onDelete,
}: AdminEducationPlanModalProps) {
  const [directionId, setDirectionId] =
    useState('');
  const [name, setName] = useState('');
  const [
    durationMonths,
    setDurationMonths,
  ] = useState('24');
  const [
    lessonsPerWeek,
    setLessonsPerWeek,
  ] = useState('2');
  const [moduleIds, setModuleIds] =
    useState<number[]>([]);
  const [
    selectedModuleId,
    setSelectedModuleId,
  ] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDirectionId(
      item
        ? String(item.plan.direction_id)
        : String(
            directions.find(
              (direction) =>
                direction.is_active !== false
            )?.id ??
              directions[0]?.id ??
              ''
          )
    );
    setName(item?.plan.name ?? '');
    setDurationMonths(
      String(
        item?.plan.duration_months ?? 24
      )
    );
    setLessonsPerWeek(
      String(
        item?.plan.lessons_per_week ?? 2
      )
    );
    setModuleIds(
      item?.modules.map(
        (moduleItem) =>
          moduleItem.link.module_id
      ) ?? []
    );
    setSelectedModuleId('');
  }, [directions, isOpen, item]);

  const moduleById = useMemo(
    () =>
      new Map(
        modules.map((module) => [
          module.id,
          module,
        ])
      ),
    [modules]
  );

  const availableModules = useMemo(
    () =>
      modules.filter(
        (module) =>
          !moduleIds.includes(module.id) &&
          module.is_active !== false
      ),
    [moduleIds, modules]
  );

  if (!isOpen) {
    return null;
  }

  const isBusy =
    isSaving || activeAction !== null;
  const isActive =
    item?.plan.is_active !== false;

  const addModule = () => {
    const moduleId = Number(
      selectedModuleId
    );

    if (
      !Number.isInteger(moduleId) ||
      moduleIds.includes(moduleId)
    ) {
      return;
    }

    setModuleIds((current) => [
      ...current,
      moduleId,
    ]);
    setSelectedModuleId('');
  };

  const moveModule = (
    index: number,
    direction: -1 | 1
  ) => {
    const targetIndex = index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= moduleIds.length
    ) {
      return;
    }

    setModuleIds((current) => {
      const next = [...current];
      const [movedModule] = next.splice(
        index,
        1
      );

      next.splice(
        targetIndex,
        0,
        movedModule
      );

      return next;
    });
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    void onSubmit({
      directionId: Number(directionId),
      name: name.trim(),
      durationMonths: Number(
        durationMonths
      ),
      lessonsPerWeek: Number(
        lessonsPerWeek
      ),
      moduleIds,
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
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {item
                  ? 'Управление учебным планом'
                  : 'Создание учебного плана'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Настройте срок обучения,
                интенсивность и порядок
                модулей.
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
          className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {directions.length === 0 && (
            <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Сначала создайте направление
              обучения на вкладке
              «Направления».
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-gray-700">
                Направление
              </span>
              <select
                value={directionId}
                onChange={(event) =>
                  setDirectionId(
                    event.target.value
                  )
                }
                className={inputClassName}
                required
                disabled={isBusy}
              >
                <option value="">
                  Выберите направление
                </option>
                {directions.map(
                  (direction) => (
                    <option
                      key={direction.id}
                      value={direction.id}
                      disabled={
                        direction.is_active ===
                          false &&
                        direction.id !==
                          item?.plan.direction_id
                      }
                    >
                      {direction.name}
                      {direction.is_active ===
                      false
                        ? ' — закрыто'
                        : ''}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Название плана
              </span>
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className={inputClassName}
                placeholder="Базовый курс 36 месяцев"
                maxLength={150}
                required
                disabled={isBusy}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Продолжительность, месяцев
              </span>
              <input
                type="number"
                min={1}
                max={120}
                step={1}
                value={durationMonths}
                onChange={(event) =>
                  setDurationMonths(
                    event.target.value
                  )
                }
                className={inputClassName}
                required
                disabled={isBusy}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Занятий в неделю
              </span>
              <input
                type="number"
                min={1}
                max={14}
                step={1}
                value={lessonsPerWeek}
                onChange={(event) =>
                  setLessonsPerWeek(
                    event.target.value
                  )
                }
                className={inputClassName}
                required
                disabled={isBusy}
              />
            </label>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <div>
              <h3 className="font-semibold text-gray-900">
                Последовательность модулей
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Модули будут проходиться
                сверху вниз.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedModuleId}
                onChange={(event) =>
                  setSelectedModuleId(
                    event.target.value
                  )
                }
                className={`${inputClassName} mt-0 flex-1`}
                disabled={
                  isBusy ||
                  availableModules.length ===
                    0
                }
              >
                <option value="">
                  {availableModules.length
                    ? 'Выберите модуль'
                    : 'Все активные модули уже добавлены'}
                </option>
                {availableModules.map(
                  (module) => (
                    <option
                      key={module.id}
                      value={module.id}
                    >
                      {module.name}
                    </option>
                  )
                )}
              </select>
              <button
                type="button"
                onClick={addModule}
                disabled={
                  isBusy ||
                  !selectedModuleId
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Добавить
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-gray-100">
              {moduleIds.length === 0 ? (
                <div className="flex min-h-28 items-center justify-center p-4 text-center text-sm text-gray-400">
                  Модули пока не добавлены
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {moduleIds.map(
                    (moduleId, index) => {
                      const module =
                        moduleById.get(
                          moduleId
                        );

                      return (
                        <div
                          key={moduleId}
                          className="flex items-center gap-3 p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {module?.name ??
                                `Модуль №${moduleId}`}
                            </p>
                            {module?.is_active ===
                              false && (
                              <p className="text-xs text-amber-600">
                                Модуль закрыт
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                moveModule(
                                  index,
                                  -1
                                )
                              }
                              disabled={
                                isBusy ||
                                index === 0
                              }
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30"
                              aria-label="Переместить выше"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                moveModule(
                                  index,
                                  1
                                )
                              }
                              disabled={
                                isBusy ||
                                index ===
                                  moduleIds.length -
                                    1
                              }
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30"
                              aria-label="Переместить ниже"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setModuleIds(
                                  (current) =>
                                    current.filter(
                                      (id) =>
                                        id !==
                                        moduleId
                                    )
                                )
                              }
                              disabled={isBusy}
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                              aria-label="Удалить из плана"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>

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
                    ? 'Закрыть план'
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
                  Удалить план
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={
                isBusy ||
                !directionId ||
                !name.trim() ||
                Number(durationMonths) < 1 ||
                Number(lessonsPerWeek) < 1
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {item
                ? 'Сохранить программу'
                : 'Создать программу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

