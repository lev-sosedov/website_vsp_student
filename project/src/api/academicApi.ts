import {
  getUsersByIds,
} from './userApi';

const API_URL = import.meta.env.VITE_API_URL;

export type GroupMemberRole =
  | 'student'
  | 'teacher'
  | 'assistant';

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: GroupMemberRole | string;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
}

export interface GroupStudent {
  membership_id: number;
  group_id: number;
  user_id: number;

  user_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;

  is_active: boolean;
}

export interface GroupStudentListResponse {
  total: number;
  items: GroupStudent[];
}

export interface AcademicGroup {
  id: number;
  name: string;

  branch_id?: number | null;
  direction_id?: number | null;
  education_plan_id?: number | null;
  teacher_id?: number | null;

  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;

  is_active?: boolean;
  is_closed?: boolean;
  closed_at?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface AcademicDirection {
  id: number;
  name: string;

  description?: string | null;
  is_active?: boolean;

  created_at?: string;
  updated_at?: string;
}

export interface AcademicBranch {
  id: number;
  name?: string | null;
  title?: string | null;
  short_name?: string | null;
  address?: string | null;
  address_id?: number | null;
  branch_address_id?: number | null;
  is_active?: boolean;
  phone?: string | null;
  email?: string | null;
  closed_at?: string | null;
  created_at?: string;
}

export interface AcademicBranchAddress {
  id: number;
  branch_id?: number | null;
  country?: string | null;
  address?: string | null;
  full_address?: string | null;
  street?: string | null;
  street_name?: string | null;
  city?: string | null;
  house?: string | number | null;
  building?: string | number | null;
  postal_code?: string | null;
}

export interface AcademicBranchMutation {
  branch_address_id: number;
  phone: string | null;
  email: string | null;
}

export interface AcademicBranchAddressMutation {
  country: string;
  city: string;
  street: string;
  house: string;
  building: string | null;
  postal_code: string | null;
}

export interface AcademicEducationPlan {
  id: number;
  direction_id?: number | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  duration_months?: number | null;
  lessons_per_week?: number | null;
  is_active?: boolean;
}

export interface AcademicGroupMutation {
  name: string;
  branch_id: number;
  direction_id: number;
  education_plan_id: number;
  start_date: string;
  end_date: string | null;
}

interface AcademicListResponse<T> {
  items?: T[];
  total?: number;
}

function getAccessToken(): string | null {
  return (
    localStorage.getItem('vshp_access_token') ??
    localStorage.getItem('access_token') ??
    localStorage.getItem('accessToken')
  );
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText ||
        `Ошибка Academic API: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Получить все группы, в которых состоит пользователь.
 */
export async function getUserGroups(
  userId: number
): Promise<GroupMember[]> {
  return request<GroupMember[]>(
    `/api/v1/group-members/user/${userId}`
  );
}

/**
 * Получить только активные группы пользователя.
 */
export async function getActiveUserGroups(
  userId: number
): Promise<GroupMember[]> {
  const memberships = await getUserGroups(userId);

  return memberships.filter(
    (membership) =>
      membership.is_active &&
      membership.left_at === null
  );
}

/**
 * Получить активную студенческую группу пользователя.
 *
 * Возвращается первая активная студенческая группа.
 * Функция оставлена для экранов, которым нужна одна группа.
 */
export async function getPrimaryStudentGroupMembership(
  userId: number
): Promise<GroupMember | null> {
  const memberships =
    await getActiveUserGroups(userId);

  const studentMembership = memberships.find(
    (membership) => membership.role === 'student'
  );

  return studentMembership ?? memberships[0] ?? null;
}

/**
 * Получить все активные группы, в которых пользователь
 * состоит именно как студент.
 */
export async function getStudentGroupMemberships(
  userId: number
): Promise<GroupMember[]> {
  const memberships =
    await getActiveUserGroups(userId);

  return memberships.filter(
    (membership) => membership.role === 'student'
  );
}

/**
 * Получить информацию о группе.
 */
export async function getGroup(
  groupId: number
): Promise<AcademicGroup> {
  return request<AcademicGroup>(
    `/api/v1/groups/${groupId}`
  );
}

/**
 * Получить список учебных групп.
 */
export async function getGroups(): Promise<
  AcademicGroup[]
> {
  const response = await request<
    AcademicGroup[] |
    AcademicListResponse<AcademicGroup>
  >('/api/v1/groups/?limit=1000&offset=0');

  return Array.isArray(response)
    ? response
    : response.items ?? [];
}

export async function createGroup(
  data: AcademicGroupMutation
): Promise<AcademicGroup> {
  return request<AcademicGroup>(
    '/api/v1/groups/',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateGroup(
  groupId: number,
  data: AcademicGroupMutation
): Promise<AcademicGroup> {
  return request<AcademicGroup>(
    `/api/v1/groups/${groupId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function closeGroup(
  groupId: number
): Promise<AcademicGroup> {
  return request<AcademicGroup>(
    `/api/v1/groups/${groupId}/close`,
    {
      method: 'POST',
    }
  );
}

export async function restoreGroup(
  groupId: number
): Promise<AcademicGroup> {
  return request<AcademicGroup>(
    `/api/v1/groups/${groupId}/restore`,
    {
      method: 'POST',
    }
  );
}

export async function safeDeleteGroup(
  groupId: number
): Promise<unknown> {
  return request<unknown>(
    `/api/v1/groups/${groupId}/safe`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Получить подробную информацию о группе.
 */
export async function getGroupDetail(
  groupId: number
): Promise<AcademicGroup & Record<string, unknown>> {
  return request<
    AcademicGroup & Record<string, unknown>
  >(`/api/v1/groups/${groupId}/detail`);
}

/**
 * Получить преподавателя группы.
 */
export async function getGroupTeacher(
  groupId: number
): Promise<GroupMember | null> {
  return request<GroupMember | null>(
    `/api/v1/group-members/group/${groupId}/teacher`
  );
}

export async function assignGroupTeacher(
  groupId: number,
  userId: number
): Promise<GroupMember> {
  return request<GroupMember>(
    `/api/v1/group-members/group/${groupId}/teacher/${userId}`,
    {
      method: 'POST',
    }
  );
}

export async function assignGroupStudent(
  groupId: number,
  userId: number
): Promise<GroupMember> {
  return request<GroupMember>(
    `/api/v1/group-members/group/${groupId}/student/${userId}`,
    {
      method: 'POST',
    }
  );
}

export async function removeGroupMember(
  memberId: number
): Promise<GroupMember> {
  return request<GroupMember>(
    `/api/v1/group-members/${memberId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function getGroupStudentCount(
  groupId: number
): Promise<number> {
  const response = await request<{
    students: number;
  }>(
    `/api/v1/group-members/group/${groupId}/count/students`
  );

  return response.students;
}

/**
 * Получить активный состав группы без профилей пользователей.
 * Используется как надёжный резервный источник участников.
 */
export async function getGroupMembers(
  groupId: number
): Promise<GroupMember[]> {
  return request<GroupMember[]>(
    `/api/v1/group-members/group/${groupId}`
  );
}

/**
 * Получить активных студентов выбранной группы.
 */
export async function getGroupStudents(
  groupId: number
): Promise<GroupStudentListResponse> {
  const response =
    await request<GroupStudentListResponse>(
    `/api/v1/group-members/group/${groupId}/students`
  );

  const profiles = await getUsersByIds(
    response.items.map(
      (student) => student.user_id
    )
  );

  return {
    ...response,
    items: response.items.map((student) => {
      const profile =
        profiles[student.user_id];

      if (!profile) {
        return student;
      }

      return {
        ...student,
        user_name:
          profile.user_name ??
          student.user_name,
        first_name:
          profile.first_name ??
          student.first_name,
        last_name:
          profile.last_name ??
          student.last_name,
        avatar_url:
          profile.avatar_url ??
          student.avatar_url,
      };
    }),
  };
}

/**
 * Получить направление по ID.
 */
export async function getDirection(
  directionId: number
): Promise<AcademicDirection> {
  return request<AcademicDirection>(
    `/api/v1/directions/${directionId}`
  );
}

export async function getDirections(): Promise<
  AcademicDirection[]
> {
  const response = await request<
    AcademicDirection[] |
    AcademicListResponse<AcademicDirection>
  >('/api/v1/directions?limit=1000&offset=0');

  return Array.isArray(response)
    ? response
    : response.items ?? [];
}

/**
 * Получить филиал по ID.
 */
export async function getBranch(
  branchId: number
): Promise<AcademicBranch> {
  return request<AcademicBranch>(
    `/api/v1/branches/${branchId}`
  );
}

export async function getBranches(
  activeOnly = false
): Promise<AcademicBranch[]> {
  const response = await request<
    AcademicBranch[] |
    AcademicListResponse<AcademicBranch>
  >(
    `/api/v1/branches?active_only=${String(
      activeOnly
    )}`
  );

  return Array.isArray(response)
    ? response
    : response.items ?? [];
}

export async function createBranch(
  data: AcademicBranchMutation
): Promise<AcademicBranch> {
  return request<AcademicBranch>(
    '/api/v1/branches',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateBranch(
  branchId: number,
  data: Partial<
    AcademicBranchMutation & {
      is_active: boolean;
    }
  >
): Promise<AcademicBranch> {
  return request<AcademicBranch>(
    `/api/v1/branches/${branchId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteBranch(
  branchId: number
): Promise<unknown> {
  return request<unknown>(
    `/api/v1/branches/${branchId}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Получить адреса филиалов.
 */
export async function getBranchAddresses(): Promise<
  AcademicBranchAddress[]
> {
  const addresses: AcademicBranchAddress[] =
    [];
  const pageSize = 100;

  for (
    let offset = 0;
    offset < 10_000;
    offset += pageSize
  ) {
    const response = await request<
      | AcademicBranchAddress[]
      | AcademicListResponse<AcademicBranchAddress>
    >(
      `/api/v1/branch-address?limit=${pageSize}&offset=${offset}`
    );

    const items = Array.isArray(response)
      ? response
      : response.items ?? [];

    addresses.push(...items);

    const total = Array.isArray(response)
      ? undefined
      : response.total;

    if (
      items.length < pageSize ||
      (typeof total === 'number' &&
        addresses.length >= total)
    ) {
      break;
    }
  }

  return addresses;
}

export async function createBranchAddress(
  data: AcademicBranchAddressMutation
): Promise<AcademicBranchAddress> {
  return request<AcademicBranchAddress>(
    '/api/v1/branch-address',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateBranchAddress(
  addressId: number,
  data: Partial<AcademicBranchAddressMutation>
): Promise<AcademicBranchAddress> {
  return request<AcademicBranchAddress>(
    `/api/v1/branch-address/${addressId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteBranchAddress(
  addressId: number
): Promise<unknown> {
  return request<unknown>(
    `/api/v1/branch-address/${addressId}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Получить учебный план по ID.
 */
export async function getEducationPlan(
  educationPlanId: number
): Promise<AcademicEducationPlan> {
  const candidateEndpoints = [
    `/api/v1/education-plans/${educationPlanId}`,
    `/api/v1/education-plan/${educationPlanId}`,
  ];

  let lastError: unknown = null;

  for (const endpoint of candidateEndpoints) {
    try {
      return await request<AcademicEducationPlan>(
        endpoint
      );
    } catch (requestError) {
      lastError = requestError;
    }
  }

  throw (
    lastError ??
    new Error('Учебный план не найден')
  );
}

export async function getEducationPlans(): Promise<
  AcademicEducationPlan[]
> {
  const response = await request<
    AcademicEducationPlan[] |
    AcademicListResponse<AcademicEducationPlan>
  >(
    '/api/v1/education-plans?limit=1000&offset=0'
  );

  return Array.isArray(response)
    ? response
    : response.items ?? [];
}
