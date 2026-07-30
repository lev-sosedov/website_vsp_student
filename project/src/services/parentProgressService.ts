import {
  getGroup,
  getStudentGroupMemberships,
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
  getParentChildren,
  type ParentStudentWithStudent,
} from '../api/parentStudentApi';

import {
  getGroupLessons,
  type LessonSchedule,
} from '../api/scheduleApi';


export interface ParentProgressChild {
  id: number;
  name: string;
  phoneNumber: string;
  email: string | null;
  avatarUrl: string | null;
}


export interface ParentProgressGroup {
  id: number;
  name: string;
}


export interface ParentProgressHomeworkItem {
  homework: Homework;
  submission: HomeworkSubmission | null;
  lesson: LessonSchedule;
  groupId: number;
  groupName: string;
}


export interface ParentProgressAttendanceItem {
  attendance: AttendanceRecord;
  lesson: LessonSchedule;
  groupId: number;
  groupName: string;
}


export interface ParentProgressData {
  groups: ParentProgressGroup[];
  homeworkItems: ParentProgressHomeworkItem[];
  attendanceItems: ParentProgressAttendanceItem[];
  hasActiveGroup: boolean;
  warnings: string[];
}


const EMPTY_DATA: ParentProgressData = {
  groups: [],
  homeworkItems: [],
  attendanceItems: [],
  hasActiveGroup: false,
  warnings: [],
};


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


export async function loadParentProgressChildren(
  parentId: number
): Promise<ParentProgressChild[]> {
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


export async function loadParentChildProgress(
  studentId: number
): Promise<ParentProgressData> {
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
    return EMPTY_DATA;
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
        ): ParentProgressGroup => {
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
      `Не удалось получить названия ${failedGroups} групп.`
    );
  }

  const [
    lessonResults,
    homeworks,
    submissions,
    attendanceResponse,
  ] = await Promise.all([
    Promise.allSettled(
      groups.map((group) =>
        getGroupLessons(group.id)
      )
    ),
    getPublishedHomeworks(),
    getStudentSubmissions(
      studentId
    ),
    getStudentAttendance(
      studentId
    ),
  ]);

  const failedLessonGroups =
    lessonResults.filter(
      (result) =>
        result.status === 'rejected'
    ).length;

  if (failedLessonGroups > 0) {
    warnings.push(
      `Не удалось получить занятия ${failedLessonGroups} групп.`
    );
  }

  const lessons =
    lessonResults.flatMap(
      (result) =>
        result.status ===
        'fulfilled'
          ? result.value
          : []
    );

  const lessonById =
    new Map<
      number,
      LessonSchedule
    >(
      lessons.map((lesson) => [
        lesson.id,
        lesson,
      ])
    );

  const groupNameById =
    new Map(
      groups.map((group) => [
        group.id,
        group.name,
      ])
    );

  const submissionByHomeworkId =
    new Map(
      submissions.map(
        (submission) => [
          submission.homework_id,
          submission,
        ]
      )
    );

  const homeworkItems =
    homeworks
      .filter((homework) =>
        lessonById.has(
          homework.lesson_id
        )
      )
      .map(
        (
          homework
        ): ParentProgressHomeworkItem => {
          const lesson =
            lessonById.get(
              homework.lesson_id
            );

          if (!lesson) {
            throw new Error(
              `Занятие №${homework.lesson_id} не найдено`
            );
          }

          return {
            homework,
            submission:
              submissionByHomeworkId.get(
                homework.id
              ) ?? null,
            lesson,
            groupId:
              lesson.group_id,
            groupName:
              groupNameById.get(
                lesson.group_id
              ) ??
              `Группа №${lesson.group_id}`,
          };
        }
      )
      .sort(
        (first, second) => {
          const firstDate =
            first.homework.due_at ??
            first.lesson.lesson_date;

          const secondDate =
            second.homework.due_at ??
            second.lesson.lesson_date;

          return firstDate.localeCompare(
            secondDate
          );
        }
      );

  const attendanceItems =
    attendanceResponse.items
      .map(
        (
          attendance
        ): ParentProgressAttendanceItem | null => {
          const lesson =
            lessonById.get(
              attendance.lesson_id
            );

          if (!lesson) {
            return null;
          }

          return {
            attendance,
            lesson,
            groupId:
              lesson.group_id,
            groupName:
              groupNameById.get(
                lesson.group_id
              ) ??
              `Группа №${lesson.group_id}`,
          };
        }
      )
      .filter(
        (
          item
        ): item is ParentProgressAttendanceItem =>
          item !== null
      );

  return {
    groups,
    homeworkItems,
    attendanceItems,
    hasActiveGroup: true,
    warnings,
  };
}
