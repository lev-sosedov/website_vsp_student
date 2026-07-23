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
  role: string;
  is_active: boolean;
  is_account_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  updated_at: string;
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