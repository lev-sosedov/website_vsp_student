const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export interface RegisterRequest {
  phone_number: string;
  password: string;
  user_name: string;
}

export interface RegisterResponse {
  id: number;
  phone_number: string;
  message: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

function getAccessToken(): string {
  return (
    localStorage.getItem('vshp_access_token') ??
    localStorage.getItem('access_token') ??
    localStorage.getItem('accessToken') ??
    ''
  );
}

async function readResponse(response: Response) {
  const contentType = response.headers.get(
    'content-type'
  );

  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function getResponseError(
  result: unknown,
  fallback: string
): string {
  if (
    typeof result === 'object' &&
    result !== null &&
    'detail' in result
  ) {
    const detail = (
      result as {
        detail?: string | {
          message?: string;
        };
      }
    ).detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (detail?.message) {
      return detail.message;
    }
  }

  return fallback;
}

export async function login(
  data: LoginRequest
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  const result = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getResponseError(result, 'Ошибка входа')
    );
  }

  return result as LoginResponse;
}

export async function register(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  const result = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getResponseError(
        result,
        'Ошибка регистрации'
      )
    );
  }

  return result as RegisterResponse;
}

export async function changePassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error(
      'Не удалось определить текущую сессию'
    );
  }

  const response = await fetch(
    `${API_URL}/api/v1/auth/change-password`,
    {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getResponseError(
        result,
        'Не удалось изменить пароль'
      )
    );
  }

  return result as ChangePasswordResponse;
}
