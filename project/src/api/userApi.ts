const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080";

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

export async function getUserProfile(
  id: number,
  accessToken: string
): Promise<UserProfile> {

  const response = await fetch(
    `${API_URL}/api/v1/users/${id}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Не удалось получить профиль');
  }

  return response.json();
}

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

export async function getUserById(
  userId: number
): Promise<UserProfile> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/v1/users/${userId}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${
          localStorage.getItem('access_token') ??
          localStorage.getItem('accessToken') ??
          ''
        }`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText ||
        `Не удалось получить пользователя: ${response.status}`
    );
  }

  return response.json() as Promise<UserProfile>;
}