import {
  getGroup,
  getStudentGroupMemberships,
  type AcademicGroup,
} from '../api/academicApi';

import {
  getRoom,
  getTodayLessons,
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

export interface StudentDashboardData {
  groups: StudentDashboardGroup[];
  todayLessons: StudentDashboardLesson[];
}

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
 * Загружает данные главной страницы студента:
 * все его активные учебные группы и сегодняшние занятия.
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

  const lessonsByGroup = await Promise.all(
    groups.map(async (group) => ({
      group,
      lessons: await getTodayLessons(group.id),
    }))
  );

  const lessons = lessonsByGroup.flatMap(
    ({ lessons: groupLessons }) => groupLessons
  );

  const teacherIds = Array.from(
    new Set(
      lessons.map((lesson) => lesson.teacher_id)
    )
  );

  const roomIds = Array.from(
    new Set(
      lessons
        .map((lesson) => lesson.room_id)
        .filter(
          (roomId): roomId is number =>
            roomId !== null
        )
    )
  );

  const teacherEntries = await Promise.all(
    teacherIds.map(async (teacherId) => {
      const teacher =
        await loadTeacherSafely(teacherId);

      return [teacherId, teacher] as const;
    })
  );

  const roomEntries = await Promise.all(
    roomIds.map(async (roomId) => {
      const room = await loadRoomSafely(roomId);

      return [roomId, room] as const;
    })
  );

  const teachersById = new Map<
    number,
    UserProfile | null
  >(teacherEntries);

  const roomsById = new Map<number, Room | null>(
    roomEntries
  );

  const groupNamesById = new Map<number, string>(
    groups.map((group) => [
      group.id,
      group.name,
    ])
  );

  const dashboardLessons: StudentDashboardLesson[] =
    lessons.map((lesson) => {
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

  dashboardLessons.sort(
    (firstLesson, secondLesson) => {
      const dateComparison =
        firstLesson.lessonDate.localeCompare(
          secondLesson.lessonDate
        );

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return firstLesson.startTime.localeCompare(
        secondLesson.startTime
      );
    }
  );

  return {
    groups,
    todayLessons: dashboardLessons,
  };
}