const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export type ParentRelationship =
  | 'mother'
  | 'father'
  | 'guardian'
  | 'other';

export interface ParentStudentLinkedUser {
  id: number;
  phone_number: string;
  user_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface ParentStudentLink {
  id: number;
  parent_id: number;
  student_id: number;
  relationship: ParentRelationship;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParentStudentWithStudent
  extends ParentStudentLink {
  student: ParentStudentLinkedUser;
}

export interface ParentStudentWithParent
  extends ParentStudentLink {
  parent: ParentStudentLinkedUser;
}

export interface CreateParentStudentLinkRequest {
  parent_id: number;
  student_id: number;
  relationship: ParentRelationship;
}

function getAccessToken(): string {
  return (
    localStorage.getItem('vshp_access_token') ??
    localStorage.getItem('access_token') ??
    localStorage.getItem('accessToken') ??
    ''
  );
}

async function getApiError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string | {
        message?: string;
      };
      message?: string;
    };

    if (typeof data.detail === 'string') {
      return data.detail;
    }

    return (
      data.detail?.message ??
      data.message ??
      fallbackMessage
    );
  } catch {
    const text = await response.text();
    return text || fallbackMessage;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  if (options.body) {
    headers.set(
      'Content-Type',
      'application/json'
    );
  }

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      await getApiError(
        response,
        `Ошибка связи родителя и студента: ${response.status}`
      )
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  return text
    ? JSON.parse(text) as T
    : undefined as T;
}

export async function createParentStudentLink(
  data: CreateParentStudentLinkRequest
): Promise<ParentStudentLink> {
  return request<ParentStudentLink>(
    '/api/v1/parent-students/',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function getParentChildren(
  parentId: number,
  activeOnly = true
): Promise<ParentStudentWithStudent[]> {
  const params = new URLSearchParams({
    active_only: String(activeOnly),
  });

  return request<ParentStudentWithStudent[]>(
    `/api/v1/parent-students/parent/${parentId}?${params.toString()}`
  );
}

export async function getStudentParents(
  studentId: number,
  activeOnly = true
): Promise<ParentStudentWithParent[]> {
  const params = new URLSearchParams({
    active_only: String(activeOnly),
  });

  return request<ParentStudentWithParent[]>(
    `/api/v1/parent-students/student/${studentId}?${params.toString()}`
  );
}

export async function updateParentStudentRelationship(
  linkId: number,
  relationship: ParentRelationship
): Promise<ParentStudentLink> {
  return request<ParentStudentLink>(
    `/api/v1/parent-students/${linkId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        relationship,
      }),
    }
  );
}

export async function deactivateParentStudentLink(
  linkId: number
): Promise<ParentStudentLink> {
  return request<ParentStudentLink>(
    `/api/v1/parent-students/${linkId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function activateParentStudentLink(
  linkId: number
): Promise<ParentStudentLink> {
  return request<ParentStudentLink>(
    `/api/v1/parent-students/${linkId}/activate`,
    {
      method: 'PATCH',
    }
  );
}
