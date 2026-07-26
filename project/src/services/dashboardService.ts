import {
  getGroup,
  getStudentGroupMemberships,
  type AcademicGroup,
} from '../api/academicApi';

import {
  getStudentAttendance,
  type AttendanceRecord,
} from '../api/attendanceApi';

import {
  getPublishedHomeworks,
  getStudentSubmissions,
  type Homework,
  type HomeworkSubmission,
} from '../api/homeworkApi';

import {
  getUserNotifications,
  type UserNotification,
} from '../api/notificationApi';

import {
  formatLocalDate,
  getGroupLessons,
  getRoom,
  type LessonSchedule,
  type Room,
} from '../api/scheduleApi';

import {
  getUserById,
  type UserProfile,
} from '../api/userApi';

export interface StudentDashboardGroup {
  id: number;
  name: string;
}

export interface StudentDashboardLesson {
  id: number;

  groupId: number;
  groupName: string;

  title: string;
  description: string | null;

  lessonDate: string;
  startTime: string;
  endTime: string;

  teacherId: number;
  teacherName: string;
  teacherAvatarUrl: string | null;

  roomId: number | null;
  roomName: string;

  lessonType: string;
  lessonTypeLabel: string;

  status: string;
  isExtra: boolean;
}

export type StudentDashboardHomeworkStatus =
  | 'pending'
  | 'revision'
  | 'overdue';

export interface StudentDashboardHomework {
  id: number;
  groupId: number;
  groupName: string;
  title: string;
  lessonTitle: string;
  dueAt: string | null;
  status: StudentDashboardHomeworkStatus;
}

export interface StudentDashboardStatistics {
  averageScore: number | null;
  scoreTrend: number | null;
  attendancePercentage: number | null;
  actionableHomeworkCount: number;
}

export interface StudentDashboardData {
  groups: StudentDashboardGroup[];
  todayLessons: StudentDashboardLesson[];
  statistics: StudentDashboardStatistics;
  upcomingHomeworks: StudentDashboardHomework[];
  notifications: UserNotification[];
  unreadNotificationsCount: number;
}

interface DashboardHomeworkItem {
  homework: Homework;
  lesson: LessonSchedule | null;
  submission: HomeworkSubmission | null;
  groupId: number;
  groupName: string;
}

const COMPLETED_SUBMISSION_STATUSES = new Set([
  'submitted',
  'in_review',
  'accepted',
  'rejected',
]);

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getTeacherName(teacher: UserProfile): string {
  const fullName = [
    teacher.first_name,
    teacher.last_name,
  ]
    .filter(
      (value): value is string =>
        typeof value === 'string' &&
        value.trim().length > 0
    )
    .join(' ')
    .trim();

  if (fullName) {
    return fullName;
  }

  if (teacher.user_name?.trim()) {
    return teacher.user_name.trim();
  }

  return `Преподаватель №${teacher.id}`;
}

function getGroupName(group: AcademicGroup): string {
  if (group.name?.trim()) {
    return group.name.trim();
  }

  return `Группа №${group.id}`;
}

function getLessonTitle(
  lesson: LessonSchedule
): string {
  if (lesson.topic?.trim()) {
    return lesson.topic.trim();
  }

  if (lesson.is_extra) {
    return 'Дополнительное занятие';
  }

  return 'Занятие';
}

function getLessonTypeLabel(
  lesson: LessonSchedule
): string {
  if (lesson.is_extra) {
    return 'Дополнительное';
  }

  switch (lesson.lesson_type) {
    case 'regular':
      return 'Основное';

    case 'extra':
      return 'Дополнительное';

    case 'replacement':
      return 'Замена';

    case 'consultation':
      return 'Консультация';

    default:
      return 'Занятие';
  }
}

function getRoomName(
  room: Room | null,
  roomId: number | null
): string {
  if (room?.name?.trim()) {
    return room.name.trim();
  }

  if (roomId !== null) {
    return `Кабинет №${roomId}`;
  }

  return 'Кабинет не указан';
}

function isSubmissionCompleted(
  submission: HomeworkSubmission | null
): boolean {
  return Boolean(
    submission &&
      COMPLETED_SUBMISSION_STATUSES.has(
        submission.status
      )
  );
}

function isHomeworkOverdue(
  homework: Homework,
  submission: HomeworkSubmission | null
): boolean {
  if (
    !homework.due_at ||
    isSubmissionCompleted(submission)
  ) {
    return false;
  }

  const dueTime = new Date(
    homework.due_at
  ).getTime();

  return (
    !Number.isNaN(dueTime) &&
    dueTime < Date.now()
  );
}

function calculateAverageScore(
  items: DashboardHomeworkItem[]
): number | null {
  const gradedItems = items.filter(
    (item) =>
      item.submission?.score !== null &&
      item.submission?.score !== undefined &&
      item.homework.max_score > 0
  );

  if (gradedItems.length === 0) {
    return null;
  }

  const earnedScore = gradedItems.reduce(
    (total, item) =>
      total + (item.submission?.score ?? 0),
    0
  );

  const maximumScore = gradedItems.reduce(
    (total, item) =>
      total + item.homework.max_score,
    0
  );

  if (maximumScore <= 0) {
    return null;
  }

  return Math.round(
    (earnedScore / maximumScore) * 100
  );
}

function calculateMonthlyTrend(
  items: DashboardHomeworkItem[]
): number | null {
  const now = Date.now();
  const currentPeriodStart =
    now - 30 * DAY_IN_MS;
  const previousPeriodStart =
    now - 60 * DAY_IN_MS;

  const currentItems = items.filter((item) => {
    const checkedAt =
      item.submission?.checked_at;

    if (!checkedAt) {
      return false;
    }

    const checkedTime =
      new Date(checkedAt).getTime();

    return (
      checkedTime >= currentPeriodStart &&
      checkedTime <= now
    );
  });

  const previousItems = items.filter((item) => {
    const checkedAt =
      item.submission?.checked_at;

    if (!checkedAt) {
      return false;
    }

    const checkedTime =
      new Date(checkedAt).getTime();

    return (
      checkedTime >= previousPeriodStart &&
      checkedTime < currentPeriodStart
    );
  });

  const currentAverage =
    calculateAverageScore(currentItems);

  const previousAverage =
    calculateAverageScore(previousItems);

  if (
    currentAverage === null ||
    previousAverage === null
  ) {
    return null;
  }

  return currentAverage - previousAverage;
}

function calculateAttendancePercentage(
  records: AttendanceRecord[],
  activeLessonIds: Set<number>
): number | null {
  const activeRecords = records.filter(
    (record) =>
      activeLessonIds.has(record.lesson_id)
  );

  const presentCount = activeRecords.filter(
    (record) => record.status === 'present'
  ).length;

  const absentCount = activeRecords.filter(
    (record) => record.status === 'absent'
  ).length;

  const lateCount = activeRecords.filter(
    (record) => record.status === 'late'
  ).length;

  const countedLessons =
    presentCount + absentCount + lateCount;

  if (countedLessons === 0) {
    return null;
  }

  return Math.round(
    ((presentCount + lateCount) /
      countedLessons) *
      100
  );
}

function getHomeworkStatus(
  item: DashboardHomeworkItem
): StudentDashboardHomeworkStatus {
  if (
    isHomeworkOverdue(
      item.homework,
      item.submission
    )
  ) {
    return 'overdue';
  }

  if (
    item.submission?.status ===
    'needs_revision'
  ) {
    return 'revision';
  }

  return 'pending';
}

function getHomeworkSortTime(
  item: DashboardHomeworkItem
): number {
  if (!item.homework.due_at) {
    return Number.POSITIVE_INFINITY;
  }

  const dueTime = new Date(
    item.homework.due_at
  ).getTime();

  return Number.isNaN(dueTime)
    ? Number.POSITIVE_INFINITY
    : dueTime;
}

async function loadTeacherSafely(
  teacherId: number
): Promise<UserProfile | null> {
  try {
    return await getUserById(teacherId);
  } catch (error) {
    console.error(
      `Не удалось получить преподавателя ${teacherId}:`,
      error
    );

    return null;
  }
}

async function loadRoomSafely(
  roomId: number
): Promise<Room | null> {
  try {
    return await getRoom(roomId);
  } catch (error) {
    console.error(
      `Не удалось получить кабинет ${roomId}:`,
      error
    );

    return null;
  }
}

/**
 * Загружает все данные главной страницы студента.
 *
 * Обязательны только учебные группы и занятия. Сбой
 * отдельного дополнительного сервиса не блокирует весь
 * дашборд: соответствующий блок покажет пустое состояние.
 */
export async function loadStudentDashboard(
  userId: number
): Promise<StudentDashboardData> {
  const memberships =
    await getStudentGroupMemberships(userId);

  if (memberships.length === 0) {
    throw new Error(
      'Вы пока не добавлены ни в одну учебную группу.'
    );
  }

  const groupIds = Array.from(
    new Set(
      memberships.map(
        (membership) => membership.group_id
      )
    )
  );

  const loadedGroups = await Promise.all(
    groupIds.map((groupId) => getGroup(groupId))
  );

  const groups: StudentDashboardGroup[] =
    loadedGroups
      .map((group) => ({
        id: group.id,
        name: getGroupName(group),
      }))
      .sort((firstGroup, secondGroup) =>
        firstGroup.name.localeCompare(
          secondGroup.name,
          'ru'
        )
      );

  const [
    lessonsResult,
    homeworksResult,
    submissionsResult,
    attendanceResult,
    notificationsResult,
  ] = await Promise.allSettled([
    Promise.all(
      groups.map((group) =>
        getGroupLessons(group.id)
      )
    ),
    getPublishedHomeworks(),
    getStudentSubmissions(userId),
    getStudentAttendance(userId),
    getUserNotifications(userId, 4),
  ]);

  if (lessonsResult.status === 'rejected') {
    throw lessonsResult.reason;
  }

  const lessons = lessonsResult.value.flat();

  const homeworks =
    homeworksResult.status === 'fulfilled'
      ? homeworksResult.value
      : [];

  const submissions =
    submissionsResult.status === 'fulfilled'
      ? submissionsResult.value
      : [];

  const attendanceRecords =
    attendanceResult.status === 'fulfilled'
      ? attendanceResult.value.items
      : [];

  const notificationResponse =
    notificationsResult.status === 'fulfilled'
      ? notificationsResult.value
      : null;

  if (homeworksResult.status === 'rejected') {
    console.error(
      'Не удалось загрузить задания для дашборда:',
      homeworksResult.reason
    );
  }

  if (submissionsResult.status === 'rejected') {
    console.error(
      'Не удалось загрузить ответы студента для дашборда:',
      submissionsResult.reason
    );
  }

  if (attendanceResult.status === 'rejected') {
    console.error(
      'Не удалось загрузить посещаемость для дашборда:',
      attendanceResult.reason
    );
  }

  if (
    notificationsResult.status === 'rejected'
  ) {
    console.error(
      'Не удалось загрузить уведомления для дашборда:',
      notificationsResult.reason
    );
  }

  const groupNamesById = new Map<number, string>(
    groups.map((group) => [
      group.id,
      group.name,
    ])
  );

  const lessonsById = new Map<
    number,
    LessonSchedule
  >(
    lessons.map((lesson) => [
      lesson.id,
      lesson,
    ])
  );

  const activeGroupIds = new Set(
    groups.map((group) => group.id)
  );

  const activeLessonIds = new Set(
    lessons.map((lesson) => lesson.id)
  );

  const submissionsByHomeworkId = new Map(
    submissions.map((submission) => [
      submission.homework_id,
      submission,
    ])
  );

  const homeworkItems: DashboardHomeworkItem[] =
    homeworks
      .filter((homework) => {
        if (
          homework.group_id !== null &&
          activeGroupIds.has(homework.group_id)
        ) {
          return true;
        }

        return activeLessonIds.has(
          homework.lesson_id
        );
      })
      .map((homework) => {
        const lesson =
          lessonsById.get(homework.lesson_id) ??
          null;

        const groupId =
          homework.group_id ??
          lesson?.group_id ??
          0;

        return {
          homework,
          lesson,
          submission:
            submissionsByHomeworkId.get(
              homework.id
            ) ?? null,
          groupId,
          groupName:
            groupNamesById.get(groupId) ??
            `Группа №${groupId}`,
        };
      })
      .filter((item) => item.groupId > 0);

  const actionableHomeworkItems =
    homeworkItems
      .filter(
        (item) =>
          !isSubmissionCompleted(
            item.submission
          )
      )
      .sort((first, second) => {
        const firstOverdue =
          isHomeworkOverdue(
            first.homework,
            first.submission
          );

        const secondOverdue =
          isHomeworkOverdue(
            second.homework,
            second.submission
          );

        if (firstOverdue !== secondOverdue) {
          return firstOverdue ? -1 : 1;
        }

        return (
          getHomeworkSortTime(first) -
          getHomeworkSortTime(second)
        );
      });

  const upcomingHomeworks =
    actionableHomeworkItems
      .slice(0, 3)
      .map(
        (item): StudentDashboardHomework => ({
          id: item.homework.id,
          groupId: item.groupId,
          groupName: item.groupName,
          title: item.homework.title,
          lessonTitle:
            item.lesson?.topic?.trim() ||
            'Занятие',
          dueAt: item.homework.due_at,
          status: getHomeworkStatus(item),
        })
      );

  const today = formatLocalDate(new Date());

  const todayLessons = lessons
    .filter(
      (lesson) =>
        lesson.lesson_date === today &&
        lesson.status !== 'cancelled'
    )
    .sort((first, second) =>
      first.start_time.localeCompare(
        second.start_time
      )
    );

  const teacherIds = Array.from(
    new Set(
      todayLessons.map(
        (lesson) => lesson.teacher_id
      )
    )
  );

  const roomIds = Array.from(
    new Set(
      todayLessons
        .map((lesson) => lesson.room_id)
        .filter(
          (roomId): roomId is number =>
            roomId !== null
        )
    )
  );

  const [teacherEntries, roomEntries] =
    await Promise.all([
      Promise.all(
        teacherIds.map(async (teacherId) => {
          const teacher =
            await loadTeacherSafely(teacherId);

          return [teacherId, teacher] as const;
        })
      ),
      Promise.all(
        roomIds.map(async (roomId) => {
          const room =
            await loadRoomSafely(roomId);

          return [roomId, room] as const;
        })
      ),
    ]);

  const teachersById = new Map<
    number,
    UserProfile | null
  >(teacherEntries);

  const roomsById = new Map<number, Room | null>(
    roomEntries
  );

  const dashboardLessons: StudentDashboardLesson[] =
    todayLessons.map((lesson) => {
      const teacher =
        teachersById.get(lesson.teacher_id) ?? null;

      const room =
        lesson.room_id !== null
          ? roomsById.get(lesson.room_id) ?? null
          : null;

      return {
        id: lesson.id,

        groupId: lesson.group_id,
        groupName:
          groupNamesById.get(lesson.group_id) ??
          `Группа №${lesson.group_id}`,

        title: getLessonTitle(lesson),
        description: lesson.description,

        lessonDate: lesson.lesson_date,
        startTime: lesson.start_time,
        endTime: lesson.end_time,

        teacherId: lesson.teacher_id,
        teacherName: teacher
          ? getTeacherName(teacher)
          : `Преподаватель №${lesson.teacher_id}`,

        teacherAvatarUrl:
          teacher?.avatar_url ?? null,

        roomId: lesson.room_id,
        roomName: getRoomName(
          room,
          lesson.room_id
        ),

        lessonType: lesson.lesson_type,
        lessonTypeLabel:
          getLessonTypeLabel(lesson),

        status: lesson.status,
        isExtra: lesson.is_extra,
      };
    });

  return {
    groups,
    todayLessons: dashboardLessons,
    statistics: {
      averageScore:
        calculateAverageScore(homeworkItems),
      scoreTrend:
        calculateMonthlyTrend(homeworkItems),
      attendancePercentage:
        calculateAttendancePercentage(
          attendanceRecords,
          activeLessonIds
        ),
      actionableHomeworkCount:
        actionableHomeworkItems.length,
    },
    upcomingHomeworks,
    notifications:
      notificationResponse?.items ?? [],
    unreadNotificationsCount:
      notificationResponse?.unread_count ?? 0,
  };
}
