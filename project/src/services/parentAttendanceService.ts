import {
  getGroup,
  getParentChildGroupMemberships,
} from '../api/academicApi';

import {
  getParentChildAttendance,
  type AttendanceRecord,
  type AttendanceListResponse,
} from '../api/attendanceApi';

import {
  getParentChildren,
  type ParentStudentWithStudent,
} from '../api/parentStudentApi';

import {
  getParentChildGroupLessons,
  type LessonSchedule,
} from '../api/scheduleApi';


export interface ParentAttendanceChild {
  id: number;
  name: string;
  phoneNumber: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface ParentAttendanceGroup {
  id: number;
  name: string;
}

export interface ParentAttendanceRow {
  attendance: AttendanceRecord;
  lesson: LessonSchedule | null;
  groupId: number | null;
  groupName: string;
}

export interface ParentAttendanceData {
  groups: ParentAttendanceGroup[];
  rows: ParentAttendanceRow[];
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


export async function loadParentAttendanceChildren(
  parentId: number
): Promise<ParentAttendanceChild[]> {
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
      email: link.student.email,
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


export async function loadParentChildAttendance(
  studentId: number
): Promise<ParentAttendanceData> {
  if (
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    throw new Error(
      'Не удалось определить ID ребёнка'
    );
  }

  const warnings: string[] = [];

  const memberships = await getParentChildGroupMemberships(studentId);
  const attendanceResponses = await Promise.all(
    Array.from(new Set(memberships.map((membership) => membership.group_id)))
      .map((groupId) => getParentChildAttendance(studentId, groupId))
  );
  const attendanceResponse: AttendanceListResponse = {
    total: attendanceResponses.reduce((total, response) => total + response.items.length, 0),
    items: attendanceResponses.flatMap((response) => response.items),
  };


  const lessonResults = await Promise.allSettled(
    Array.from(new Set(memberships.map((membership) => membership.group_id))).map(
      (groupId) => getParentChildGroupLessons(studentId, groupId)
    )
  );

  const lessonById = new Map<number, LessonSchedule>();
  lessonResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      result.value.items.forEach((lesson) => lessonById.set(lesson.id, lesson));
    }
  });

  const failedLessons = lessonResults.filter((result) => result.status === 'rejected').length;

  if (failedLessons > 0) {
    warnings.push(
      `Не удалось загрузить данные ${failedLessons} заняти${failedLessons === 1 ? 'я' : 'й'}.`
    );
  }

  const allGroupIds = Array.from(
    new Set([
      ...memberships.map(
        (membership) =>
          membership.group_id
      ),
      ...Array.from(
        lessonById.values()
      )
        .map(
          (lesson) =>
            lesson?.group_id
        )
        .filter(
          (
            groupId
          ): groupId is number =>
            typeof groupId ===
              'number' &&
            groupId > 0
        ),
    ])
  );

  const groupResults =
    await Promise.allSettled(
      allGroupIds.map((groupId) =>
        getGroup(groupId)
      )
    );

  const groupNamesById =
    new Map<number, string>();

  groupResults.forEach(
    (result, index) => {
      const groupId =
        allGroupIds[index];

      groupNamesById.set(
        groupId,
        result.status === 'fulfilled'
          ? (
              result.value.name?.trim() ||
              `Группа №${groupId}`
            )
          : `Группа №${groupId}`
      );
    }
  );

  const failedGroups =
    groupResults.filter(
      (result) =>
        result.status === 'rejected'
    ).length;

  if (failedGroups > 0) {
    warnings.push(
      `Не удалось загрузить названия ${failedGroups} групп.`
    );
  }

  const groups = allGroupIds
    .map((groupId) => ({
      id: groupId,
      name:
        groupNamesById.get(
          groupId
        ) ??
        `Группа №${groupId}`,
    }))
    .sort((first, second) =>
      first.name.localeCompare(
        second.name,
        'ru'
      )
    );

  const rows =
    attendanceResponse.items
      .map(
        (
          attendance
        ): ParentAttendanceRow => {
          const lesson = lessonById.get(attendance.lesson_id) ?? null;

          const groupId =
            lesson?.group_id ?? null;

          return {
            attendance,
            lesson,
            groupId,
            groupName:
              groupId === null
                ? 'Группа не определена'
                : (
                    groupNamesById.get(
                      groupId
                    ) ??
                    `Группа №${groupId}`
                  ),
          };
        }
      )
      .sort(
        (first, second) => {
          const dateComparison =
            (
              second.lesson
                ?.lesson_date ?? ''
            ).localeCompare(
              first.lesson
                ?.lesson_date ?? ''
            );

          if (
            dateComparison !== 0
          ) {
            return dateComparison;
          }

          return (
            second.lesson
              ?.start_time ?? ''
          ).localeCompare(
            first.lesson
              ?.start_time ?? ''
          );
        }
      );

  return {
    groups,
    rows,
    hasActiveGroup:
      memberships.length > 0,
    warnings,
  };
}
