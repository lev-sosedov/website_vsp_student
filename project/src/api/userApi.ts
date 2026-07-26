const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export interface UserProfile {
  id: number;
  phone_number: string;
  user_name: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  birthday: string | null;
  avatar_url: string | null;
  about: string | null;
  role: string;
  is_active: boolean;
  is_account_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  total: number;
  items: UserProfile[];
}

export interface UserListFilters {
  role?: string;
  isActive?: boolean;
  skip?: number;
  limit?: number;
}

export interface UserProfileUpdate {
  phone_number?: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birthday?: string | null;
  avatar_url?: string | null;
  about?: string | null;
  user_name?: string | null;
}

export interface CreateUserRequest {
  phone_number: string;
  user_name: string;
  role: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birthday?: string | null;
  avatar_url?: string | null;
  about?: string | null;
}

const userProfileCache =
  new Map<number, UserProfile>();

const pendingUserRequests =
  new Map<number, Promise<UserProfile>>();

function getAccessToken(): string {
  return (
    localStorage.getItem('vshp_access_token') ??
    localStorage.getItem('access_token') ??
    localStorage.getItem('accessToken') ??
    ''
  );
}

async function getUserApiError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string;
      message?: string;
    };

    return (
      data.detail ??
      data.message ??
      fallbackMessage
    );
  } catch {
    const responseText = await response.text();

    return responseText || fallbackMessage;
  }
}

async function userRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  if (options.body) {
    headers.set(
      'Content-Type',
      'application/json'
    );
  }

  if (accessToken) {
    headers.set(
      'Authorization',
      `Bearer ${accessToken}`
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
      await getUserApiError(
        response,
        `Ошибка User Service: ${response.status}`
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

async function requestUserProfile(
  userId: number,
  accessToken: string
): Promise<UserProfile> {
  const response = await fetch(
    `${API_URL}/api/v1/users/${userId}`,
    {
      headers: {
        Accept: 'application/json',
        ...(accessToken
          ? {
              Authorization:
                `Bearer ${accessToken}`,
            }
          : {}),
      },
    }
  );

  if (!response.ok) {
    let message =
      `Не удалось получить пользователя: ${response.status}`;

    try {
      const data = (await response.json()) as {
        detail?: string;
        message?: string;
      };

      message =
        data.detail ??
        data.message ??
        message;
    } catch {
      const responseText = await response.text();

      if (responseText) {
        message = responseText;
      }
    }

    throw new Error(message);
  }

  return response.json() as Promise<UserProfile>;
}

export async function getUsers(
  filters: UserListFilters = {}
): Promise<UserListResponse> {
  const accessToken = getAccessToken();
  const searchParams = new URLSearchParams();

  searchParams.set(
    'skip',
    String(filters.skip ?? 0)
  );
  searchParams.set(
    'limit',
    String(filters.limit ?? 100)
  );

  if (filters.role) {
    searchParams.set('role', filters.role);
  }

  if (filters.isActive !== undefined) {
    searchParams.set(
      'is_active',
      String(filters.isActive)
    );
  }

  const response = await fetch(
    `${API_URL}/api/v1/users/?${searchParams.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        ...(accessToken
          ? {
              Authorization:
                `Bearer ${accessToken}`,
            }
          : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await getUserApiError(
        response,
        `Не удалось получить список пользователей: ${response.status}`
      )
    );
  }

  const data = (await response.json()) as
    | UserProfile[]
    | {
        total?: number;
        items?: UserProfile[];
        users?: UserProfile[];
      };

  if (Array.isArray(data)) {
    return {
      total: data.length,
      items: data,
    };
  }

  const items = data.items ?? data.users ?? [];

  return {
    total: data.total ?? items.length,
    items,
  };
}

export async function getUserProfile(
  id: number,
  accessToken: string
): Promise<UserProfile> {
  const cachedUser = userProfileCache.get(id);

  if (cachedUser) {
    return cachedUser;
  }

  const user = await requestUserProfile(
    id,
    accessToken
  );

  userProfileCache.set(id, user);

  return user;
}

export async function getUserById(
  userId: number
): Promise<UserProfile> {
  const cachedUser =
    userProfileCache.get(userId);

  if (cachedUser) {
    return cachedUser;
  }

  const pendingRequest =
    pendingUserRequests.get(userId);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = requestUserProfile(
    userId,
    getAccessToken()
  )
    .then((user) => {
      userProfileCache.set(userId, user);
      return user;
    })
    .finally(() => {
      pendingUserRequests.delete(userId);
    });

  pendingUserRequests.set(userId, request);

  return request;
}

export async function getUsersByIds(
  userIds: number[]
): Promise<Record<number, UserProfile>> {
  const uniqueUserIds = [
    ...new Set(
      userIds.filter(
        (userId) =>
          Number.isInteger(userId) &&
          userId > 0
      )
    ),
  ];

  const results = await Promise.allSettled(
    uniqueUserIds.map((userId) =>
      getUserById(userId)
    )
  );

  const users: Record<number, UserProfile> =
    {};

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      users[uniqueUserIds[index]] =
        result.value;
    }
  });

  return users;
}

export function clearUserProfileCache(
  userId?: number
): void {
  if (userId !== undefined) {
    userProfileCache.delete(userId);
    pendingUserRequests.delete(userId);
    return;
  }

  userProfileCache.clear();
  pendingUserRequests.clear();
}

export async function updateUserProfile(
  userId: number,
  data: UserProfileUpdate
): Promise<UserProfile> {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_URL}/api/v1/users/${userId}`,
    {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(accessToken
          ? {
              Authorization:
                `Bearer ${accessToken}`,
            }
          : {}),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let message =
      `Не удалось обновить профиль: ${response.status}`;

    try {
      const responseData = (await response.json()) as {
        detail?: string;
        message?: string;
      };

      message =
        responseData.detail ??
        responseData.message ??
        message;
    } catch {
      const responseText = await response.text();

      if (responseText) {
        message = responseText;
      }
    }

    throw new Error(message);
  }

  const updatedUser =
    (await response.json()) as UserProfile;

  /*
   * Обновляем кеш, чтобы refreshProfile()
   * не вернул старую аватарку.
   */
  userProfileCache.set(userId, updatedUser);
  pendingUserRequests.delete(userId);

  return updatedUser;
}

export async function createUser(
  data: CreateUserRequest
): Promise<UserProfile> {
  const user = await userRequest<UserProfile>(
    '/api/v1/users/',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  userProfileCache.set(user.id, user);

  return user;
}

export async function deleteUser(
  userId: number
): Promise<void> {
  await userRequest<void>(
    `/api/v1/users/${userId}`,
    {
      method: 'DELETE',
    }
  );

  clearUserProfileCache(userId);
}

export async function changeUserRole(
  userId: number,
  role: string
): Promise<UserProfile> {
  const user = await userRequest<UserProfile>(
    `/api/v1/users/${userId}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }
  );

  clearUserProfileCache(userId);

  return user;
}

export async function blockUser(
  userId: number
): Promise<UserProfile> {
  const user = await userRequest<UserProfile>(
    `/api/v1/users/${userId}/block`,
    {
      method: 'PATCH',
    }
  );

  clearUserProfileCache(userId);

  return user;
}

export async function activateUser(
  userId: number
): Promise<UserProfile> {
  const user = await userRequest<UserProfile>(
    `/api/v1/users/${userId}/activate`,
    {
      method: 'PATCH',
    }
  );

  clearUserProfileCache(userId);

  return user;
}

export async function verifyUserAccount(
  userId: number
): Promise<UserProfile> {
  const user = await userRequest<UserProfile>(
    `/api/v1/users/${userId}/verify-account`,
    {
      method: 'PATCH',
    }
  );

  clearUserProfileCache(userId);

  return user;
}

export async function verifyUserPhone(
  userId: number
): Promise<UserProfile> {
  const user = await userRequest<UserProfile>(
    `/api/v1/users/${userId}/verify-phone`,
    {
      method: 'PATCH',
    }
  );

  clearUserProfileCache(userId);

  return user;
}
