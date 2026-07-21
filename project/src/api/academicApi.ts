const API_URL = import.meta.env.VITE_API_URL;

export type GroupMemberRole = 'student' | 'teacher' | 'assistant';

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

  created_at?: string;
  updated_at?: string;
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
      membership.is_active && membership.left_at === null
  );
}

/**
 * Получить активную студенческую группу пользователя.
 *
 * Сейчас возвращается первая активная группа.
 * В дальнейшем студент сможет состоять в нескольких группах.
 */
export async function getPrimaryStudentGroupMembership(
  userId: number
): Promise<GroupMember | null> {
  const memberships = await getActiveUserGroups(userId);

  const studentMembership = memberships.find(
    (membership) => membership.role === 'student'
  );

  return studentMembership ?? memberships[0] ?? null;
}

/**
 * Получить информацию о группе.
 */
export async function getGroup(
  groupId: number
): Promise<AcademicGroup> {
  return request<AcademicGroup>(`/api/v1/groups/${groupId}`);
}

/**
 * Получить подробную информацию о группе.
 *
 * Точная структура detail может быть шире обычной группы,
 * поэтому сохраняем все дополнительные поля.
 */
export async function getGroupDetail(
  groupId: number
): Promise<AcademicGroup & Record<string, unknown>> {
  return request<AcademicGroup & Record<string, unknown>>(
    `/api/v1/groups/${groupId}/detail`
  );
}

/**
 * Получить преподавателя группы.
 *
 * Academic Service может вернуть объект участника
 * либо null, если преподаватель ещё не назначен.
 */
export async function getGroupTeacher(
  groupId: number
): Promise<GroupMember | null> {
  return request<GroupMember | null>(
    `/api/v1/group-members/group/${groupId}/teacher`
  );
}

/**
 * Получить активных студентов выбранной группы
 * вместе с данными профилей из User Service.
 */
export async function getGroupStudents(
  groupId: number
): Promise<GroupStudentListResponse> {
  return request<GroupStudentListResponse>(
    `/api/v1/group-members/group/${groupId}/students`
  );
}