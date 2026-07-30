import {
  getGroup,
  getStudentGroupMemberships,
} from '../api/academicApi';

import {
  getParentChildren,
  type ParentStudentWithStudent,
} from '../api/parentStudentApi';

import {
  formatLocalDate,
  getGroupLessonsByDateRange,
  getRoom,
  type LessonSchedule,
} from '../api/scheduleApi';

import {
  getUsersByIds,
} from '../api/userApi';


export interface ParentScheduleChild {
  id: number;
  name: string;
  phoneNumber: string;
  email: string | null;
  avatarUrl: string | null;
}


export interface ParentScheduleGroup {
  id: number;
  name: string;
}


export interface ParentScheduleLesson
  extends LessonSchedule {
  groupName: string;
  teacherName: string;
  roomName: string;
}


export interface ParentScheduleData {
  groups: ParentScheduleGroup[];
  lessons: ParentScheduleLesson[];
  hasActiveGroup: boolean;
  warnings: string[];
}


function getChildName(
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


function getUserName(
  user:
    | {
        id: number;
        first_name: string | null;
        last_name: string | null;
        user_name: string;
      }
    | undefined,
  fallbackId: number
): string {
  if (!user) {
    return `Преподаватель №${fallbackId}`;
  }

  return (
    [
      user.last_name,
      user.first_name,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim() ||
    user.user_name?.trim() ||
    `Преподаватель №${fallbackId}`
  );
}


export async function loadParentScheduleChildren(
  parentId: number
): Promise<ParentScheduleChild[]> {
  if (
    !Number.isInteger(parentId) ||
    parentId <= 0
  ) {
    throw new Error(
      'Не удалось определить ID родителя'
    );
  }

  const links = await getParentChildren(
    parentId,
    true
  );

  return links
    .filter(
      (link) =>
        link.is_active &&
        link.student.is_active
    )
    .map((link) => ({
      id: link.student_id,
      name: getChildName(link),
      phoneNumber:
        link.student.phone_number,
      email:
        link.student.email,
      avatarUrl:
        link.student.avatar_url,
    }))
    .sort((first, second) =>
      first.name.localeCompare(
        second.name,
        'ru'
      )
    );
}


export async function loadParentChildSchedule(
  studentId: number,
  dateFrom: Date,
  dateTo: Date
): Promise<ParentScheduleData> {
  if (
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    throw new Error(
      'Не удалось определить ID ребёнка'
    );
  }

  const warnings: string[] = [];

  const memberships =
    await getStudentGroupMemberships(
      studentId
    );

  const groupIds = Array.from(
    new Set(
      memberships.map(
        (membership) =>
          membership.group_id
      )
    )
  );

  if (groupIds.length === 0) {
    return {
      groups: [],
      lessons: [],
      hasActiveGroup: false,
      warnings,
    };
  }

  const groupResults =
    await Promise.allSettled(
      groupIds.map((groupId) =>
        getGroup(groupId)
      )
    );

  const groups =
    groupResults
      .map(
        (
          result,
          index
        ): ParentScheduleGroup => {
          const groupId =
            groupIds[index];

          return {
            id: groupId,
            name:
              result.status ===
              'fulfilled'
                ? (
                    result.value.name?.trim() ||
                    `Группа №${groupId}`
                  )
                : `Группа №${groupId}`,
          };
        }
      )
      .sort((first, second) =>
        first.name.localeCompare(
          second.name,
          'ru'
        )
      );

  const failedGroups =
    groupResults.filter(
      (result) =>
        result.status === 'rejected'
    ).length;

  if (failedGroups > 0) {
    warnings.push(
      `Не удалось получить данные ${failedGroups} групп.`
    );
  }

  const dateFromString =
    formatLocalDate(dateFrom);

  const dateToString =
    formatLocalDate(dateTo);

  const lessonResults =
    await Promise.allSettled(
      groups.map((group) =>
        getGroupLessonsByDateRange(
          group.id,
          dateFromString,
          dateToString
        )
      )
    );

  const failedLessonGroups =
    lessonResults.filter(
      (result) =>
        result.status === 'rejected'
    ).length;

  if (failedLessonGroups > 0) {
    warnings.push(
      `Не удалось загрузить расписание ${failedLessonGroups} групп.`
    );
  }

  const rawLessons =
    lessonResults.flatMap(
      (result) =>
        result.status ===
        'fulfilled'
          ? result.value
          : []
    );

  const groupNameById =
    new Map(
      groups.map((group) => [
        group.id,
        group.name,
      ])
    );

  const teacherIds =
    Array.from(
      new Set(
        rawLessons.map(
          (lesson) =>
            lesson.teacher_id
        )
      )
    );

  const roomIds =
    Array.from(
      new Set(
        rawLessons.map(
          (lesson) =>
            lesson.room_id
        )
      )
    );

  const [
    teachers,
    roomResults,
  ] = await Promise.all([
    getUsersByIds(
      teacherIds
    ),
    Promise.allSettled(
      roomIds.map((roomId) =>
        getRoom(roomId)
      )
    ),
  ]);

  const roomNameById =
    new Map<number, string>();

  roomResults.forEach(
    (result, index) => {
      const roomId =
        roomIds[index];

      roomNameById.set(
        roomId,
        result.status ===
          'fulfilled'
          ? (
              result.value.name?.trim() ||
              `Кабинет №${roomId}`
            )
          : `Кабинет №${roomId}`
      );
    }
  );

  const failedRooms =
    roomResults.filter(
      (result) =>
        result.status === 'rejected'
    ).length;

  if (failedRooms > 0) {
    warnings.push(
      `Не удалось получить данные ${failedRooms} кабинетов.`
    );
  }

  const lessons =
    rawLessons
      .map(
        (
          lesson
        ): ParentScheduleLesson => ({
          ...lesson,
          groupName:
            groupNameById.get(
              lesson.group_id
            ) ??
            `Группа №${lesson.group_id}`,
          teacherName:
            getUserName(
              teachers[
                lesson.teacher_id
              ],
              lesson.teacher_id
            ),
          roomName:
            roomNameById.get(
              lesson.room_id
            ) ??
            `Кабинет №${lesson.room_id}`,
        })
      )
      .sort(
        (first, second) => {
          const dateCompare =
            first.lesson_date.localeCompare(
              second.lesson_date
            );

          if (dateCompare !== 0) {
            return dateCompare;
          }

          return first.start_time.localeCompare(
            second.start_time
          );
        }
      );

  return {
    groups,
    lessons,
    hasActiveGroup: true,
    warnings,
  };
}
