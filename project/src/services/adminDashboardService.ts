import {
  getNewsPosts,
} from '../api/newsApi';
import {
  getUserNotifications,
} from '../api/notificationApi';
import {
  getParentChildren,
} from '../api/parentStudentApi';
import {
  formatLocalDate,
  getLessons,
  type LessonSchedule,
} from '../api/scheduleApi';
import {
  getUsers,
  type UserProfile,
} from '../api/userApi';
import {
  loadAdminGroups,
  type AdminGroupItem,
} from './adminGroupsService';

export type AdminDashboardRole =
  | 'user'
  | 'parent'
  | 'student'
  | 'teacher'
  | 'admin';

export interface AdminDashboardRoleStats {
  total: number;
  active: number;
}

export interface AdminDashboardLesson {
  id: number;
  startTime: string;
  endTime: string;
  topic: string;
  groupName: string;
  teacherName: string;
  status: string;
}

export interface AdminDashboardData {
  roleStats: Record<
    AdminDashboardRole,
    AdminDashboardRoleStats
  >;

  totalGroups: number;
  activeGroups: number;
  totalBranches: number;
  activeBranches: number;
  totalPrograms: number;
  activePrograms: number;
  studentsInGroups: number;

  groupsWithoutTeacher: number;
  unverifiedUsers: number;
  blockedUsers: number;
  parentsWithoutChildren: number | null;

  todayLessons: AdminDashboardLesson[];
  publishedNews: number | null;
  unreadNotifications: number | null;

  recentUsers: UserProfile[];
  warnings: string[];
}

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

const DASHBOARD_ROLES: AdminDashboardRole[] = [
  'user',
  'parent',
  'student',
  'teacher',
  'admin',
];

function normalizeRole(
  role: string
): AdminDashboardRole {
  const normalized = role
    .trim()
    .toLowerCase();

  return DASHBOARD_ROLES.includes(
    normalized as AdminDashboardRole
  )
    ? normalized as AdminDashboardRole
    : 'user';
}

function createEmptyRoleStats(): Record<
  AdminDashboardRole,
  AdminDashboardRoleStats
> {
  return {
    user: {
      total: 0,
      active: 0,
    },
    parent: {
      total: 0,
      active: 0,
    },
    student: {
      total: 0,
      active: 0,
    },
    teacher: {
      total: 0,
      active: 0,
    },
    admin: {
      total: 0,
      active: 0,
    },
  };
}

function isGroupActive(
  item: AdminGroupItem
): boolean {
  return (
    item.group.is_active !== false &&
    item.group.is_closed !== true
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

function getValidTime(
  value: string
): number {
  const time = new Date(value).getTime();

  return Number.isFinite(time)
    ? time
    : 0;
}

async function loadAllUsers(): Promise<
  UserProfile[]
> {
  const users: UserProfile[] = [];

  for (
    let page = 0;
    page < MAX_PAGES;
    page += 1
  ) {
    const response = await getUsers({
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    });

    users.push(...response.items);

    if (
      response.items.length < PAGE_SIZE ||
      users.length >= response.total
    ) {
      break;
    }
  }

  return Array.from(
    new Map(
      users.map((user) => [
        user.id,
        user,
      ])
    ).values()
  );
}

export function getAdminDashboardUserName(
  user: UserProfile
): string {
  const name = [
    user.first_name,
    user.user_name,
    user.last_name,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || `Пользователь №${user.id}`;
}

function getLessonTeacherName(
  lesson: LessonSchedule,
  userById: Map<number, UserProfile>,
  groupItem: AdminGroupItem | undefined
): string {
  const directTeacher =
    userById.get(lesson.teacher_id);

  if (directTeacher) {
    return getAdminDashboardUserName(
      directTeacher
    );
  }

  if (
    groupItem?.teacher &&
    groupItem.teacher.id ===
      lesson.teacher_id
  ) {
    return getAdminDashboardUserName(
      groupItem.teacher
    );
  }

  return 'Преподаватель не указан';
}

function mapLessons(
  lessons: LessonSchedule[],
  groups: AdminGroupItem[],
  users: UserProfile[]
): AdminDashboardLesson[] {
  const groupById = new Map(
    groups.map((item) => [
      item.group.id,
      item,
    ])
  );

  const userById = new Map(
    users.map((user) => [
      user.id,
      user,
    ])
  );

  return lessons
    .filter(
      (lesson) =>
        lesson.status !== 'cancelled'
    )
    .sort(
      (first, second) =>
        first.start_time.localeCompare(
          second.start_time
        )
    )
    .map((lesson) => {
      const groupItem =
        groupById.get(lesson.group_id);

      return {
        id: lesson.id,
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        topic:
          lesson.topic?.trim() ||
          'Тема занятия не указана',
        groupName:
          groupItem?.group.name?.trim() ||
          `Группа №${lesson.group_id}`,
        teacherName:
          getLessonTeacherName(
            lesson,
            userById,
            groupItem
          ),
        status: lesson.status,
      };
    });
}

export async function loadAdminDashboard(
  adminId: number
): Promise<AdminDashboardData> {
  const warnings: string[] = [];

  const [
    users,
    groupData,
  ] = await Promise.all([
    loadAllUsers(),
    loadAdminGroups(),
  ]);

  const roleStats =
    createEmptyRoleStats();

  users.forEach((user) => {
    const role =
      normalizeRole(user.role);

    roleStats[role].total += 1;

    if (user.is_active) {
      roleStats[role].active += 1;
    }
  });

  const activeGroupItems =
    groupData.items.filter(
      isGroupActive
    );

  const activeParents =
    users.filter(
      (user) =>
        normalizeRole(user.role) ===
          'parent' &&
        user.is_active
    );

  const today =
    formatLocalDate(new Date());

  const [
    lessonResult,
    newsResult,
    notificationResult,
    parentLinkResults,
  ] = await Promise.all([
    getLessons({
      dateFrom: today,
      dateTo: today,
      limit: 200,
    })
      .then((value) => ({
        ok: true as const,
        value,
      }))
      .catch((error: unknown) => ({
        ok: false as const,
        error,
      })),

    getNewsPosts({
      status: 'published',
      isActive: true,
      limit: 1,
    })
      .then((value) => ({
        ok: true as const,
        value,
      }))
      .catch((error: unknown) => ({
        ok: false as const,
        error,
      })),

    adminId > 0
      ? getUserNotifications(
          adminId,
          10
        )
          .then((value) => ({
            ok: true as const,
            value,
          }))
          .catch((error: unknown) => ({
            ok: false as const,
            error,
          }))
      : Promise.resolve({
          ok: false as const,
          error:
            new Error(
              'ID администратора не определён'
            ),
        }),

    Promise.allSettled(
      activeParents.map((parent) =>
        getParentChildren(
          parent.id,
          true
        )
      )
    ),
  ]);

  if (!lessonResult.ok) {
    warnings.push(
      'Не удалось загрузить расписание на сегодня.'
    );
  }

  if (!newsResult.ok) {
    warnings.push(
      'Не удалось получить количество опубликованных новостей.'
    );
  }

  if (!notificationResult.ok) {
    warnings.push(
      'Не удалось получить непрочитанные уведомления.'
    );
  }

  const failedParentLinks =
    parentLinkResults.filter(
      (result) =>
        result.status === 'rejected'
    ).length;

  if (failedParentLinks > 0) {
    warnings.push(
      'Не удалось проверить привязки детей у части родителей.'
    );
  }

  const parentsWithoutChildren =
    failedParentLinks === 0
      ? parentLinkResults.filter(
          (result) =>
            result.status ===
              'fulfilled' &&
            result.value.length === 0
        ).length
      : null;

  const recentUsers = [...users]
    .sort(
      (first, second) =>
        getValidTime(
          second.created_at
        ) -
        getValidTime(
          first.created_at
        )
    )
    .slice(0, 5);

  return {
    roleStats,

    totalGroups:
      groupData.items.length,
    activeGroups:
      activeGroupItems.length,

    totalBranches:
      groupData.branches.length,
    activeBranches:
      groupData.branches.filter(
        isEntityActive
      ).length,

    totalPrograms:
      groupData.educationPlans.length,
    activePrograms:
      groupData.educationPlans.filter(
        isEntityActive
      ).length,

    studentsInGroups:
      activeGroupItems.reduce(
        (total, item) =>
          total + item.studentCount,
        0
      ),

    groupsWithoutTeacher:
      activeGroupItems.filter(
        (item) => item.teacher === null
      ).length,

    unverifiedUsers:
      users.filter(
        (user) =>
          user.is_active &&
          (
            !user.is_account_verified ||
            !user.is_phone_verified
          )
      ).length,

    blockedUsers:
      users.filter(
        (user) => !user.is_active
      ).length,

    parentsWithoutChildren,

    todayLessons:
      lessonResult.ok
        ? mapLessons(
            lessonResult.value,
            groupData.items,
            users
          )
        : [],

    publishedNews:
      newsResult.ok
        ? newsResult.value.total
        : null,

    unreadNotifications:
      notificationResult.ok
        ? notificationResult
            .value.unread_count
        : null,

    recentUsers,
    warnings,
  };
}
