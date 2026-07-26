import {
  AlertCircle,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Loader2,
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
  assignGroupTeacher,
  closeGroup,
  createGroup,
  removeGroupMember,
  restoreGroup,
  safeDeleteGroup,
  updateGroup,
  type AcademicGroupMutation,
} from '../../../api/academicApi';

import AdminGroupModal, {
  type AdminGroupFormValues,
} from '../../../components/dashboard/admin/AdminGroupModal';
import AdminGroupMembersModal from '../../../components/dashboard/admin/AdminGroupMembersModal';

import {
  getAdminGroupBranchName,
  getAdminGroupTeacherName,
  loadAdminGroups,
  type AdminGroupItem,
  type AdminGroupsData,
} from '../../../services/adminGroupsService';

const EMPTY_DATA: AdminGroupsData = {
  items: [],
  branches: [],
  branchAddresses: [],
  directions: [],
  educationPlans: [],
  teachers: [],
};

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
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

  return 'Не удалось выполнить операцию';
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

const selectClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100';

export default function AdminGroups() {
  const [data, setData] =
    useState<AdminGroupsData>(EMPTY_DATA);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [searchValue, setSearchValue] =
    useState('');
  const [branchFilter, setBranchFilter] =
    useState('all');
  const [
    directionFilter,
    setDirectionFilter,
  ] = useState('all');
  const [teacherFilter, setTeacherFilter] =
    useState('all');
  const [statusFilter, setStatusFilter] =
    useState('all');

  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [selectedItem, setSelectedItem] =
    useState<AdminGroupItem | null>(null);
  const [
    membersModalItem,
    setMembersModalItem,
  ] = useState<AdminGroupItem | null>(null);
  const [isSaving, setIsSaving] =
    useState(false);
  const [activeAction, setActiveAction] =
    useState<string | null>(null);
  const [modalError, setModalError] =
    useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedData =
        await loadAdminGroups();

      setData(loadedData);
      return loadedData;
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      return EMPTY_DATA;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

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

  const filteredItems = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return data.items.filter((item) => {
      const searchableText = [
        item.group.name,
        item.branchName,
        item.direction?.name,
        item.educationPlan?.name,
        item.educationPlan?.title,
        getAdminGroupTeacherName(
          item.teacher
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

      const matchesBranch =
        branchFilter === 'all' ||
        String(item.group.branch_id) ===
          branchFilter;

      const matchesDirection =
        directionFilter === 'all' ||
        String(
          item.group.direction_id
        ) === directionFilter;

      const matchesTeacher =
        teacherFilter === 'all' ||
        (teacherFilter === 'none'
          ? item.teacher === null
          : String(item.teacher?.id) ===
            teacherFilter);

      const isActive =
        item.group.is_active !== false;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'
          ? isActive
          : !isActive);

      return (
        matchesSearch &&
        matchesBranch &&
        matchesDirection &&
        matchesTeacher &&
        matchesStatus
      );
    });
  }, [
    branchFilter,
    data.items,
    directionFilter,
    searchValue,
    statusFilter,
    teacherFilter,
  ]);

  const totalStudents = useMemo(
    () =>
      data.items.reduce(
        (total, item) =>
          total + item.studentCount,
        0
      ),
    [data.items]
  );

  const activeGroupsCount = useMemo(
    () =>
      data.items.filter(
        (item) =>
          item.group.is_active !== false
      ).length,
    [data.items]
  );

  const groupsWithoutTeacherCount =
    useMemo(
      () =>
        data.items.filter(
          (item) => !item.teacher
        ).length,
      [data.items]
    );

  const filtersAreActive =
    searchValue.trim() !== '' ||
    branchFilter !== 'all' ||
    directionFilter !== 'all' ||
    teacherFilter !== 'all' ||
    statusFilter !== 'all';

  const resetFilters = () => {
    setSearchValue('');
    setBranchFilter('all');
    setDirectionFilter('all');
    setTeacherFilter('all');
    setStatusFilter('all');
  };

  const openCreateModal = () => {
    setSelectedItem(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openManageModal = (
    item: AdminGroupItem
  ) => {
    setSelectedItem(item);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openMembersModal = (
    item: AdminGroupItem
  ) => {
    setMembersModalItem(item);
  };

  const closeModal = () => {
    if (isSaving || activeAction) {
      return;
    }

    setIsModalOpen(false);
    setSelectedItem(null);
    setModalError(null);
  };

  const syncTeacher = async (
    groupId: number,
    currentItem: AdminGroupItem | null,
    nextTeacherId: number | null
  ) => {
    const currentTeacherId =
      currentItem?.teacher?.id ?? null;

    if (currentTeacherId === nextTeacherId) {
      return;
    }

    if (nextTeacherId !== null) {
      await assignGroupTeacher(
        groupId,
        nextTeacherId
      );
    }

    if (
      currentItem?.teacherMembership
    ) {
      await removeGroupMember(
        currentItem.teacherMembership.id
      );
    }
  };

  const handleSubmit = async (
    values: AdminGroupFormValues
  ) => {
    if (
      values.endDate &&
      values.endDate < values.startDate
    ) {
      setModalError(
        'Дата окончания не может быть раньше даты начала'
      );
      return;
    }

    const payload: AcademicGroupMutation = {
      name: values.name,
      branch_id: values.branchId,
      direction_id: values.directionId,
      education_plan_id:
        values.educationPlanId,
      start_date: values.startDate,
      end_date: values.endDate || null,
    };

    setIsSaving(true);
    setModalError(null);

    try {
      if (selectedItem) {
        const updatedGroup = await updateGroup(
          selectedItem.group.id,
          payload
        );

        await syncTeacher(
          updatedGroup.id,
          selectedItem,
          values.teacherId
        );

        setSuccessMessage(
          'Данные группы обновлены'
        );
      } else {
        const createdGroup = await createGroup(
          payload
        );

        await syncTeacher(
          createdGroup.id,
          null,
          values.teacherId
        );

        setSuccessMessage('Группа создана');
      }

      setIsModalOpen(false);
      setSelectedItem(null);
      await loadGroups();
    } catch (saveError) {
      setModalError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runGroupAction = async (
    action:
      | 'close'
      | 'restore'
      | 'delete'
  ) => {
    if (!selectedItem) {
      return;
    }

    const groupName =
      selectedItem.group.name;

    if (action === 'close') {
      const confirmed = window.confirm(
        `Закрыть группу «${groupName}»?\n\nПосле закрытия добавлять новых студентов будет нельзя.`
      );

      if (!confirmed) {
        return;
      }
    }

    if (action === 'delete') {
      const confirmed = window.confirm(
        `Удалить группу «${groupName}»?\n\nБудет выполнено безопасное удаление. Если у группы есть связанные данные, Academic Service может запретить операцию.`
      );

      if (!confirmed) {
        return;
      }
    }

    setActiveAction(action);
    setModalError(null);

    try {
      if (action === 'close') {
        await closeGroup(
          selectedItem.group.id
        );
        setSuccessMessage('Группа закрыта');
      } else if (action === 'restore') {
        await restoreGroup(
          selectedItem.group.id
        );
        setSuccessMessage(
          'Группа восстановлена'
        );
      } else {
        await safeDeleteGroup(
          selectedItem.group.id
        );
        setSuccessMessage('Группа удалена');
      }

      setIsModalOpen(false);
      setSelectedItem(null);
      await loadGroups();
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
            Группы
          </h1>
          <p className="mt-1 text-gray-500">
            Учебные группы, преподаватели и статусы обучения
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={
            isLoading ||
            data.branches.length === 0 ||
            data.directions.length === 0 ||
            data.educationPlans.length === 0
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Plus className="h-4 w-4" />
          Создать группу
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
                Не удалось загрузить группы
              </p>
              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadGroups()}
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
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.items.length}
                  </p>
                  <p className="text-sm text-gray-500">
                    Всего групп
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeGroupsCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    Активных
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalStudents}
                  </p>
                  <p className="text-sm text-gray-500">
                    Студентов в группах
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {groupsWithoutTeacherCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    Без преподавателя
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                    placeholder="Группа, план или преподаватель"
                  />
                </div>
              </label>

              <label>
                <span className="text-xs font-medium text-gray-600">
                  Филиал
                </span>
                <select
                  value={branchFilter}
                  onChange={(event) =>
                    setBranchFilter(
                      event.target.value
                    )
                  }
                  className={`${selectClassName} mt-1.5`}
                >
                  <option value="all">
                    Все филиалы
                  </option>
                  {data.branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {getAdminGroupBranchName(
                        branch,
                        data.branchAddresses
                      )}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-medium text-gray-600">
                  Направление
                </span>
                <select
                  value={directionFilter}
                  onChange={(event) =>
                    setDirectionFilter(
                      event.target.value
                    )
                  }
                  className={`${selectClassName} mt-1.5`}
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
              </label>

              <label>
                <span className="text-xs font-medium text-gray-600">
                  Преподаватель
                </span>
                <select
                  value={teacherFilter}
                  onChange={(event) =>
                    setTeacherFilter(
                      event.target.value
                    )
                  }
                  className={`${selectClassName} mt-1.5`}
                >
                  <option value="all">
                    Все преподаватели
                  </option>
                  <option value="none">
                    Не назначен
                  </option>
                  {data.teachers.map((teacher) => (
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
                Список групп
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
                <Layers3 className="h-9 w-9 text-gray-300" />
                <p className="mt-3 font-medium text-gray-700">
                  Группы не найдены
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Измените фильтры или создайте новую группу.
                </p>
              </div>
            ) : (
              <div className="max-h-[862px] overflow-auto overscroll-contain">
                <table className="w-full min-w-[1320px] text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                      <th className="px-5 py-3 font-medium">
                        Группа
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Направление и план
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Филиал
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Преподаватель
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Студентов
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Период обучения
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
                        item.group.is_active !==
                        false;

                      return (
                        <tr
                          key={item.group.id}
                          className="h-[82px] transition hover:bg-gray-50"
                        >
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() =>
                                openMembersModal(
                                  item
                                )
                              }
                              className="text-left font-semibold text-gray-900 transition hover:text-red-600 hover:underline"
                              title="Открыть состав группы"
                            >
                              {item.group.name}
                            </button>
                            <p className="mt-0.5 text-xs text-gray-400">
                              Создана{' '}
                              {formatDate(
                                item.group.created_at
                              )}
                            </p>
                          </td>

                          <td className="px-4 py-3.5">
                            <p className="text-gray-700">
                              {item.direction
                                ?.name ??
                                'Не указано'}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {item.educationPlan
                                ?.name ??
                                item.educationPlan
                                  ?.title ??
                                'План не указан'}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 text-gray-600">
                            {item.branchName}
                          </td>

                          <td className="px-4 py-3.5 text-gray-700">
                            {getAdminGroupTeacherName(
                              item.teacher
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-center font-semibold text-gray-900">
                            {item.studentCount}
                          </td>

                          <td className="px-4 py-3.5 text-gray-600">
                            <p>
                              {formatDate(
                                item.group.start_date
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              до{' '}
                              {formatDate(
                                item.group.end_date
                              )}
                            </p>
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
                                ? 'Активна'
                                : 'Закрыта'}
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

      <AdminGroupModal
        isOpen={isModalOpen}
        item={selectedItem}
        branches={data.branches}
        branchAddresses={
          data.branchAddresses
        }
        directions={data.directions}
        educationPlans={
          data.educationPlans
        }
        teachers={data.teachers}
        isSaving={isSaving}
        activeAction={activeAction}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onCloseGroup={() =>
          runGroupAction('close')
        }
        onRestoreGroup={() =>
          runGroupAction('restore')
        }
        onDeleteGroup={() =>
          runGroupAction('delete')
        }
      />

      <AdminGroupMembersModal
        item={membersModalItem}
        onClose={() =>
          setMembersModalItem(null)
        }
        onChanged={async () => {
          await loadGroups();
        }}
      />
    </div>
  );
}
