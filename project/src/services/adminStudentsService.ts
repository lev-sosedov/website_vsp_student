import {
  getBranch,
  getBranchAddresses,
  getDirection,
  getEducationPlan,
  getGroup,
  getGroups,
  getGroupStudents,
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

export interface AdminStudentStudyInfo {
  groupId: number;
  groupName: string;
  branchId: number | null;
  branchName: string;
  directionId: number | null;
  directionName: string;
  educationPlanId: number | null;
  educationPlanName: string;
}

export interface AdminStudentItem {
  profile: UserProfile;
  study: AdminStudentStudyInfo[];
}

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

export function getAdminStudentName(
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

async function loadAllStudents(): Promise<
  UserProfile[]
> {
  const users: UserProfile[] = [];

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
            'student'
        )
        .map((user) => [user.id, user])
    ).values()
  );
}

async function loadMetadataByIds<
  T
>(
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

async function loadGroupStudentIds(
  groups: AcademicGroup[]
): Promise<Map<number, number[]>> {
  const results = await Promise.allSettled(
    groups.map((group) =>
      getGroupStudents(group.id)
    )
  );

  const studentIdsByGroupId =
    new Map<number, number[]>();

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      studentIdsByGroupId.set(
        groups[index].id,
        result.value.items
          .filter((student) => student.is_active)
          .map((student) => student.user_id)
      );
    }
  });

  return studentIdsByGroupId;
}

async function loadDetailedGroups(
  groups: AcademicGroup[]
): Promise<AcademicGroup[]> {
  const results = await Promise.allSettled(
    groups.map((group) => getGroup(group.id))
  );

  return groups.map((group, index) => {
    const detailResult = results[index];

    if (detailResult.status !== 'fulfilled') {
      return group;
    }

    return {
      ...group,
      ...detailResult.value,
    };
  });
}

export async function loadAdminStudents():
Promise<AdminStudentItem[]> {
  const [students, groupsResult] =
    await Promise.all([
      loadAllStudents(),
      getGroups()
        .catch((groupError) => {
          console.error(
            'Не удалось загрузить группы для списка студентов:',
            groupError
          );

          return [];
        }),
    ]);

  const groups = (
    await loadDetailedGroups(groupsResult)
  ).filter((group) => group.is_closed !== true);

  const [
    studentIdsByGroupId,
    branches,
    branchAddresses,
    directions,
    educationPlans,
  ] = await Promise.all([
    loadGroupStudentIds(groups),
    loadMetadataByIds(
      groups
        .map((group) => group.branch_id ?? 0),
      getBranch
    ),
    getBranchAddresses().catch(
      (branchAddressError) => {
        console.error(
          'Не удалось загрузить адреса филиалов:',
          branchAddressError
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

  const studyByStudentId =
    new Map<number, AdminStudentStudyInfo[]>();

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

    const studyInfo: AdminStudentStudyInfo = {
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
          ? directions.get(group.direction_id)
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
      studentIdsByGroupId.get(group.id) ?? []
    ).forEach((studentId) => {
      const currentStudy =
        studyByStudentId.get(studentId) ?? [];

      currentStudy.push(studyInfo);
      studyByStudentId.set(
        studentId,
        currentStudy
      );
    });
  });

  return students
    .map((profile) => ({
      profile,
      study:
        studyByStudentId.get(profile.id) ?? [],
    }))
    .sort((first, second) =>
      getAdminStudentName(first.profile)
        .localeCompare(
          getAdminStudentName(
            second.profile
          ),
          'ru'
        )
    );
}
