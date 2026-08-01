import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Link2,
  Link2Off,
  Loader2,
  Lock,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Unlink,
  UserCheck,
  UserPlus,
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
  useNavigate,
} from 'react-router-dom';

import {
  activateParentStudentLink,
  createParentStudentLink,
  deactivateParentStudentLink,
  getParentChildren,
  updateParentStudentRelationship,
  type ParentRelationship,
  type ParentStudentWithStudent,
} from '../../../api/parentStudentApi';

import {
  activateUser,
  blockUser,
  changeUserRole,
  createUser,
  getUsers,
  updateUserProfile,
  verifyUserAccount,
  verifyUserPhone,
  type UserProfile,
} from '../../../api/userApi';

import UserAvatar from '../../../components/common/UserAvatar';

import AdminStudentFormModal, {
  type AdminStudentFormValues,
} from '../../../components/dashboard/admin/AdminStudentFormModal';

import {
  getAdminStudentName,
  loadAdminStudents,
  type AdminStudentItem,
} from '../../../services/adminStudentsService';

type StatusFilter =
  | 'all'
  | 'active'
  | 'blocked'
  | 'unverified'
  | 'with-children'
  | 'without-children';

interface AdminParentItem {
  profile: UserProfile;
  children: ParentStudentWithStudent[];
}

const RELATIONSHIP_LABELS: Record<
  ParentRelationship,
  string
> = {
  mother: 'Мать',
  father: 'Отец',
  guardian: 'Законный представитель',
  other: 'Другой представитель',
};

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить операцию';
}

function getParentName(
  parent: UserProfile
): string {
  return (
    [
      parent.first_name,
      parent.user_name,
      parent.last_name,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim() ||
    `Родитель №${parent.id}`
  );
}

function getLinkedStudentName(
  link: ParentStudentWithStudent
): string {
  return (
    [
      link.student.first_name,
      link.student.user_name,
      link.student.last_name,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim() ||
    `Студент №${link.student_id}`
  );
}

function formatDate(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Дата не указана';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function loadAllParents(): Promise<
  UserProfile[]
> {
  const parents: UserProfile[] = [];
  const pageSize = 100;
  let skip = 0;
  let total = Number.POSITIVE_INFINITY;

  while (skip < total) {
    const response = await getUsers({
      role: 'parent',
      skip,
      limit: pageSize,
    });

    parents.push(...response.items);
    total = response.total;

    if (response.items.length === 0) {
      break;
    }

    skip += response.items.length;
  }

  return Array.from(
    new Map(
      parents
        .filter(
          (parent) =>
            parent.role
              .trim()
              .toLowerCase() === 'parent'
        )
        .map((parent) => [
          parent.id,
          parent,
        ])
    ).values()
  ).sort((first, second) =>
    getParentName(first).localeCompare(
      getParentName(second),
      'ru'
    )
  );
}

function StatusBadges({
  parent,
}: {
  parent: UserProfile;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          parent.is_active
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}
      >
        {parent.is_active
          ? 'Активен'
          : 'Заблокирован'}
      </span>

      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          parent.is_account_verified
            ? 'bg-blue-50 text-blue-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {parent.is_account_verified
          ? 'Аккаунт подтверждён'
          : 'Аккаунт не подтверждён'}
      </span>

      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          parent.is_phone_verified
            ? 'bg-violet-50 text-violet-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {parent.is_phone_verified
          ? 'Телефон подтверждён'
          : 'Телефон не подтверждён'}
      </span>
    </div>
  );
}

export default function AdminParents() {
  const navigate = useNavigate();

  const [parents, setParents] =
    useState<AdminParentItem[]>([]);
  const [students, setStudents] =
    useState<AdminStudentItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [warning, setWarning] =
    useState<string | null>(null);
  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null);

  const [searchValue, setSearchValue] =
    useState('');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');

  const [
    selectedParentId,
    setSelectedParentId,
  ] = useState<number | null>(null);

  const [isFormOpen, setIsFormOpen] =
    useState(false);
  const [editingParent, setEditingParent] =
    useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] =
    useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);

  const [activeAction, setActiveAction] =
    useState<string | null>(null);
  const [actionError, setActionError] =
    useState<string | null>(null);

  const [isAddChildOpen, setIsAddChildOpen] =
    useState(false);
  const [studentSearch, setStudentSearch] =
    useState('');
  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState<number | null>(null);
  const [
    newRelationship,
    setNewRelationship,
  ] = useState<ParentRelationship>(
    'guardian'
  );

  const loadParents = useCallback(
    async (background = false) => {
      if (!background) {
        setIsLoading(true);
      }

      setError(null);
      setWarning(null);

      try {
        const [
          loadedParents,
          loadedStudents,
        ] = await Promise.all([
          loadAllParents(),
          loadAdminStudents(),
        ]);

        const childResults =
          await Promise.allSettled(
            loadedParents.map((parent) =>
              getParentChildren(
                parent.id,
                false
              )
            )
          );

        const failedResults =
          childResults.filter(
            (result) =>
              result.status === 'rejected'
          );

        if (
          loadedParents.length > 0 &&
          failedResults.length ===
            loadedParents.length
        ) {
          const firstFailure =
            failedResults[0];

          throw firstFailure.status ===
            'rejected'
            ? firstFailure.reason
            : new Error(
                'Не удалось загрузить связи родителей'
              );
        }

        if (failedResults.length > 0) {
          setWarning(
            `Не удалось загрузить связи для ${failedResults.length} родител${failedResults.length === 1 ? 'я' : 'ей'}`
          );
        }

        setStudents(loadedStudents);
        setParents(
          loadedParents.map(
            (profile, index) => {
              const childResult =
                childResults[index];

              return {
                profile,
                children:
                  childResult?.status ===
                  'fulfilled'
                    ? childResult.value
                    : [],
              };
            }
          )
        );
      } catch (loadError) {
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadParents();
  }, [loadParents]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timerId = window.setTimeout(
      () => setSuccessMessage(null),
      4000
    );

    return () =>
      window.clearTimeout(timerId);
  }, [successMessage]);

  const selectedParent = useMemo(
    () =>
      selectedParentId === null
        ? null
        : parents.find(
            (parent) =>
              parent.profile.id ===
              selectedParentId
          ) ?? null,
    [parents, selectedParentId]
  );

  const studentsById = useMemo(
    () =>
      new Map(
        students.map((student) => [
          student.profile.id,
          student,
        ])
      ),
    [students]
  );

  const statistics = useMemo(() => {
    const active = parents.filter(
      (parent) =>
        parent.profile.is_active
    ).length;

    const withChildren = parents.filter(
      (parent) =>
        parent.children.some(
          (link) => link.is_active
        )
    ).length;

    const activeLinks = parents.reduce(
      (total, parent) =>
        total +
        parent.children.filter(
          (link) => link.is_active
        ).length,
      0
    );

    return {
      active,
      withChildren,
      withoutChildren:
        parents.length - withChildren,
      activeLinks,
    };
  }, [parents]);

  const filteredParents = useMemo(() => {
    const search =
      searchValue
        .trim()
        .toLowerCase();

    return parents.filter((item) => {
      const parent = item.profile;
      const activeChildren =
        item.children.filter(
          (link) => link.is_active
        );

      if (
        statusFilter === 'active' &&
        !parent.is_active
      ) {
        return false;
      }

      if (
        statusFilter === 'blocked' &&
        parent.is_active
      ) {
        return false;
      }

      if (
        statusFilter === 'unverified' &&
        parent.is_account_verified &&
        parent.is_phone_verified
      ) {
        return false;
      }

      if (
        statusFilter ===
          'with-children' &&
        activeChildren.length === 0
      ) {
        return false;
      }

      if (
        statusFilter ===
          'without-children' &&
        activeChildren.length > 0
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const childrenSearchText =
        item.children.flatMap((link) => {
          const student =
            studentsById.get(
              link.student_id
            );

          return [
            getLinkedStudentName(link),
            link.student.phone_number,
            link.student.email,
            ...(student?.study.flatMap(
              (study) => [
                study.groupName,
                study.branchName,
                study.directionName,
                study.educationPlanName,
              ]
            ) ?? []),
          ];
        });

      return [
        getParentName(parent),
        parent.phone_number,
        parent.email,
        parent.about,
        ...childrenSearchText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [
    parents,
    searchValue,
    statusFilter,
    studentsById,
  ]);

  const availableStudents = useMemo(() => {
    if (!selectedParent) {
      return [];
    }

    const linkedStudentIds = new Set(
      selectedParent.children.map(
        (link) => link.student_id
      )
    );

    const search =
      studentSearch
        .trim()
        .toLowerCase();

    return students.filter((student) => {
      if (
        linkedStudentIds.has(
          student.profile.id
        )
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        getAdminStudentName(
          student.profile
        ),
        student.profile.phone_number,
        student.profile.email,
        ...student.study.flatMap(
          (study) => [
            study.groupName,
            study.branchName,
          ]
        ),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [
    selectedParent,
    studentSearch,
    students,
  ]);

  const openCreateForm = () => {
    setEditingParent(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (
    parent: UserProfile
  ) => {
    setEditingParent(parent);
    setSelectedParentId(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingParent(null);
    setFormError(null);
  };

  const handleFormSubmit = async (
    values: AdminStudentFormValues
  ) => {
    setIsSaving(true);
    setFormError(null);

    const payload = {
      phone_number:
        values.phoneNumber.trim(),
      first_name:
        values.firstName.trim() || null,
      user_name:
        values.userName.trim(),
      last_name:
        values.lastName.trim() || null,
      email:
        values.email.trim() || null,
      birthday:
        values.birthday || null,
      about:
        values.about.trim() || null,
    };

    try {
      if (editingParent) {
        await updateUserProfile(
          editingParent.id,
          payload
        );

        setSuccessMessage(
          'Данные родителя обновлены'
        );
      } else {
        await createUser({
          ...payload,
          role: 'parent',
        });

        setSuccessMessage(
          'Профиль родителя создан'
        );
      }

      setIsFormOpen(false);
      setEditingParent(null);
      await loadParents(true);
    } catch (saveError) {
      setFormError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runParentAction = async (
    actionName: string,
    action: (
      parentId: number
    ) => Promise<unknown>,
    successText: string
  ) => {
    if (
      !selectedParent ||
      activeAction
    ) {
      return;
    }

    setActiveAction(actionName);
    setActionError(null);

    try {
      await action(
        selectedParent.profile.id
      );
      await loadParents(true);
      setSuccessMessage(successText);
    } catch (requestError) {
      setActionError(
        getErrorMessage(requestError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleAddChild = async () => {
    if (
      !selectedParent ||
      selectedStudentId === null ||
      activeAction
    ) {
      return;
    }

    setActiveAction('add-child');
    setActionError(null);

    try {
      await createParentStudentLink({
        parent_id:
          selectedParent.profile.id,
        student_id: selectedStudentId,
        relationship:
          newRelationship,
      });

      setIsAddChildOpen(false);
      setSelectedStudentId(null);
      setStudentSearch('');
      setNewRelationship('guardian');

      await loadParents(true);
      setSuccessMessage(
        'Студент привязан к родителю'
      );
    } catch (requestError) {
      setActionError(
        getErrorMessage(requestError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleRelationshipChange =
    async (
      linkId: number,
      relationship: ParentRelationship
    ) => {
      if (activeAction) {
        return;
      }

      const actionName =
        `relationship-${linkId}`;

      setActiveAction(actionName);
      setActionError(null);

      try {
        await updateParentStudentRelationship(
          linkId,
          relationship
        );

        await loadParents(true);
        setSuccessMessage(
          'Тип связи обновлён'
        );
      } catch (requestError) {
        setActionError(
          getErrorMessage(requestError)
        );
      } finally {
        setActiveAction(null);
      }
    };

  const handleDeactivateLink =
    async (
      link: ParentStudentWithStudent
    ) => {
      if (activeAction) {
        return;
      }

      const confirmed = window.confirm(
        `Отвязать студента «${getLinkedStudentName(
          link
        )}» от родителя?\n\nСвязь будет сохранена в истории и её можно будет восстановить.`
      );

      if (!confirmed) {
        return;
      }

      const actionName =
        `deactivate-${link.id}`;

      setActiveAction(actionName);
      setActionError(null);

      try {
        await deactivateParentStudentLink(
          link.id
        );

        await loadParents(true);
        setSuccessMessage(
          'Связь со студентом отключена'
        );
      } catch (requestError) {
        setActionError(
          getErrorMessage(requestError)
        );
      } finally {
        setActiveAction(null);
      }
    };

  const handleActivateLink =
    async (
      link: ParentStudentWithStudent
    ) => {
      if (activeAction) {
        return;
      }

      const actionName =
        `activate-${link.id}`;

      setActiveAction(actionName);
      setActionError(null);

      try {
        await activateParentStudentLink(
          link.id
        );

        await loadParents(true);
        setSuccessMessage(
          'Связь со студентом восстановлена'
        );
      } catch (requestError) {
        setActionError(
          getErrorMessage(requestError)
        );
      } finally {
        setActiveAction(null);
      }
    };

  const handleRemoveParentRole =
    async () => {
      if (
        !selectedParent ||
        activeAction
      ) {
        return;
      }

      const activeChildren =
        selectedParent.children.filter(
          (link) => link.is_active
        );

      if (activeChildren.length > 0) {
        setActionError(
          'Сначала отключите все активные связи родителя со студентами'
        );
        return;
      }

      const confirmed = window.confirm(
        `Снять роль родителя у «${getParentName(
          selectedParent.profile
        )}»?\n\nПользователю будет назначена роль user.`
      );

      if (!confirmed) {
        return;
      }

      setActiveAction('remove-role');
      setActionError(null);

      try {
        await changeUserRole(
          selectedParent.profile.id,
          'user'
        );

        setSelectedParentId(null);
        await loadParents(true);
        setSuccessMessage(
          'Роль родителя снята'
        );
      } catch (requestError) {
        setActionError(
          getErrorMessage(requestError)
        );
      } finally {
        setActiveAction(null);
      }
    };

  const handleBlock = async () => {
    if (!selectedParent) {
      return;
    }

    const confirmed = window.confirm(
      `Заблокировать родителя «${getParentName(
        selectedParent.profile
      )}»?`
    );

    if (!confirmed) {
      return;
    }

    await runParentAction(
      'block',
      blockUser,
      'Родитель заблокирован'
    );
  };

  const closeManagement = () => {
    if (activeAction) {
      return;
    }

    setSelectedParentId(null);
    setIsAddChildOpen(false);
    setSelectedStudentId(null);
    setStudentSearch('');
    setActionError(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <p>Загружаем родителей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
            <Link2 className="h-4 w-4" />
            Родители и дети
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Родители
          </h1>

          <p className="mt-1 text-gray-500">
            Управление родителями и их
            связями со студентами
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              void loadParents()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Создать родителя
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                void loadParents()
              }
              className="mt-2 font-semibold underline"
            >
              Повторить
            </button>
          </div>
        </div>
      )}

      {warning && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {warning}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Всего родителей
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {parents.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Активные аккаунты
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.active}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Родители с детьми
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.withChildren}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Активных связей:
            {' '}
            {statistics.activeLinks}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Без привязанных детей
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.withoutChildren}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Поиск
            </span>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Родитель, ребёнок, группа, телефон"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Фильтр
            </span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter
                )
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            >
              <option value="all">
                Все родители
              </option>
              <option value="active">
                Активные
              </option>
              <option value="blocked">
                Заблокированные
              </option>
              <option value="unverified">
                Требуют подтверждения
              </option>
              <option value="with-children">
                С привязанными детьми
              </option>
              <option value="without-children">
                Без привязанных детей
              </option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">
            Список родителей
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Показано:
            {' '}
            {filteredParents.length}
          </p>
        </div>

        {filteredParents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Users className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 font-semibold text-gray-900">
              Родители не найдены
            </h3>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredParents.map((item) => {
              const activeChildren =
                item.children.filter(
                  (link) => link.is_active
                );

              return (
                <div
                  key={item.profile.id}
                  className="p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(240px,0.95fr)_minmax(320px,1.25fr)_minmax(260px,0.95fr)] xl:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          avatarUrl={
                            item.profile.avatar_url
                          }
                          alt={getParentName(
                            item.profile
                          )}
                          className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                        />

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {getParentName(
                              item.profile
                            )}
                          </p>

                          <p className="mt-1 truncate text-sm text-gray-500">
                            {item.profile.phone_number}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-semibold text-gray-800">
                            Детей:
                            {' '}
                            {activeChildren.length}
                          </span>
                        </div>

                        {activeChildren.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {activeChildren
                              .slice(0, 2)
                              .map((link) => {
                                const student =
                                  studentsById.get(
                                    link.student_id
                                  );

                                return (
                                  <p
                                    key={link.id}
                                    className="truncate text-sm text-gray-600"
                                  >
                                    {getLinkedStudentName(
                                      link
                                    )}
                                    {student?.study.length
                                      ? ` · ${student.study
                                          .map(
                                            (study) =>
                                              study.groupName
                                          )
                                          .join(', ')}`
                                      : ' · без группы'}
                                  </p>
                                );
                              })}

                            {activeChildren.length >
                              2 && (
                              <p className="text-xs font-medium text-red-600">
                                Ещё:
                                {' '}
                                {activeChildren.length -
                                  2}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-amber-600">
                            Ребёнок не привязан
                          </p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <StatusBadges
                          parent={item.profile}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/messages?contactUserId=${item.profile.id}&contactRole=parent`
                          )
                        }
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-600 hover:text-white"
                        title={`Написать ${getParentName(
                          item.profile
                        )}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Написать
                      </button>

                      {item.profile.phone_number && (
                        <a
                          href={`tel:${item.profile.phone_number}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                          title={`Позвонить ${item.profile.phone_number}`}
                        >
                          <Phone className="h-4 w-4" />
                          Позвонить
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParentId(
                            item.profile.id
                          );
                          setActionError(null);
                        }}
                        className="inline-flex min-w-[148px] items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Управление
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedParent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start gap-4 border-b border-gray-100 p-5">
              <UserAvatar
                avatarUrl={
                  selectedParent.profile
                    .avatar_url
                }
                alt={getParentName(
                  selectedParent.profile
                )}
                className="h-14 w-14 rounded-full object-cover ring-1 ring-gray-200"
              />

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {getParentName(
                    selectedParent.profile
                  )}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Родитель и привязанные студенты
                </p>
              </div>

              <button
                type="button"
                onClick={closeManagement}
                disabled={Boolean(
                  activeAction
                )}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 space-y-6 overflow-y-auto p-5">
              {actionError && (
                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {actionError}
                </div>
              )}

              <section className="rounded-2xl border border-gray-200">
                <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Привязанные дети
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Один родитель может быть
                      привязан к нескольким студентам
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddChildOpen(
                        (current) => !current
                      );
                      setSelectedStudentId(
                        null
                      );
                      setStudentSearch('');
                    }}
                    disabled={Boolean(
                      activeAction
                    )}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    Привязать ребёнка
                  </button>
                </div>

                {isAddChildOpen && (
                  <div className="border-b border-gray-100 bg-gray-50 p-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                      <label>
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Поиск студента
                        </span>

                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                          <input
                            value={studentSearch}
                            onChange={(event) =>
                              setStudentSearch(
                                event.target.value
                              )
                            }
                            placeholder="ФИО, телефон или группа"
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                      </label>

                      <label>
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Тип связи
                        </span>

                        <select
                          value={newRelationship}
                          onChange={(event) =>
                            setNewRelationship(
                              event.target
                                .value as ParentRelationship
                            )
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        >
                          {Object.entries(
                            RELATIONSHIP_LABELS
                          ).map(
                            ([
                              value,
                              label,
                            ]) => (
                              <option
                                key={value}
                                value={value}
                              >
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                      {availableStudents.length ===
                      0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">
                          Свободные студенты не найдены.
                          Уже связанные студенты
                          отображаются ниже.
                        </div>
                      ) : (
                        availableStudents.map(
                          (student) => {
                            const selected =
                              selectedStudentId ===
                              student.profile.id;

                            return (
                              <button
                                key={
                                  student.profile.id
                                }
                                type="button"
                                onClick={() =>
                                  setSelectedStudentId(
                                    student.profile.id
                                  )
                                }
                                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                                  selected
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                              >
                                <UserAvatar
                                  avatarUrl={
                                    student.profile
                                      .avatar_url
                                  }
                                  alt={getAdminStudentName(
                                    student.profile
                                  )}
                                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                                />

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-gray-900">
                                    {getAdminStudentName(
                                      student.profile
                                    )}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-gray-500">
                                    {student.study.length
                                      ? student.study
                                          .map(
                                            (
                                              study
                                            ) =>
                                              study.groupName
                                          )
                                          .join(', ')
                                      : 'Не добавлен в группу'}
                                    {' · '}
                                    {
                                      student.profile
                                        .phone_number
                                    }
                                  </p>
                                </div>

                                {selected && (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-red-600" />
                                )}
                              </button>
                            );
                          }
                        )
                      )}
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddChildOpen(
                            false
                          );
                          setSelectedStudentId(
                            null
                          );
                        }}
                        disabled={
                          activeAction ===
                          'add-child'
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white"
                      >
                        Отмена
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleAddChild()
                        }
                        disabled={
                          selectedStudentId ===
                            null ||
                          Boolean(activeAction)
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {activeAction ===
                        'add-child' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                        Сохранить связь
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-gray-100">
                  {selectedParent.children.length ===
                  0 ? (
                    <div className="flex flex-col items-center px-6 py-12 text-center">
                      <Link2Off className="h-10 w-10 text-gray-300" />
                      <p className="mt-3 font-semibold text-gray-800">
                        Дети ещё не привязаны
                      </p>
                    </div>
                  ) : (
                    selectedParent.children.map(
                      (link) => {
                        const fullStudent =
                          studentsById.get(
                            link.student_id
                          );

                        return (
                          <div
                            key={link.id}
                            className={`p-4 ${
                              link.is_active
                                ? ''
                                : 'bg-gray-50 opacity-75'
                            }`}
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <UserAvatar
                                  avatarUrl={
                                    link.student
                                      .avatar_url
                                  }
                                  alt={getLinkedStudentName(
                                    link
                                  )}
                                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                                />

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate font-semibold text-gray-900">
                                      {getLinkedStudentName(
                                        link
                                      )}
                                    </p>

                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                        link.is_active
                                          ? 'bg-green-50 text-green-700'
                                          : 'bg-gray-200 text-gray-600'
                                      }`}
                                    >
                                      {link.is_active
                                        ? 'Активная связь'
                                        : 'Связь отключена'}
                                    </span>
                                  </div>

                                  <p className="mt-1 truncate text-xs text-gray-500">
                                    {fullStudent?.study
                                      .length
                                      ? fullStudent.study
                                          .map(
                                            (
                                              study
                                            ) =>
                                              `${study.groupName} · ${study.branchName}`
                                          )
                                          .join('; ')
                                      : 'Студент не добавлен в учебную группу'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <select
                                  value={
                                    link.relationship
                                  }
                                  onChange={(event) =>
                                    void handleRelationshipChange(
                                      link.id,
                                      event.target
                                        .value as ParentRelationship
                                    )
                                  }
                                  disabled={
                                    !link.is_active ||
                                    Boolean(
                                      activeAction
                                    )
                                  }
                                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
                                >
                                  {Object.entries(
                                    RELATIONSHIP_LABELS
                                  ).map(
                                    ([
                                      value,
                                      label,
                                    ]) => (
                                      <option
                                        key={value}
                                        value={value}
                                      >
                                        {label}
                                      </option>
                                    )
                                  )}
                                </select>

                                {link.is_active ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDeactivateLink(
                                        link
                                      )
                                    }
                                    disabled={Boolean(
                                      activeAction
                                    )}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                  >
                                    {activeAction ===
                                    `deactivate-${link.id}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Unlink className="h-4 w-4" />
                                    )}
                                    Отвязать
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleActivateLink(
                                        link
                                      )
                                    }
                                    disabled={Boolean(
                                      activeAction
                                    )}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                                  >
                                    {activeAction ===
                                    `activate-${link.id}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-4 w-4" />
                                    )}
                                    Восстановить
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900">
                  Учётная запись родителя
                </h3>

                <div className="mt-4">
                  <StatusBadges
                    parent={
                      selectedParent.profile
                    }
                  />
                </div>

                <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-gray-500">
                      Телефон
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {
                        selectedParent.profile
                          .phone_number
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Email
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedParent.profile
                        .email ||
                        'Не указан'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Создан
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(
                        selectedParent.profile
                          .created_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Обновлён
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(
                        selectedParent.profile
                          .updated_at
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/dashboard/messages?contactUserId=${selectedParent.profile.id}&contactRole=parent`
                      )
                    }
                    disabled={Boolean(
                      activeAction
                    )}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Написать родителю
                  </button>

                  {selectedParent.profile
                    .phone_number && (
                    <a
                      href={`tel:${selectedParent.profile.phone_number}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                    >
                      <Phone className="h-4 w-4" />
                      Позвонить родителю
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(
                        selectedParent.profile
                      )
                    }
                    disabled={Boolean(
                      activeAction
                    )}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Редактировать профиль
                  </button>

                  {!selectedParent.profile
                    .is_account_verified && (
                    <button
                      type="button"
                      onClick={() =>
                        void runParentAction(
                          'verify-account',
                          verifyUserAccount,
                          'Аккаунт подтверждён'
                        )
                      }
                      disabled={Boolean(
                        activeAction
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {activeAction ===
                      'verify-account' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Подтвердить аккаунт
                    </button>
                  )}

                  {!selectedParent.profile
                    .is_phone_verified && (
                    <button
                      type="button"
                      onClick={() =>
                        void runParentAction(
                          'verify-phone',
                          verifyUserPhone,
                          'Телефон подтверждён'
                        )
                      }
                      disabled={Boolean(
                        activeAction
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                    >
                      {activeAction ===
                      'verify-phone' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Smartphone className="h-4 w-4" />
                      )}
                      Подтвердить телефон
                    </button>
                  )}

                  {selectedParent.profile
                    .is_active ? (
                    <button
                      type="button"
                      onClick={() =>
                        void handleBlock()
                      }
                      disabled={Boolean(
                        activeAction
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                    >
                      {activeAction ===
                      'block' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      Заблокировать
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        void runParentAction(
                          'activate-parent',
                          activateUser,
                          'Родитель активирован'
                        )
                      }
                      disabled={Boolean(
                        activeAction
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                    >
                      {activeAction ===
                      'activate-parent' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      Активировать
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      void handleRemoveParentRole()
                    }
                    disabled={Boolean(
                      activeAction
                    )}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {activeAction ===
                    'remove-role' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldOff className="h-4 w-4" />
                    )}
                    Снять роль родителя
                  </button>
                </div>

                {selectedParent.children.some(
                  (link) => link.is_active
                ) && (
                  <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">
                    Снять роль родителя можно
                    только после отключения всех
                    активных связей с детьми.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      <AdminStudentFormModal
        isOpen={isFormOpen}
        student={editingParent}
        entityLabel="родителя"
        aboutLabel="О родителе"
        isSaving={isSaving}
        error={formError}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
