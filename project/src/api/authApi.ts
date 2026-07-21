const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080";

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

async function readResponse(response: Response) {
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text();
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
      typeof result === 'object'
        ? (result as any).detail || 'Ошибка входа'
        : 'Ошибка входа'
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
      typeof result === 'object'
        ? (result as any).detail || 'Ошибка регистрации'
        : 'Ошибка регистрации'
    );
  }

  return result as RegisterResponse;
}