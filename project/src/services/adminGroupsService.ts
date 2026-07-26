import {
  getBranchAddresses,
  getBranches,
  getDirections,
  getEducationPlans,
  getActiveUserGroups,
  getGroupMembers,
  getGroupStudentCount,
  getGroupStudents,
  getGroupTeacher,
  getGroups,
  type AcademicBranch,
  type AcademicBranchAddress,
  type AcademicDirection,
  type AcademicEducationPlan,
  type AcademicGroup,
  type GroupMember,
  type GroupStudent,
} from '../api/academicApi';

import {
  getUsers,
  getUsersByIds,
  type UserProfile,
} from '../api/userApi';

export interface AdminGroupItem {
  group: AcademicGroup;
  branch: AcademicBranch | null;
  branchName: string;
  direction: AcademicDirection | null;
  educationPlan: AcademicEducationPlan | null;
  teacher: UserProfile | null;
  teacherMembership: GroupMember | null;
  studentCount: number;
}

export interface AdminGroupsData {
  items: AdminGroupItem[];
  branches: AcademicBranch[];
  branchAddresses: AcademicBranchAddress[];
  directions: AcademicDirection[];
  educationPlans: AcademicEducationPlan[];
  teachers: UserProfile[];
}

export interface AdminGroupStudentItem {
  profile: UserProfile;
  membership: GroupStudent | null;
}

export interface AdminGroupMembersData {
  members: AdminGroupStudentItem[];
  availableStudents: AdminGroupStudentItem[];
}

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

function getAddressLabel(
  address: AcademicBranchAddress | undefined
): string {
  if (!address) {
    return '';
  }

  const explicitAddress =
    address.full_address?.trim() ||
    address.address?.trim();

  if (explicitAddress) {
    return explicitAddress;
  }

  return [
    address.city,
    address.street ?? address.street_name,
    address.house
      ? `дом ${address.house}`
      : null,
    address.building
      ? `строение ${address.building}`
      : null,
  ]
    .map((value) =>
      value === null || value === undefined
        ? ''
        : String(value).trim()
    )
    .filter(Boolean)
    .join(', ');
}

export function getAdminGroupBranchName(
  branch: AcademicBranch | null,
  addresses: AcademicBranchAddress[]
): string {
  if (!branch) {
    return 'Филиал не указан';
  }

  const address = addresses.find(
    (item) =>
      item.id === branch.branch_address_id ||
      item.id === branch.address_id ||
      item.branch_id === branch.id
  );

  return (
    branch.name?.trim() ||
    branch.title?.trim() ||
    branch.short_name?.trim() ||
    branch.address?.trim() ||
    getAddressLabel(address) ||
    `Филиал №${branch.id}`
  );
}

export function getAdminGroupTeacherName(
  teacher: UserProfile | null
): string {
  if (!teacher) {
    return 'Не назначен';
  }

  const name = [
    teacher.first_name,
    teacher.user_name,
    teacher.last_name,
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
  const teachers: UserProfile[] = [];

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

    teachers.push(...response.items);

    if (
      response.items.length < PAGE_SIZE ||
      teachers.length >= response.total
    ) {
      break;
    }
  }

  return Array.from(
    new Map(
      teachers
        .filter(
          (teacher) =>
            teacher.role.toLowerCase() ===
            'teacher'
        )
        .map((teacher) => [
          teacher.id,
          teacher,
        ])
    ).values()
  ).sort((first, second) =>
    getAdminGroupTeacherName(first).localeCompare(
      getAdminGroupTeacherName(second),
      'ru'
    )
  );
}

async function loadAllStudents(): Promise<
  UserProfile[]
> {
  const students: UserProfile[] = [];

  for (
    let page = 0;
    page < MAX_PAGES;
    page += 1
  ) {
    const response = await getUsers({
      role: 'student',
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    });

    students.push(...response.items);

    if (
      response.items.length < PAGE_SIZE ||
      students.length >= response.total
    ) {
      break;
    }
  }

  return Array.from(
    new Map(
      students
        .filter(
          (student) =>
            student.role.toLowerCase() ===
            'student'
        )
        .map((student) => [
          student.id,
          student,
        ])
    ).values()
  );
}

export function getAdminGroupStudentName(
  student: UserProfile
): string {
  return (
    [
      student.last_name,
      student.user_name,
      student.first_name,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim() || 'Имя не указано'
  );
}

export async function loadAdminGroupMembers(
  groupId: number
): Promise<AdminGroupMembersData> {
  const [groupStudents, students] =
    await Promise.all([
      getGroupStudents(groupId),
      loadAllStudents(),
    ]);

  const studentById = new Map(
    students.map((student) => [
      student.id,
      student,
    ])
  );

  const membershipByUserId = new Map(
    groupStudents.items.map((membership) => [
      membership.user_id,
      membership,
    ])
  );

  const loadedProfiles = await getUsersByIds(
    groupStudents.items.map(
      (membership) => membership.user_id
    )
  );

  const members: AdminGroupStudentItem[] =
    groupStudents.items.flatMap(
      (membership) => {
      const profile =
        studentById.get(membership.user_id) ??
        loadedProfiles[membership.user_id];

      return profile
        ? [{
            profile,
            membership,
          }]
        : [];
      }
    );

  members.sort((first, second) =>
      getAdminGroupStudentName(
        first.profile
      ).localeCompare(
        getAdminGroupStudentName(
          second.profile
        ),
        'ru'
      )
    );

  const availableStudents:
    AdminGroupStudentItem[] = students
    .filter(
      (student) =>
        !membershipByUserId.has(student.id)
    )
    .map((profile) => ({
      profile,
      membership: null,
    }))
    .sort((first, second) =>
      getAdminGroupStudentName(
        first.profile
      ).localeCompare(
        getAdminGroupStudentName(
          second.profile
        ),
        'ru'
      )
    );

  return {
    members,
    availableStudents,
  };
}

export async function loadAdminGroups(): Promise<
  AdminGroupsData
> {
  const [
    groups,
    branches,
    branchAddresses,
    directions,
    educationPlans,
    teachers,
  ] = await Promise.all([
    getGroups(),
    getBranches(false),
    getBranchAddresses(),
    getDirections(),
    getEducationPlans(),
    loadAllTeachers(),
  ]);

  const [
    directTeacherResults,
    groupMemberResults,
    teacherGroupResults,
    countResults,
  ] = await Promise.all([
    Promise.allSettled(
      groups.map((group) =>
        getGroupTeacher(group.id)
      )
    ),
    Promise.allSettled(
      groups.map((group) =>
        getGroupMembers(group.id)
      )
    ),
    Promise.allSettled(
      teachers.map((teacher) =>
        getActiveUserGroups(teacher.id)
      )
    ),
    Promise.allSettled(
      groups.map((group) =>
        getGroupStudentCount(group.id)
      )
    ),
  ]);

  const teacherMembershipByGroup =
    new Map<number, GroupMember>();

  directTeacherResults.forEach(
    (result, index) => {
      if (
        result.status === 'fulfilled' &&
        result.value
      ) {
        teacherMembershipByGroup.set(
          groups[index].id,
          result.value
        );
      }
    }
  );

  groupMemberResults.forEach(
    (result, index) => {
      if (result.status !== 'fulfilled') {
        return;
      }

      const teacherMembership =
        result.value.find(
          (membership) =>
            membership.is_active &&
            membership.left_at === null &&
            ['teacher', 'assistant'].includes(
              membership.role.toLowerCase()
            )
        );

      if (teacherMembership) {
        teacherMembershipByGroup.set(
          groups[index].id,
          teacherMembership
        );
      }
    }
  );

  teacherGroupResults.forEach(
    (result) => {
      if (result.status !== 'fulfilled') {
        return;
      }

      result.value.forEach((membership) => {
        if (
          ['teacher', 'assistant'].includes(
            membership.role.toLowerCase()
          )
        ) {
          teacherMembershipByGroup.set(
            membership.group_id,
            membership
          );
        }
      });
    }
  );

  const teacherMemberships = groups.map(
    (group) =>
      teacherMembershipByGroup.get(group.id) ??
      null
  );

  const teacherIds = teacherMemberships
    .map((membership) => membership?.user_id)
    .filter(
      (userId): userId is number =>
        typeof userId === 'number'
    );

  const loadedTeacherProfiles =
    await getUsersByIds(
    teacherIds
  );

  const teacherProfiles: Record<
    number,
    UserProfile
  > = {
    ...Object.fromEntries(
      teachers.map((teacher) => [
        teacher.id,
        teacher,
      ])
    ),
    ...loadedTeacherProfiles,
  };

  const branchById = new Map(
    branches.map((branch) => [
      branch.id,
      branch,
    ])
  );

  const directionById = new Map(
    directions.map((direction) => [
      direction.id,
      direction,
    ])
  );

  const planById = new Map(
    educationPlans.map((plan) => [
      plan.id,
      plan,
    ])
  );

  const items = groups
    .map((group, index): AdminGroupItem => {
      const branch = group.branch_id
        ? branchById.get(group.branch_id) ??
          null
        : null;

      const teacherMembership =
        teacherMemberships[index];

      return {
        group,
        branch,
        branchName:
          getAdminGroupBranchName(
            branch,
            branchAddresses
          ),
        direction: group.direction_id
          ? directionById.get(
              group.direction_id
            ) ?? null
          : null,
        educationPlan:
          group.education_plan_id
            ? planById.get(
                group.education_plan_id
              ) ?? null
            : null,
        teacher: teacherMembership
          ? teacherProfiles[
              teacherMembership.user_id
            ] ?? null
          : null,
        teacherMembership,
        studentCount:
          countResults[index].status ===
          'fulfilled'
            ? countResults[index].value
            : 0,
      };
    })
    .sort((first, second) =>
      first.group.name.localeCompare(
        second.group.name,
        'ru'
      )
    );

  return {
    items,
    branches,
    branchAddresses,
    directions,
    educationPlans,
    teachers,
  };
}
