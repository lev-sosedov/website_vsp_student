import {
  AlertCircle,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  type AcademicBranch,
  type AcademicEducationPlan,
  type AcademicGroup,
} from '../../../api/academicApi';

import {
  loadAdminGroups,
} from '../../../services/adminGroupsService';

import {
  getUsers,
  type UserProfile,
} from '../../../api/userApi';

interface AnalyticsData {
  users: UserProfile[];
  groups: AcademicGroup[];
  branches: AcademicBranch[];
  plans: AcademicEducationPlan[];
  studentCountByGroupId: Record<number, number>;
  teacherAssignedByGroupId: Record<number, boolean>;
}

interface DistributionItem {
  id: number;
  name: string;
  groups: number;
  students: number;
}

const EMPTY_DATA: AnalyticsData = {
  users: [],
  groups: [],
  branches: [],
  plans: [],
  studentCountByGroupId: {},
  teacherAssignedByGroupId: {},
};

const ROLE_LABELS: Record<string, string> = {
  user: 'Без назначенной роли',
  parent: 'Родители',
  student: 'Студенты',
  teacher: 'Преподаватели',
  admin: 'Администраторы',
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось загрузить аналитику';
}

function isActiveUser(user: UserProfile): boolean {
  return user.is_active;
}

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function getBranchName(branch: AcademicBranch): string {
  return (
    branch.name?.trim() ||
    branch.title?.trim() ||
    branch.short_name?.trim() ||
    `Филиал №${branch.id}`
  );
}

function getPlanName(
  plan: AcademicEducationPlan
): string {
  return (
    plan.name?.trim() ||
    plan.title?.trim() ||
    `Программа №${plan.id}`
  );
}

function isGroupActive(group: AcademicGroup): boolean {
  return (
    group.is_active !== false &&
    group.is_closed !== true
  );
}

function isEntityActive(
  entity: {
    is_active?: boolean;
    closed_at?: string | null;
  }
): boolean {
  return (
    entity.is_active !== false &&
    !entity.closed_at
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function percent(
  part: number,
  total: number
): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

async function loadAllUsers(): Promise<UserProfile[]> {
  const result: UserProfile[] = [];
  const limit = 100;
  let skip = 0;
  let total = Number.POSITIVE_INFINITY;

  while (skip < total) {
    const response = await getUsers({
      skip,
      limit,
    });

    result.push(...response.items);
    total = response.total;

    if (response.items.length === 0) {
      break;
    }

    skip += response.items.length;
  }

  return result;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            {subtitle}
          </p>
        </div>

        <div className="rounded-xl bg-red-50 p-3 text-red-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DistributionCard({
  title,
  icon: Icon,
  items,
  emptyText,
}: {
  title: string;
  icon: typeof Users;
  items: DistributionItem[];
  emptyText: string;
}) {
  const maximum = Math.max(
    1,
    ...items.map((item) => item.students)
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-bold text-gray-900">
          {title}
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          {emptyText}
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {items.map((item) => {
            const width = Math.max(
              4,
              Math.round(
                (item.students / maximum) * 100
              )
            );

            return (
              <div key={item.id}>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-800">
                      {item.name}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Групп: {item.groups}
                    </p>
                  </div>

                  <span className="shrink-0 font-bold text-gray-900">
                    {formatNumber(item.students)}
                    {' '}
                    студентов
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{
                      width: `${width}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] =
    useState<AnalyticsData>(EMPTY_DATA);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const loadAnalytics = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [
          users,
          adminGroupsData,
        ] = await Promise.all([
          loadAllUsers(),
          loadAdminGroups(),
        ]);

        setData({
          users,
          groups: adminGroupsData.items.map(
            (item) => item.group
          ),
          branches: adminGroupsData.branches,
          plans: adminGroupsData.educationPlans,
          studentCountByGroupId:
            Object.fromEntries(
              adminGroupsData.items.map(
                (item) => [
                  item.group.id,
                  item.studentCount,
                ]
              )
            ),
          teacherAssignedByGroupId:
            Object.fromEntries(
              adminGroupsData.items.map(
                (item) => [
                  item.group.id,
                  item.teacher !== null,
                ]
              )
            ),
        });
      } catch (loadError) {
        setData(EMPTY_DATA);
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
    void loadAnalytics();
  }, [loadAnalytics]);

  const analytics = useMemo(() => {
    const activeUsers =
      data.users.filter(isActiveUser);
    const activeGroups =
      data.groups.filter(isGroupActive);
    const activeBranches =
      data.branches.filter(isEntityActive);
    const activePlans =
      data.plans.filter(isEntityActive);

    const roleCounts = activeUsers.reduce<
      Record<string, number>
    >((result, user) => {
      const role = normalizeRole(user.role);
      result[role] =
        (result[role] ?? 0) + 1;
      return result;
    }, {});

    const totalGroupStudents =
      activeGroups.reduce(
        (total, group) =>
          total +
          (
            data.studentCountByGroupId[
              group.id
            ] ?? 0
          ),
        0
      );

    const groupsWithoutTeacher =
      activeGroups.filter(
        (group) =>
          !data.teacherAssignedByGroupId[
            group.id
          ]
      ).length;

    const groupsWithoutBranch =
      activeGroups.filter(
        (group) => !group.branch_id
      ).length;

    const groupsWithoutPlan =
      activeGroups.filter(
        (group) =>
          !group.education_plan_id
      ).length;

    const thirtyDaysAgo =
      Date.now() -
      30 * 24 * 60 * 60 * 1000;

    const recentUsers =
      data.users.filter((user) => {
        const time =
          new Date(
            user.created_at
          ).getTime();

        return (
          Number.isFinite(time) &&
          time >= thirtyDaysAgo
        );
      });

    const branchDistribution =
      activeBranches
        .map((branch) => {
          const groups = activeGroups.filter(
            (group) =>
              group.branch_id === branch.id
          );

          return {
            id: branch.id,
            name: getBranchName(branch),
            groups: groups.length,
            students: groups.reduce(
              (total, group) =>
                total +
                (
                  data
                    .studentCountByGroupId[
                    group.id
                  ] ?? 0
                ),
              0
            ),
          };
        })
        .sort(
          (first, second) =>
            second.students -
            first.students
        );

    const planDistribution =
      activePlans
        .map((plan) => {
          const groups = activeGroups.filter(
            (group) =>
              group.education_plan_id ===
              plan.id
          );

          return {
            id: plan.id,
            name: getPlanName(plan),
            groups: groups.length,
            students: groups.reduce(
              (total, group) =>
                total +
                (
                  data
                    .studentCountByGroupId[
                    group.id
                  ] ?? 0
                ),
              0
            ),
          };
        })
        .sort(
          (first, second) =>
            second.students -
            first.students
        );

    return {
      activeUsers,
      activeGroups,
      activeBranches,
      activePlans,
      roleCounts,
      totalGroupStudents,
      groupsWithoutTeacher,
      groupsWithoutBranch,
      groupsWithoutPlan,
      recentUsers,
      branchDistribution,
      planDistribution,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <p>Собираем аналитику платформы...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="flex-1">
            <h2 className="font-bold text-red-800">
              Не удалось загрузить аналитику
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadAnalytics()
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeStudentCount =
    analytics.roleCounts.student ?? 0;
  const activeTeacherCount =
    analytics.roleCounts.teacher ?? 0;
  const activeParentCount =
    analytics.roleCounts.parent ?? 0;
  const pendingRoleCount =
    analytics.roleCounts.user ?? 0;

  const groupsWithTeacher =
    analytics.activeGroups.length -
    analytics.groupsWithoutTeacher;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
            <TrendingUp className="h-4 w-4" />
            Сводные данные платформы
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Аналитика
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Пользователи, учебные группы,
            филиалы и программы на основании
            текущих данных системы.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Студенты"
          value={formatNumber(
            activeStudentCount
          )}
          subtitle={`В составах групп: ${formatNumber(
            analytics.totalGroupStudents
          )}`}
          icon={GraduationCap}
        />

        <StatCard
          title="Преподаватели"
          value={formatNumber(
            activeTeacherCount
          )}
          subtitle={`Назначены в ${groupsWithTeacher} из ${analytics.activeGroups.length} групп`}
          icon={Users}
        />

        <StatCard
          title="Активные группы"
          value={formatNumber(
            analytics.activeGroups.length
          )}
          subtitle={`Филиалов: ${analytics.activeBranches.length}`}
          icon={Layers}
        />

        <StatCard
          title="Учебные программы"
          value={formatNumber(
            analytics.activePlans.length
          )}
          subtitle={`Родителей в системе: ${formatNumber(
            activeParentCount
          )}`}
          icon={BookOpen}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />

            <h2 className="font-bold text-gray-900">
              Новые регистрации
            </h2>
          </div>

          <p className="mt-4 text-3xl font-bold text-gray-900">
            {formatNumber(
              analytics.recentUsers.length
            )}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            За последние 30 дней
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-amber-800">
            <ShieldAlert className="h-5 w-5" />

            <h2 className="font-bold">
              Ожидают назначения роли
            </h2>
          </div>

          <p className="mt-4 text-3xl font-bold text-amber-900">
            {formatNumber(
              pendingRoleCount
            )}
          </p>

          <p className="mt-1 text-sm text-amber-700">
            Зарегистрированы с ролью user
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />

            <h2 className="font-bold">
              Активные пользователи
            </h2>
          </div>

          <p className="mt-4 text-3xl font-bold text-green-900">
            {formatNumber(
              analytics.activeUsers.length
            )}
          </p>

          <p className="mt-1 text-sm text-green-700">
            {percent(
              analytics.activeUsers.length,
              data.users.length
            )}
            % от всех учётных записей
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DistributionCard
          title="Студенты по филиалам"
          icon={Building2}
          items={
            analytics.branchDistribution
          }
          emptyText="Активные филиалы пока не созданы."
        />

        <DistributionCard
          title="Студенты по учебным программам"
          icon={BookOpen}
          items={
            analytics.planDistribution
          }
          emptyText="Активные учебные программы пока не созданы."
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600" />

          <h2 className="text-lg font-bold text-gray-900">
            Требуют внимания
          </h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-2xl font-bold text-gray-900">
              {analytics.groupsWithoutTeacher}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              групп без преподавателя
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-2xl font-bold text-gray-900">
              {analytics.groupsWithoutBranch}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              групп без филиала
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-2xl font-bold text-gray-900">
              {analytics.groupsWithoutPlan}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              групп без учебной программы
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Пользователи по ролям
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(ROLE_LABELS).map(
            ([role, label]) => (
              <div
                key={role}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(
                    analytics.roleCounts[
                      role
                    ] ?? 0
                  )}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {label}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
