import {
  AlertCircle,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Loader2,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createBranch,
  createBranchAddress,
  deleteBranch,
  deleteBranchAddress,
  updateBranch,
  updateBranchAddress,
  type AcademicBranchAddressMutation,
} from '../../../api/academicApi';

import AdminBranchModal, {
  type AdminBranchFormValues,
} from '../../../components/dashboard/admin/AdminBranchModal';

import {
  getAdminBranchAddress,
  getAdminBranchTitle,
  loadAdminBranches,
  type AdminBranchItem,
  type AdminBranchesData,
} from '../../../services/adminBranchesService';

const EMPTY_DATA: AdminBranchesData = {
  items: [],
  unusedAddresses: [],
};

const selectClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100';

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
      message?: string;
    };

    return (
      parsed.detail ??
      parsed.message ??
      error.message
    );
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

function createAddressPayload(
  values: AdminBranchFormValues
): AcademicBranchAddressMutation {
  return {
    country: values.country,
    city: values.city,
    street: values.street,
    house: values.house,
    building: values.building || null,
    postal_code:
      values.postalCode || null,
  };
}

export default function AdminBranches() {
  const [data, setData] =
    useState<AdminBranchesData>(
      EMPTY_DATA
    );
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [searchValue, setSearchValue] =
    useState('');
  const [cityFilter, setCityFilter] =
    useState('all');
  const [statusFilter, setStatusFilter] =
    useState('all');

  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [selectedItem, setSelectedItem] =
    useState<AdminBranchItem | null>(null);
  const [isSaving, setIsSaving] =
    useState(false);
  const [activeAction, setActiveAction] =
    useState<string | null>(null);
  const [modalError, setModalError] =
    useState<string | null>(null);

  const loadBranches = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedData =
          await loadAdminBranches();

        setData(loadedData);
        return loadedData;
      } catch (loadError) {
        setData(EMPTY_DATA);
        setError(
          getErrorMessage(loadError)
        );
        return EMPTY_DATA;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

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

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          data.items
            .map((item) =>
              item.address?.city?.trim()
            )
            .filter(
              (city): city is string =>
                Boolean(city)
            )
        )
      ).sort((first, second) =>
        first.localeCompare(second, 'ru')
      ),
    [data.items]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return data.items.filter((item) => {
      const searchableText = [
        getAdminBranchTitle(item),
        getAdminBranchAddress(item.address),
        item.branch.phone,
        item.branch.email,
        ...item.groups.map(
          (group) => group.name
        ),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(
          normalizedSearch
        );

      const matchesCity =
        cityFilter === 'all' ||
        item.address?.city === cityFilter;

      const isActive =
        item.branch.is_active !== false;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'
          ? isActive
          : !isActive);

      return (
        matchesSearch &&
        matchesCity &&
        matchesStatus
      );
    });
  }, [
    cityFilter,
    data.items,
    searchValue,
    statusFilter,
  ]);

  const activeCount = useMemo(
    () =>
      data.items.filter(
        (item) =>
          item.branch.is_active !== false
      ).length,
    [data.items]
  );

  const closedCount =
    data.items.length - activeCount;

  const totalGroups = useMemo(
    () =>
      data.items.reduce(
        (total, item) =>
          total + item.groupCount,
        0
      ),
    [data.items]
  );

  const filtersAreActive =
    searchValue.trim() !== '' ||
    cityFilter !== 'all' ||
    statusFilter !== 'all';

  const resetFilters = () => {
    setSearchValue('');
    setCityFilter('all');
    setStatusFilter('all');
  };

  const openCreateModal = () => {
    setSelectedItem(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openManageModal = (
    item: AdminBranchItem
  ) => {
    setSelectedItem(item);
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving || activeAction) {
      return;
    }

    setIsModalOpen(false);
    setSelectedItem(null);
    setModalError(null);
  };

  const handleSubmit = async (
    values: AdminBranchFormValues
  ) => {
    setIsSaving(true);
    setModalError(null);

    const addressPayload =
      createAddressPayload(values);

    try {
      if (selectedItem) {
        let addressId =
          selectedItem.address?.id ?? null;

        if (addressId) {
          await updateBranchAddress(
            addressId,
            addressPayload
          );
        } else {
          const createdAddress =
            await createBranchAddress(
              addressPayload
            );

          addressId = createdAddress.id;
        }

        await updateBranch(
          selectedItem.branch.id,
          {
            branch_address_id: addressId,
            phone: values.phone || null,
            email: values.email || null,
          }
        );

        setSuccessMessage(
          'Филиал и его адрес обновлены'
        );
      } else {
        const createdAddress =
          await createBranchAddress(
            addressPayload
          );

        try {
          await createBranch({
            branch_address_id:
              createdAddress.id,
            phone: values.phone || null,
            email: values.email || null,
          });
        } catch (branchError) {
          try {
            await deleteBranchAddress(
              createdAddress.id
            );
          } catch {
            // Не скрываем исходную ошибку создания филиала.
          }

          throw branchError;
        }

        setSuccessMessage('Филиал создан');
      }

      setIsModalOpen(false);
      setSelectedItem(null);
      await loadBranches();
    } catch (saveError) {
      setModalError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runBranchAction = async (
    action:
      | 'deactivate'
      | 'restore'
      | 'delete'
  ) => {
    if (!selectedItem) {
      return;
    }

    const branchTitle =
      getAdminBranchTitle(selectedItem);

    if (action === 'deactivate') {
      const confirmed = window.confirm(
        `Закрыть филиал «${branchTitle}»?\n\nФилиал останется в системе и его можно будет восстановить.`
      );

      if (!confirmed) {
        return;
      }
    }

    if (action === 'delete') {
      const groupWarning =
        selectedItem.groupCount > 0
          ? `\n\nК филиалу привязано групп: ${selectedItem.groupCount}. Academic Service может запретить удаление до переноса или удаления этих групп.`
          : '';

      const confirmed = window.confirm(
        `Удалить филиал «${branchTitle}» и его адрес без возможности восстановления?${groupWarning}`
      );

      if (!confirmed) {
        return;
      }
    }

    setActiveAction(action);
    setModalError(null);

    try {
      if (action === 'deactivate') {
        await updateBranch(
          selectedItem.branch.id,
          {
            is_active: false,
          }
        );
        setSuccessMessage('Филиал закрыт');
      } else if (action === 'restore') {
        await updateBranch(
          selectedItem.branch.id,
          {
            is_active: true,
          }
        );
        setSuccessMessage(
          'Филиал восстановлен'
        );
      } else {
        await deleteBranch(
          selectedItem.branch.id
        );

        if (selectedItem.address) {
          try {
            await deleteBranchAddress(
              selectedItem.address.id
            );
            setSuccessMessage(
              'Филиал и адрес удалены'
            );
          } catch {
            setSuccessMessage(
              'Филиал удалён. Адрес остался в справочнике и может быть использован повторно'
            );
          }
        } else {
          setSuccessMessage('Филиал удалён');
        }
      }

      setIsModalOpen(false);
      setSelectedItem(null);
      await loadBranches();
    } catch (actionError) {
      setModalError(
        getErrorMessage(actionError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Филиалы
          </h1>
          <p className="mt-1 text-gray-500">
            Адреса, контакты и учебные группы школы
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Plus className="h-4 w-4" />
          Создать филиал
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">
                Не удалось загрузить филиалы
              </p>
              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadBranches()
            }
            className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-800"
          >
            Повторить
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.items.length}
                  </p>
                  <p className="text-sm text-gray-500">
                    Всего филиалов
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    Активных
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <X className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {closedCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    Закрытых
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalGroups}
                  </p>
                  <p className="text-sm text-gray-500">
                    Групп в филиалах
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <label>
                <span className="text-xs font-medium text-gray-600">
                  Поиск
                </span>
                <div className="relative mt-1.5">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchValue}
                    onChange={(event) =>
                      setSearchValue(
                        event.target.value
                      )
                    }
                    className={`${selectClassName} pl-9`}
                    placeholder="Город, адрес, телефон или email"
                  />
                </div>
              </label>

              <label>
                <span className="text-xs font-medium text-gray-600">
                  Город
                </span>
                <select
                  value={cityFilter}
                  onChange={(event) =>
                    setCityFilter(
                      event.target.value
                    )
                  }
                  className={`${selectClassName} mt-1.5`}
                >
                  <option value="all">
                    Все города
                  </option>
                  {cities.map((city) => (
                    <option
                      key={city}
                      value={city}
                    >
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-medium text-gray-600">
                  Статус
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className={`${selectClassName} mt-1.5`}
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
              </label>
            </div>

            {filtersAreActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" />
                Сбросить фильтры
              </button>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-bold text-gray-900">
                Список филиалов
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Показано: {filteredItems.length}
              </p>
            </div>

            {isLoading ? (
              <div className="flex min-h-72 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-red-600" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
                <Building2 className="h-9 w-9 text-gray-300" />
                <p className="mt-3 font-medium text-gray-700">
                  Филиалы не найдены
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Измените фильтры или создайте новый филиал.
                </p>
              </div>
            ) : (
              <div className="max-h-[820px] overflow-auto overscroll-contain">
                <table className="w-full min-w-[1180px] text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                      <th className="px-5 py-3 font-medium">
                        Филиал
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Адрес
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Контакты
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Групп
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Студентов
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Преподавателей
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Статус
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Действия
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map((item) => {
                      const isActive =
                        item.branch.is_active !==
                        false;

                      return (
                        <tr
                          key={item.branch.id}
                          className="h-[82px] transition hover:bg-gray-50"
                        >
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() =>
                                openManageModal(
                                  item
                                )
                              }
                              className="text-left font-semibold text-gray-900 transition hover:text-red-600 hover:underline"
                            >
                              {getAdminBranchTitle(
                                item
                              )}
                            </button>
                            <p className="mt-0.5 text-xs text-gray-400">
                              Создан{' '}
                              {formatDate(
                                item.branch
                                  .created_at
                              )}
                            </p>
                          </td>

                          <td className="max-w-xs px-4 py-3.5 text-gray-600">
                            {getAdminBranchAddress(
                              item.address
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <p className="text-gray-700">
                              {item.branch.phone ||
                                'Телефон не указан'}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {item.branch.email ||
                                'Email не указан'}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 text-center font-semibold text-gray-900">
                            {item.groupCount}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1.5 text-gray-700">
                              <Users className="h-4 w-4 text-gray-400" />
                              {item.studentCount}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1.5 text-gray-700">
                              <GraduationCap className="h-4 w-4 text-gray-400" />
                              {item.teacherCount}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                isActive
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {isActive
                                ? 'Активен'
                                : 'Закрыт'}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openManageModal(
                                  item
                                )
                              }
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              Управление
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <AdminBranchModal
        isOpen={isModalOpen}
        item={selectedItem}
        isSaving={isSaving}
        activeAction={activeAction}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDeactivate={() =>
          runBranchAction('deactivate')
        }
        onRestore={() =>
          runBranchAction('restore')
        }
        onDelete={() =>
          runBranchAction('delete')
        }
      />
    </div>
  );
}
