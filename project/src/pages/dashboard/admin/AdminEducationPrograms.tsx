import {
  AlertCircle,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  Compass,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  addEducationPlanModule,
  createDirection,
  createEducationPlan,
  createModule,
  deleteDirection,
  deleteEducationPlan,
  deleteModule,
  removeEducationPlanModule,
  reorderEducationPlanModules,
  updateDirection,
  updateEducationPlan,
  updateModule,
  type AcademicDirection,
  type AcademicModule,
} from '../../../api/academicApi';

import AdminEducationPlanModal, {
  type AdminEducationPlanFormValues,
} from '../../../components/dashboard/admin/education/AdminEducationPlanModal';
import AdminProgramCatalogModal, {
  type ProgramCatalogFormValues,
  type ProgramCatalogKind,
} from '../../../components/dashboard/admin/education/AdminProgramCatalogModal';

import {
  EMPTY_EDUCATION_PROGRAMS_DATA,
  loadAdminEducationPrograms,
  type AdminEducationProgramsData,
  type AdminProgramPlanItem,
} from '../../../services/adminEducationProgramsService';

type ProgramTab =
  | 'plans'
  | 'directions'
  | 'modules';

function getErrorMessage(
  error: unknown
): string {
  if (!(error instanceof Error)) {
    return 'Не удалось выполнить операцию';
  }

  try {
    const parsed = JSON.parse(
      error.message
    ) as {
      detail?: string;
    };

    return parsed.detail ?? error.message;
  } catch {
    return error.message;
  }
}

function formatDate(
  value: string | null | undefined
): string {
  if (!value) {
    return 'Не указана';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

const tabItems: Array<{
  id: ProgramTab;
  label: string;
}> = [
  {
    id: 'plans',
    label: 'Учебные планы',
  },
  {
    id: 'directions',
    label: 'Направления',
  },
  {
    id: 'modules',
    label: 'Модули',
  },
];

const statusBadge = (
  isActive: boolean
) => (
  <span
    className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
      isActive
        ? 'bg-green-50 text-green-700'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    {isActive ? 'Активен' : 'Закрыт'}
  </span>
);

export default function AdminEducationPrograms() {
  const [data, setData] =
    useState<AdminEducationProgramsData>(
      EMPTY_EDUCATION_PROGRAMS_DATA
    );
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<ProgramTab>('plans');
  const [searchValue, setSearchValue] =
    useState('');
  const [statusFilter, setStatusFilter] =
    useState('all');
  const [
    directionFilter,
    setDirectionFilter,
  ] = useState('all');

  const [isPlanModalOpen, setIsPlanModalOpen] =
    useState(false);
  const [selectedPlan, setSelectedPlan] =
    useState<AdminProgramPlanItem | null>(
      null
    );
  const [
    catalogModalKind,
    setCatalogModalKind,
  ] = useState<ProgramCatalogKind | null>(
    null
  );
  const [
    selectedCatalogItem,
    setSelectedCatalogItem,
  ] = useState<
    AcademicDirection | AcademicModule | null
  >(null);

  const [isSaving, setIsSaving] =
    useState(false);
  const [activeAction, setActiveAction] =
    useState<string | null>(null);
  const [modalError, setModalError] =
    useState<string | null>(null);

  const loadPrograms =
    useCallback(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedData =
          await loadAdminEducationPrograms();

        setData(loadedData);
        return loadedData;
      } catch (loadError) {
        setData(
          EMPTY_EDUCATION_PROGRAMS_DATA
        );
        setError(
          getErrorMessage(loadError)
        );
        return EMPTY_EDUCATION_PROGRAMS_DATA;
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timerId = window.setTimeout(
      () => setSuccessMessage(null),
      4_000
    );

    return () =>
      window.clearTimeout(timerId);
  }, [successMessage]);

  const normalizedSearch =
    searchValue.trim().toLowerCase();

  const filteredPlans = useMemo(
    () =>
      data.planItems.filter((item) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            item.plan.name,
            item.direction?.name,
            ...item.modules.map(
              (moduleItem) =>
                moduleItem.module?.name
            ),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active'
            ? item.plan.is_active !== false
            : item.plan.is_active === false);

        const matchesDirection =
          directionFilter === 'all' ||
          String(item.plan.direction_id) ===
            directionFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDirection
        );
      }),
    [
      data.planItems,
      directionFilter,
      normalizedSearch,
      statusFilter,
    ]
  );

  const filteredDirections = useMemo(
    () =>
      data.directionItems.filter(
        (item) => {
          const matchesSearch =
            !normalizedSearch ||
            [
              item.direction.name,
              item.direction.description,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(normalizedSearch);

          const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active'
              ? item.direction
                  .is_active !== false
              : item.direction
                  .is_active === false);

          return (
            matchesSearch && matchesStatus
          );
        }
      ),
    [
      data.directionItems,
      normalizedSearch,
      statusFilter,
    ]
  );

  const filteredModules = useMemo(
    () =>
      data.moduleItems.filter((item) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            item.module.name,
            item.module.description,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active'
            ? item.module.is_active !== false
            : item.module.is_active === false);

        return (
          matchesSearch && matchesStatus
        );
      }),
    [
      data.moduleItems,
      normalizedSearch,
      statusFilter,
    ]
  );

  const closeModals = () => {
    setIsPlanModalOpen(false);
    setSelectedPlan(null);
    setCatalogModalKind(null);
    setSelectedCatalogItem(null);
    setModalError(null);
    setActiveAction(null);
  };

  const openCreate = () => {
    setModalError(null);

    if (activeTab === 'plans') {
      setSelectedPlan(null);
      setIsPlanModalOpen(true);
      return;
    }

    setSelectedCatalogItem(null);
    setCatalogModalKind(
      activeTab === 'directions'
        ? 'direction'
        : 'module'
    );
  };

  const refreshSelectedPlan = async (
    planId: number
  ) => {
    const loadedData =
      await loadPrograms();
    const refreshedPlan =
      loadedData.planItems.find(
        (item) => item.plan.id === planId
      ) ?? null;

    setSelectedPlan(refreshedPlan);
  };

  const syncPlanModules = async (
    planId: number,
    previousModuleIds: number[],
    nextModuleIds: number[]
  ) => {
    const removedIds =
      previousModuleIds.filter(
        (moduleId) =>
          !nextModuleIds.includes(moduleId)
      );
    const addedIds = nextModuleIds.filter(
      (moduleId) =>
        !previousModuleIds.includes(moduleId)
    );

    for (const moduleId of removedIds) {
      await removeEducationPlanModule(
        planId,
        moduleId
      );
    }

    for (const moduleId of addedIds) {
      await addEducationPlanModule({
        education_plan_id: planId,
        module_id: moduleId,
        order_number:
          nextModuleIds.indexOf(moduleId) +
          1,
      });
    }

    if (nextModuleIds.length > 0) {
      await reorderEducationPlanModules(
        planId,
        nextModuleIds
      );
    }
  };

  const submitPlan = async (
    values: AdminEducationPlanFormValues
  ) => {
    setIsSaving(true);
    setModalError(null);

    try {
      const payload = {
        direction_id: values.directionId,
        name: values.name,
        duration_months:
          values.durationMonths,
        lessons_per_week:
          values.lessonsPerWeek,
      };

      if (selectedPlan) {
        await updateEducationPlan(
          selectedPlan.plan.id,
          payload
        );
        await syncPlanModules(
          selectedPlan.plan.id,
          selectedPlan.modules.map(
            (item) => item.link.module_id
          ),
          values.moduleIds
        );
        setSuccessMessage(
          'Учебный план обновлён'
        );
      } else {
        const createdPlan =
          await createEducationPlan(payload);

        for (
          let index = 0;
          index < values.moduleIds.length;
          index += 1
        ) {
          await addEducationPlanModule({
            education_plan_id:
              createdPlan.id,
            module_id:
              values.moduleIds[index],
            order_number: index + 1,
          });
        }

        setSuccessMessage(
          'Учебный план создан'
        );
      }

      closeModals();
      await loadPrograms();
    } catch (saveError) {
      setModalError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlan = async () => {
    if (!selectedPlan) {
      return;
    }

    setActiveAction('toggle');
    setModalError(null);

    try {
      const nextActive =
        selectedPlan.plan.is_active ===
        false;

      await updateEducationPlan(
        selectedPlan.plan.id,
        {
          is_active: nextActive,
        }
      );
      setSuccessMessage(
        nextActive
          ? 'Учебный план восстановлен'
          : 'Учебный план закрыт'
      );
      await refreshSelectedPlan(
        selectedPlan.plan.id
      );
    } catch (toggleError) {
      setModalError(
        getErrorMessage(toggleError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const removePlan = async () => {
    if (!selectedPlan) {
      return;
    }

    if (
      !window.confirm(
        `Удалить учебный план «${selectedPlan.plan.name}»? Удаление возможно только при отсутствии связанных групп и модулей.`
      )
    ) {
      return;
    }

    setActiveAction('delete');
    setModalError(null);

    try {
      await deleteEducationPlan(
        selectedPlan.plan.id
      );
      setSuccessMessage(
        'Учебный план удалён'
      );
      closeModals();
      await loadPrograms();
    } catch (deleteError) {
      setModalError(
        getErrorMessage(deleteError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const submitCatalog = async (
    values: ProgramCatalogFormValues
  ) => {
    if (!catalogModalKind) {
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      if (
        catalogModalKind === 'direction'
      ) {
        if (selectedCatalogItem) {
          await updateDirection(
            selectedCatalogItem.id,
            values
          );
          setSuccessMessage(
            'Направление обновлено'
          );
        } else {
          await createDirection(values);
          setSuccessMessage(
            'Направление создано'
          );
        }
      } else if (selectedCatalogItem) {
        await updateModule(
          selectedCatalogItem.id,
          values
        );
        setSuccessMessage(
          'Модуль обновлён'
        );
      } else {
        await createModule(values);
        setSuccessMessage('Модуль создан');
      }

      closeModals();
      await loadPrograms();
    } catch (saveError) {
      setModalError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCatalog = async () => {
    if (
      !catalogModalKind ||
      !selectedCatalogItem
    ) {
      return;
    }

    setActiveAction('toggle');
    setModalError(null);

    try {
      const nextActive =
        selectedCatalogItem.is_active ===
        false;

      if (
        catalogModalKind === 'direction'
      ) {
        await updateDirection(
          selectedCatalogItem.id,
          {
            is_active: nextActive,
          }
        );
      } else {
        await updateModule(
          selectedCatalogItem.id,
          {
            is_active: nextActive,
          }
        );
      }

      setSuccessMessage(
        nextActive
          ? 'Объект восстановлен'
          : 'Объект закрыт'
      );
      closeModals();
      await loadPrograms();
    } catch (toggleError) {
      setModalError(
        getErrorMessage(toggleError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const removeCatalog = async () => {
    if (
      !catalogModalKind ||
      !selectedCatalogItem
    ) {
      return;
    }

    const label =
      catalogModalKind === 'direction'
        ? 'направление'
        : 'модуль';

    if (
      !window.confirm(
        `Удалить ${label} «${selectedCatalogItem.name}»? Связанный объект backend удалить не позволит.`
      )
    ) {
      return;
    }

    setActiveAction('delete');
    setModalError(null);

    try {
      if (
        catalogModalKind === 'direction'
      ) {
        await deleteDirection(
          selectedCatalogItem.id
        );
      } else {
        await deleteModule(
          selectedCatalogItem.id
        );
      }

      setSuccessMessage(
        `${
          catalogModalKind === 'direction'
            ? 'Направление'
            : 'Модуль'
        } удалён`
      );
      closeModals();
      await loadPrograms();
    } catch (deleteError) {
      setModalError(
        getErrorMessage(deleteError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const createButtonLabel =
    activeTab === 'plans'
      ? 'Создать учебный план'
      : activeTab === 'directions'
        ? 'Создать направление'
        : 'Создать модуль';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Учебные программы
          </h1>
          <p className="mt-1 text-gray-500">
            Направления, учебные планы и
            последовательность модулей
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={
            isLoading ||
            (activeTab === 'plans' &&
              data.directions.length === 0)
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Plus className="h-4 w-4" />
          {createButtonLabel}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {data.plans.length}
              </p>
              <p className="text-xs text-gray-500">
                Учебных планов
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {data.directions.length}
              </p>
              <p className="text-xs text-gray-500">
                Направлений
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {data.modules.length}
              </p>
              <p className="text-xs text-gray-500">
                Модулей
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {
                  data.plans.filter(
                    (plan) =>
                      plan.is_active !== false
                  ).length
                }
              </p>
              <p className="text-xs text-gray-500">
                Активных планов
              </p>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-5 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              Не удалось загрузить учебные
              программы
            </p>
            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex w-full rounded-xl bg-gray-100 p-1 xl:w-auto">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchValue('');
                    setStatusFilter('all');
                    setDirectionFilter('all');
                  }}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition xl:flex-none ${
                    activeTab === tab.id
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-64 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  placeholder={
                    activeTab === 'plans'
                      ? 'План, направление или модуль'
                      : 'Название или описание'
                  }
                />
              </label>

              {activeTab === 'plans' && (
                <select
                  value={directionFilter}
                  onChange={(event) =>
                    setDirectionFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                >
                  <option value="all">
                    Все направления
                  </option>
                  {data.directions.map(
                    (direction) => (
                      <option
                        key={direction.id}
                        value={direction.id}
                      >
                        {direction.name}
                      </option>
                    )
                  )}
                </select>
              )}

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              >
                <option value="all">
                  Все статусы
                </option>
                <option value="active">
                  Активные
                </option>
                <option value="closed">
                  Закрытые
                </option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : activeTab === 'plans' ? (
          <div className="max-h-[610px] overflow-auto">
            <table className="min-w-[980px] w-full text-left">
              <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Учебный план
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Направление
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Обучение
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Модули
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Группы
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Статус
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlans.map((item) => (
                  <tr
                    key={item.plan.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {item.plan.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Создан{' '}
                        {formatDate(
                          item.plan.created_at
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {item.direction?.name ??
                        'Не указано'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      <p>
                        {
                          item.plan
                            .duration_months
                        }{' '}
                        месяцев
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {
                          item.plan
                            .lessons_per_week
                        }{' '}
                        занятий в неделю
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1.5">
                        {item.modules.length ===
                        0 ? (
                          <span className="text-sm text-gray-400">
                            Не добавлены
                          </span>
                        ) : (
                          <>
                            {item.modules
                              .slice(0, 3)
                              .map(
                                (
                                  moduleItem,
                                  index
                                ) => (
                                  <span
                                    key={
                                      moduleItem
                                        .link.id
                                    }
                                    className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {index + 1}.{' '}
                                    {moduleItem
                                      .module
                                      ?.name ??
                                      `№${moduleItem.link.module_id}`}
                                  </span>
                                )
                              )}
                            {item.modules.length >
                              3 && (
                              <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                +
                                {item.modules
                                  .length - 3}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                      {item.groupCount}
                    </td>
                    <td className="px-5 py-4">
                      {statusBadge(
                        item.plan.is_active !==
                          false
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlan(item);
                          setModalError(null);
                          setIsPlanModalOpen(
                            true
                          );
                        }}
                        className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        Управление
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPlans.length === 0 && (
              <div className="flex min-h-64 items-center justify-center text-sm text-gray-400">
                Учебные планы не найдены
              </div>
            )}
          </div>
        ) : activeTab === 'directions' ? (
          <div className="max-h-[610px] overflow-auto">
            <table className="min-w-[760px] w-full text-left">
              <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Направление
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Описание
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Планов
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Групп
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Статус
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDirections.map(
                  (item) => (
                    <tr
                      key={item.direction.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {item.direction.name}
                      </td>
                      <td className="max-w-md px-5 py-4 text-sm text-gray-500">
                        {item.direction
                          .description ||
                          'Описание не указано'}
                      </td>
                      <td className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                        {item.planCount}
                      </td>
                      <td className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                        {item.groupCount}
                      </td>
                      <td className="px-5 py-4">
                        {statusBadge(
                          item.direction
                            .is_active !== false
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogModalKind(
                              'direction'
                            );
                            setSelectedCatalogItem(
                              item.direction
                            );
                            setModalError(null);
                          }}
                          className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          Управление
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {filteredDirections.length ===
              0 && (
              <div className="flex min-h-64 items-center justify-center text-sm text-gray-400">
                Направления не найдены
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-[610px] overflow-auto">
            <table className="min-w-[720px] w-full text-left">
              <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Модуль
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Описание
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Входит в планы
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Статус
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredModules.map((item) => (
                  <tr
                    key={item.module.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {item.module.name}
                    </td>
                    <td className="max-w-lg px-5 py-4 text-sm text-gray-500">
                      {item.module.description ||
                        'Описание не указано'}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                      {item.planCount}
                    </td>
                    <td className="px-5 py-4">
                      {statusBadge(
                        item.module.is_active !==
                          false
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogModalKind(
                            'module'
                          );
                          setSelectedCatalogItem(
                            item.module
                          );
                          setModalError(null);
                        }}
                        className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        Управление
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredModules.length === 0 && (
              <div className="flex min-h-64 items-center justify-center text-sm text-gray-400">
                Модули не найдены
              </div>
            )}
          </div>
        )}
      </div>

      <AdminEducationPlanModal
        isOpen={isPlanModalOpen}
        item={selectedPlan}
        directions={data.directions}
        modules={data.modules}
        isSaving={isSaving}
        activeAction={activeAction}
        error={modalError}
        onClose={closeModals}
        onSubmit={submitPlan}
        onToggleActive={togglePlan}
        onDelete={removePlan}
      />

      <AdminProgramCatalogModal
        isOpen={
          catalogModalKind !== null
        }
        kind={
          catalogModalKind ?? 'direction'
        }
        item={selectedCatalogItem}
        isSaving={isSaving}
        activeAction={activeAction}
        error={modalError}
        onClose={closeModals}
        onSubmit={submitCatalog}
        onToggleActive={toggleCatalog}
        onDelete={removeCatalog}
      />
    </div>
  );
}
