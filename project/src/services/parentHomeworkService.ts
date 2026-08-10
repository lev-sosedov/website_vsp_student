import {
  getGroup,
  getParentChildGroupMemberships,
} from '../api/academicApi';

import {
  getParentChildren,
  type ParentStudentWithStudent,
} from '../api/parentStudentApi';

import {

  type StudentHomeworkData,
  type StudentHomeworkGroup,
  type StudentHomeworkItem,
} from './homeworkService';
import { getParentChildHomeworks, getParentChildSubmissions } from '../api/homeworkApi';
import { getParentChildGroupLessons } from '../api/scheduleApi';


export interface ParentHomeworkChild {
  id: number;
  name: string;
  phoneNumber: string;
  email: string | null;
  avatarUrl: string | null;
}


export interface ParentHomeworkResult {
  groups: StudentHomeworkGroup[];
  homework: StudentHomeworkData;
  hasActiveGroup: boolean;
  warnings: string[];
}


const EMPTY_HOMEWORK: StudentHomeworkData = {
  items: [],
  pendingCount: 0,
  submittedCount: 0,
  gradedCount: 0,
  overdueCount: 0,
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



async function loadParentHomeworkData(
  groups: StudentHomeworkGroup[],
  studentId: number,
): Promise<StudentHomeworkData> {
  const perGroup = await Promise.all(groups.map(async (group) => {
    const [lessonResponse, homeworkResponse, submissionResponse] = await Promise.all([
      getParentChildGroupLessons(studentId, group.id),
      getParentChildHomeworks(studentId, group.id),
      getParentChildSubmissions(studentId, group.id),
    ]);
    const lessons = lessonResponse.items;
    const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    const submissionsByHomework = new Map(submissionResponse.items.map((submission) => [submission.homework_id, submission]));
    return homeworkResponse.items.flatMap((homework): StudentHomeworkItem[] => {
      const lesson = lessonsById.get(homework.lesson_id);
      if (!lesson) return [];
      return [{ homework, lesson, submission: submissionsByHomework.get(homework.id) ?? null, attachments: [], groupId: group.id, groupName: group.name }];
    });
  }));
  const items = perGroup.flat().sort((first, second) => (first.homework.due_at ?? first.lesson.lesson_date).localeCompare(second.homework.due_at ?? second.lesson.lesson_date));
  const isGraded = (item: StudentHomeworkItem) => item.submission?.status === 'accepted' || item.submission?.status === 'rejected';
  const isSubmitted = (item: StudentHomeworkItem) => item.submission?.status === 'submitted' || item.submission?.status === 'in_review';
  const isOverdue = (item: StudentHomeworkItem) => Boolean(item.homework.due_at && !isGraded(item) && !isSubmitted(item) && new Date(item.homework.due_at).getTime() < Date.now());
  return { items, pendingCount: items.filter((item) => !isGraded(item) && !isSubmitted(item) && !isOverdue(item)).length, submittedCount: items.filter(isSubmitted).length, gradedCount: items.filter(isGraded).length, overdueCount: items.filter(isOverdue).length };
}export async function loadParentHomeworkChildren(
  parentId: number
): Promise<ParentHomeworkChild[]> {
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


export async function loadParentChildHomework(
  studentId: number
): Promise<ParentHomeworkResult> {
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
    await getParentChildGroupMemberships(
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
      homework:
        EMPTY_HOMEWORK,
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

  const failedGroups =
    groupResults.filter(
      (result) =>
        result.status === 'rejected'
    ).length;

  if (failedGroups > 0) {
    warnings.push(
      `Не удалось загрузить данные ${failedGroups} групп.`
    );
  }

  const groups =
    groupResults
      .map(
        (
          result,
          index
        ): StudentHomeworkGroup => {
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

  const homework =
    await loadParentHomeworkData(groups, studentId);

  return {
    groups,
    homework,
    hasActiveGroup: true,
    warnings,
  };
}
