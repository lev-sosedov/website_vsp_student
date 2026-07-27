import {
  getGroup,
  getStudentGroupMemberships,
} from '../api/academicApi';

import {
  getParentChildren,
  type ParentStudentWithStudent,
} from '../api/parentStudentApi';

import {
  loadStudentHomeworks,
  type StudentHomeworkData,
  type StudentHomeworkGroup,
} from './homeworkService';


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


export async function loadParentHomeworkChildren(
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
    await loadStudentHomeworks(
      groups,
      studentId
    );

  return {
    groups,
    homework,
    hasActiveGroup: true,
    warnings,
  };
}
