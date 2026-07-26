import {
  getActiveUserGroups,
  getBranch,
  getBranchAddresses,
  getDirection,
  getEducationPlan,
  getGroup,
  getGroupMembers,
  getGroups,
  type AcademicBranch,
  type AcademicBranchAddress,
  type AcademicDirection,
  type AcademicEducationPlan,
  type AcademicGroup,
} from '../api/academicApi';

import {
  getUsers,
  type UserProfile,
} from '../api/userApi';

import type {
  AdminStudentItem,
  AdminStudentStudyInfo,
} from './adminStudentsService';

export type AdminTeacherAssignmentInfo =
  AdminStudentStudyInfo;

export type AdminTeacherItem =
  AdminStudentItem;

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

function getBranchName(
  branchId: number | null,
  branch: AcademicBranch | undefined,
  address: AcademicBranchAddress | undefined
): string {
  const addressParts = [
    address?.city,
    address?.street ?? address?.street_name,
    address?.house
      ? `дом ${address.house}`
      : null,
    address?.building
      ? `строение ${address.building}`
      : null,
  ]
    .map((value) =>
      value === null || value === undefined
        ? ''
        : String(value).trim()
    )
    .filter(Boolean);

  return (
    branch?.name?.trim() ||
    branch?.title?.trim() ||
    branch?.short_name?.trim() ||
    address?.full_address?.trim() ||
    address?.address?.trim() ||
    branch?.address?.trim() ||
    addressParts.join(', ') ||
    (branchId
      ? `Филиал №${branchId}`
      : 'Филиал не указан')
  );
}

function getDirectionName(
  direction: AcademicDirection | undefined
): string {
  return (
    direction?.name?.trim() ||
    'Направление не указано'
  );
}

function getEducationPlanName(
  educationPlan:
    AcademicEducationPlan | undefined
): string {
  return (
    educationPlan?.name?.trim() ||
    educationPlan?.title?.trim() ||
    'Учебный план не указан'
  );
}

export function getAdminTeacherName(
  profile: UserProfile
): string {
  const name = [
    profile.first_name,
    profile.user_name,
    profile.last_name,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || 'Имя не указано';
}

async function loadAllTeachers(): Promise<
  UserProfile[]
> {
  const users: UserProfile[] = [];

  for (
    let page = 0;
    page < MAX_PAGES;
    page += 1
  ) {
    const response = await getUsers({
      role: 'teacher',
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
      users
        .filter(
          (user) =>
            user.role.toLowerCase() ===
            'teacher'
        )
        .map((user) => [user.id, user])
    ).values()
  );
}

async function loadMetadataByIds<T>(
  ids: number[],
  loader: (id: number) => Promise<T>
): Promise<Map<number, T>> {
  const uniqueIds = [
    ...new Set(
      ids.filter(
        (id) =>
          Number.isInteger(id) && id > 0
      )
    ),
  ];

  const results = await Promise.allSettled(
    uniqueIds.map(loader)
  );

  const values = new Map<number, T>();

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      values.set(
        uniqueIds[index],
        result.value
      );
    }
  });

  return values;
}

async function loadDetailedGroups(
  groups: AcademicGroup[]
): Promise<AcademicGroup[]> {
  const results = await Promise.allSettled(
    groups.map((group) => getGroup(group.id))
  );

  return groups.map((group, index) => {
    const detail = results[index];

    return detail.status === 'fulfilled'
      ? {
          ...group,
          ...detail.value,
        }
      : group;
  });
}

async function loadTeacherGroupIds(
  teachers: UserProfile[]
): Promise<Map<number, number[]>> {
  const results = await Promise.allSettled(
    teachers.map((teacher) =>
      getActiveUserGroups(teacher.id)
    )
  );

  const groupIdsByTeacherId =
    new Map<number, number[]>();

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') {
      return;
    }

    const groupIds = [
      ...new Set(
        result.value
          .filter(
            (membership) =>
              membership.role === 'teacher' ||
              membership.role === 'assistant'
          )
          .map(
            (membership) =>
              membership.group_id
          )
      ),
    ];

    groupIdsByTeacherId.set(
      teachers[index].id,
      groupIds
    );
  });

  return groupIdsByTeacherId;
}

async function loadTeacherIdsByGroup(
  groups: AcademicGroup[],
  groupIdsByTeacherId: Map<
    number,
    number[]
  >
): Promise<Map<number, number[]>> {
  const results = await Promise.allSettled(
    groups.map((group) =>
      getGroupMembers(group.id)
    )
  );

  const teacherIdsByGroup =
    new Map<number, number[]>();

  groups.forEach((group, index) => {
    const ids = new Set<number>();

    if (group.teacher_id) {
      ids.add(group.teacher_id);
    }

    const membersResult = results[index];

    if (membersResult.status === 'fulfilled') {
      membersResult.value
        .filter(
          (member) =>
            member.is_active &&
            member.left_at === null &&
            (
              member.role === 'teacher' ||
              member.role === 'assistant'
            )
        )
        .forEach((member) =>
          ids.add(member.user_id)
        );
    }

    teacherIdsByGroup.set(
      group.id,
      [...ids]
    );
  });

  groupIdsByTeacherId.forEach(
    (groupIds, teacherId) => {
      groupIds.forEach((groupId) => {
        const teacherIds =
          teacherIdsByGroup.get(groupId) ??
          [];

        if (
          !teacherIds.includes(teacherId)
        ) {
          teacherIds.push(teacherId);
        }

        teacherIdsByGroup.set(
          groupId,
          teacherIds
        );
      });
    }
  );

  return teacherIdsByGroup;
}

export async function loadAdminTeachers():
Promise<AdminTeacherItem[]> {
  const [teachers, groupsResult] =
    await Promise.all([
      loadAllTeachers(),
      getGroups().catch((groupError) => {
        console.error(
          'Не удалось загрузить группы преподавателей:',
          groupError
        );

        return [];
      }),
    ]);

  const groupIdsByTeacherId =
    await loadTeacherGroupIds(teachers);

  const knownGroupIds = new Set(
    groupsResult.map((group) => group.id)
  );

  const missingGroupIds = [
    ...new Set(
      Array.from(
        groupIdsByTeacherId.values()
      ).flat()
    ),
  ].filter(
    (groupId) =>
      !knownGroupIds.has(groupId)
  );

  const missingGroupResults =
    await Promise.allSettled(
      missingGroupIds.map(getGroup)
    );

  const missingGroups =
    missingGroupResults.flatMap(
      (result) =>
        result.status === 'fulfilled'
          ? [result.value]
          : []
    );

  const groups = (
    await loadDetailedGroups([
      ...groupsResult,
      ...missingGroups,
    ])
  ).filter((group) => group.is_closed !== true);

  const [
    teacherIdsByGroup,
    branches,
    branchAddresses,
    directions,
    educationPlans,
  ] = await Promise.all([
    loadTeacherIdsByGroup(
      groups,
      groupIdsByTeacherId
    ),
    loadMetadataByIds(
      groups.map(
        (group) => group.branch_id ?? 0
      ),
      getBranch
    ),
    getBranchAddresses().catch(
      (addressError) => {
        console.error(
          'Не удалось загрузить адреса филиалов:',
          addressError
        );

        return [];
      }
    ),
    loadMetadataByIds(
      groups.map(
        (group) => group.direction_id ?? 0
      ),
      getDirection
    ),
    loadMetadataByIds(
      groups.map(
        (group) =>
          group.education_plan_id ?? 0
      ),
      getEducationPlan
    ),
  ]);

  const assignmentsByTeacherId =
    new Map<
      number,
      AdminTeacherAssignmentInfo[]
    >();

  groups.forEach((group) => {
    const branch =
      group.branch_id
        ? branches.get(group.branch_id)
        : undefined;

    const branchAddressId =
      branch?.branch_address_id ??
      branch?.address_id ??
      null;

    const branchAddress =
      branchAddresses.find(
        (address) =>
          (
            branchAddressId !== null &&
            address.id === branchAddressId
          ) ||
          address.branch_id === group.branch_id
      );

    const assignment:
      AdminTeacherAssignmentInfo = {
        groupId: group.id,
        groupName:
          group.name?.trim() || 'Группа',
        branchId: group.branch_id ?? null,
        branchName: getBranchName(
          group.branch_id ?? null,
          branch,
          branchAddress
        ),
        directionId:
          group.direction_id ?? null,
        directionName: getDirectionName(
          group.direction_id
            ? directions.get(
                group.direction_id
              )
            : undefined
        ),
        educationPlanId:
          group.education_plan_id ?? null,
        educationPlanName:
          getEducationPlanName(
            group.education_plan_id
              ? educationPlans.get(
                  group.education_plan_id
                )
              : undefined
          ),
      };

    (
      teacherIdsByGroup.get(group.id) ?? []
    ).forEach((teacherId) => {
      const currentAssignments =
        assignmentsByTeacherId.get(
          teacherId
        ) ?? [];

      currentAssignments.push(assignment);
      assignmentsByTeacherId.set(
        teacherId,
        currentAssignments
      );
    });
  });

  return teachers
    .map((profile) => ({
      profile,
      study:
        assignmentsByTeacherId.get(
          profile.id
        ) ?? [],
    }))
    .sort((first, second) =>
      getAdminTeacherName(first.profile)
        .localeCompare(
          getAdminTeacherName(
            second.profile
          ),
          'ru'
        )
    );
}
