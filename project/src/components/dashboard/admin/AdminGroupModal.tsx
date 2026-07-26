import {
  ArchiveRestore,
  Loader2,
  LockKeyhole,
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
  AcademicBranch,
  AcademicBranchAddress,
  AcademicDirection,
  AcademicEducationPlan,
} from '../../../api/academicApi';

import type { UserProfile } from '../../../api/userApi';

import {
  getAdminGroupBranchName,
  getAdminGroupTeacherName,
  type AdminGroupItem,
} from '../../../services/adminGroupsService';

export interface AdminGroupFormValues {
  name: string;
  branchId: number;
  directionId: number;
  educationPlanId: number;
  teacherId: number | null;
  startDate: string;
  endDate: string;
}

interface AdminGroupModalProps {
  isOpen: boolean;
  item: AdminGroupItem | null;
  branches: AcademicBranch[];
  branchAddresses: AcademicBranchAddress[];
  directions: AcademicDirection[];
  educationPlans: AcademicEducationPlan[];
  teachers: UserProfile[];
  isSaving: boolean;
  activeAction: string | null;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: AdminGroupFormValues
  ) => Promise<void>;
  onCloseGroup: () => Promise<void>;
  onRestoreGroup: () => Promise<void>;
  onDeleteGroup: () => Promise<void>;
}

function toDateInputValue(
  value: string | null | undefined
): string {
  return value?.slice(0, 10) ?? '';
}

const inputClassName =
  'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50';

export default function AdminGroupModal({
  isOpen,
  item,
  branches,
  branchAddresses,
  directions,
  educationPlans,
  teachers,
  isSaving,
  activeAction,
  error,
  onClose,
  onSubmit,
  onCloseGroup,
  onRestoreGroup,
  onDeleteGroup,
}: AdminGroupModalProps) {
  const [name, setName] = useState('');
  const [branchId, setBranchId] =
    useState('');
  const [directionId, setDirectionId] =
    useState('');
  const [
    educationPlanId,
    setEducationPlanId,
  ] = useState('');
  const [teacherId, setTeacherId] =
    useState('');
  const [startDate, setStartDate] =
    useState('');
  const [endDate, setEndDate] =
    useState('');

  const isBusy =
    isSaving || activeAction !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(item?.group.name ?? '');
    setBranchId(
      item?.group.branch_id
        ? String(item.group.branch_id)
        : String(branches[0]?.id ?? '')
    );
    setDirectionId(
      item?.group.direction_id
        ? String(item.group.direction_id)
        : String(directions[0]?.id ?? '')
    );
    setEducationPlanId(
      item?.group.education_plan_id
        ? String(
            item.group.education_plan_id
          )
        : ''
    );
    setTeacherId(
      item?.teacher?.id
        ? String(item.teacher.id)
        : ''
    );
    setStartDate(
      toDateInputValue(
        item?.group.start_date
      )
    );
    setEndDate(
      toDateInputValue(item?.group.end_date)
    );
  }, [
    branches,
    directions,
    isOpen,
    item,
  ]);

  const filteredPlans = useMemo(() => {
    const selectedDirectionId = Number(
      directionId
    );

    return educationPlans.filter(
      (plan) =>
        !plan.direction_id ||
        plan.direction_id ===
          selectedDirectionId
    );
  }, [directionId, educationPlans]);

  useEffect(() => {
    if (
      !isOpen ||
      filteredPlans.some(
        (plan) =>
          String(plan.id) ===
          educationPlanId
      )
    ) {
      return;
    }

    setEducationPlanId(
      String(filteredPlans[0]?.id ?? '')
    );
  }, [
    educationPlanId,
    filteredPlans,
    isOpen,
  ]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    void onSubmit({
      name: name.trim(),
      branchId: Number(branchId),
      directionId: Number(directionId),
      educationPlanId: Number(
        educationPlanId
      ),
      teacherId: teacherId
        ? Number(teacherId)
        : null,
      startDate,
      endDate,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-group-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isBusy
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="admin-group-title"
              className="text-lg font-bold text-gray-900"
            >
              {item
                ? 'Управление группой'
                : 'Создание группы'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {item
                ? `${item.group.name} · студентов: ${item.studentCount}`
                : 'Заполните основные данные и назначьте преподавателя'}
            </p>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Название группы
              </span>
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className={inputClassName}
                placeholder="Например, Blender 2026"
                required
                disabled={isBusy}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Филиал
              </span>
              <select
                value={branchId}
                onChange={(event) =>
                  setBranchId(
                    event.target.value
                  )
                }
                className={inputClassName}
                required
                disabled={isBusy}
              >
                <option value="" disabled>
                  Выберите филиал
                </option>
                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {getAdminGroupBranchName(
                      branch,
                      branchAddresses
                    )}
                  </option>
                ))}
              </select>
            </label>

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
                <option value="" disabled>
                  Выберите направление
                </option>
                {directions.map((direction) => (
                  <option
                    key={direction.id}
                    value={direction.id}
                  >
                    {direction.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Учебный план
              </span>
              <select
                value={educationPlanId}
                onChange={(event) =>
                  setEducationPlanId(
                    event.target.value
                  )
                }
                className={inputClassName}
                required
                disabled={isBusy}
              >
                <option value="" disabled>
                  Выберите учебный план
                </option>
                {filteredPlans.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name ??
                      plan.title ??
                      `План №${plan.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Преподаватель
              </span>
              <select
                value={teacherId}
                onChange={(event) =>
                  setTeacherId(
                    event.target.value
                  )
                }
                className={inputClassName}
                disabled={isBusy}
              >
                <option value="">
                  Не назначен
                </option>
                {teachers.map((teacher) => (
                  <option
                    key={teacher.id}
                    value={teacher.id}
                  >
                    {getAdminGroupTeacherName(
                      teacher
                    )}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Дата начала обучения
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
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
                Дата окончания
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
                className={inputClassName}
                disabled={isBusy}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {item &&
                item.group.is_active !==
                  false && (
                  <button
                    type="button"
                    onClick={() =>
                      void onCloseGroup()
                    }
                    disabled={isBusy}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    {activeAction === 'close' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LockKeyhole className="h-4 w-4" />
                    )}
                    Закрыть группу
                  </button>
                )}

              {item &&
                item.group.is_active ===
                  false && (
                  <button
                    type="button"
                    onClick={() =>
                      void onRestoreGroup()
                    }
                    disabled={isBusy}
                    className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                  >
                    {activeAction ===
                    'restore' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArchiveRestore className="h-4 w-4" />
                    )}
                    Восстановить
                  </button>
                )}

              {item && (
                <button
                  type="button"
                  onClick={() =>
                    void onDeleteGroup()
                  }
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {activeAction === 'delete' ? (
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
                isBusy ||
                !name.trim() ||
                !branchId ||
                !directionId ||
                !educationPlanId ||
                !startDate
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
                : 'Создать группу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
