import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8000';

const ACCESS_TOKEN_KEY = 'vshp_access_token';
const REFRESH_TOKEN_KEY = 'vshp_refresh_token';
const USER_KEY = 'vshp_user';

type UserRole = 'student' | 'parent' | 'teacher' | 'admin' | string;

export type AuthUser = {
  id?: string | number;
  user_name?: string;
  phone_number?: string;
  role?: UserRole;
};

export type RegisterData = {
  phone_number: string;
  password: string;
  user_name: string;
};

type AuthResult = {
  success: boolean;
  error?: string;
};

type LoginResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;

  // На случай, если backend возвращает токены внутри объекта data
  data?: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    user?: AuthUser;
  };

  user?: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;

  login: (
    phoneNumber: string,
    password: string
  ) => Promise<AuthResult>;

  register: (data: RegisterData) => Promise<AuthResult>;

  logout: () => void;

  getAccessToken: () => string | null;

  refreshAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(
  responseData: unknown,
  fallback: string
): string {
  if (!responseData || typeof responseData !== 'object') {
    return fallback;
  }

  const data = responseData as Record<string, unknown>;

  if (typeof data.detail === 'string') {
    return data.detail;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (typeof data.error === 'string') {
    return data.error;
  }

  if (Array.isArray(data.detail)) {
    const firstError = data.detail[0];

    if (
      firstError &&
      typeof firstError === 'object' &&
      'msg' in firstError &&
      typeof firstError.msg === 'string'
    ) {
      return firstError.msg;
    }
  }

  return fallback;
}

async function readResponseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();

  return text || null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const tokenParts = token.split('.');

    if (tokenParts.length !== 3) {
      return null;
    }

    const payload = tokenParts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decodedPayload = decodeURIComponent(
      window
        .atob(payload)
        .split('')
        .map(
          (character) =>
            `%${character
              .charCodeAt(0)
              .toString(16)
              .padStart(2, '0')}`
        )
        .join('')
    );

    return JSON.parse(decodedPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function createUserFromToken(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return null;
  }

  const id =
    payload.user_id ??
    payload.id ??
    payload.sub;

  const userName =
    payload.user_name ??
    payload.username ??
    payload.name;

  const phoneNumber =
    payload.phone_number ??
    payload.phone;

  const role = payload.role;

  return {
    id:
      typeof id === 'string' || typeof id === 'number'
        ? id
        : undefined,

    user_name:
      typeof userName === 'string'
        ? userName
        : undefined,

    phone_number:
      typeof phoneNumber === 'string'
        ? phoneNumber
        : undefined,

    role:
      typeof role === 'string'
        ? role
        : undefined,
  };
}

function saveUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function extractTokens(data: LoginResponse) {
  return {
    accessToken:
      data.access_token ??
      data.data?.access_token ??
      null,

    refreshToken:
      data.refresh_token ??
      data.data?.refresh_token ??
      null,

    user:
      data.user ??
      data.data?.user ??
      null,
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(
    null
  );

  const clearAuthData = useCallback(() => {
    setUser(null);
    setAccessToken(null);

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const saveAuthData = useCallback(
    (
      newAccessToken: string,
      newRefreshToken?: string | null,
      responseUser?: AuthUser | null
    ) => {
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        newAccessToken
      );

      if (newRefreshToken) {
        localStorage.setItem(
          REFRESH_TOKEN_KEY,
          newRefreshToken
        );
      }

      const tokenUser = createUserFromToken(newAccessToken);
      const authenticatedUser =
        responseUser ?? tokenUser ?? {};

      setAccessToken(newAccessToken);
      setUser(authenticatedUser);
      saveUser(authenticatedUser);
    },
    []
  );

  const refreshAccessToken =
    useCallback(async (): Promise<string | null> => {
      const refreshToken = localStorage.getItem(
        REFRESH_TOKEN_KEY
      );

      if (!refreshToken) {
        clearAuthData();
        return null;
      }

      try {
        const response = await fetch(
          `${AUTH_API_URL}/api/v1/auth/refresh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refresh_token: refreshToken,
            }),
          }
        );

        const responseData = await readResponseData(response);

        if (!response.ok) {
          clearAuthData();
          return null;
        }

        const tokenData = responseData as LoginResponse;
        const {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: responseUser,
        } = extractTokens(tokenData);

        if (!newAccessToken) {
          clearAuthData();
          return null;
        }

        saveAuthData(
          newAccessToken,
          newRefreshToken ?? refreshToken,
          responseUser
        );

        return newAccessToken;
      } catch {
        clearAuthData();
        return null;
      }
    }, [clearAuthData, saveAuthData]);

  useEffect(() => {
    const restoreAuth = async () => {
      const storedAccessToken = localStorage.getItem(
        ACCESS_TOKEN_KEY
      );

      if (!storedAccessToken) {
        setLoading(false);
        return;
      }

      const payload = decodeJwtPayload(storedAccessToken);
      const expiresAt =
        typeof payload?.exp === 'number'
          ? payload.exp * 1000
          : null;

      if (expiresAt && expiresAt <= Date.now()) {
        await refreshAccessToken();
        setLoading(false);
        return;
      }

      const storedUser = getStoredUser();
      const tokenUser = createUserFromToken(storedAccessToken);

      setAccessToken(storedAccessToken);
      setUser(storedUser ?? tokenUser ?? {});

      setLoading(false);
    };

    void restoreAuth();
  }, [refreshAccessToken]);

  const login = useCallback(
    async (
      phoneNumber: string,
      password: string
    ): Promise<AuthResult> => {
      try {
        const response = await fetch(
          `${AUTH_API_URL}/api/v1/auth/login`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone_number: phoneNumber,
              password,
            }),
          }
        );

        const responseData = await readResponseData(response);

        if (!response.ok) {
          return {
            success: false,
            error: getErrorMessage(
              responseData,
              response.status === 401
                ? 'Неверный номер телефона или пароль'
                : 'Не удалось выполнить вход'
            ),
          };
        }

        const tokenData = responseData as LoginResponse;
        const {
          accessToken: newAccessToken,
          refreshToken,
          user: responseUser,
        } = extractTokens(tokenData);

        if (!newAccessToken) {
          return {
            success: false,
            error:
              'Сервер не вернул access token. Проверьте ответ auth_service.',
          };
        }

        saveAuthData(
          newAccessToken,
          refreshToken,
          responseUser
        );

        return {
          success: true,
        };
      } catch {
        return {
          success: false,
          error:
            'Не удалось подключиться к серверу авторизации',
        };
      }
    },
    [saveAuthData]
  );

  const register = useCallback(
    async (data: RegisterData): Promise<AuthResult> => {
      try {
        const response = await fetch(
          `${AUTH_API_URL}/api/v1/auth/register`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone_number: data.phone_number,
              password: data.password,
              user_name: data.user_name,
            }),
          }
        );

        const responseData = await readResponseData(response);

        if (!response.ok) {
          return {
            success: false,
            error: getErrorMessage(
              responseData,
              response.status === 409
                ? 'Пользователь с таким номером уже существует'
                : 'Не удалось создать аккаунт'
            ),
          };
        }

        /*
         * После регистрации пользователь не авторизуется
         * автоматически. Register.tsx перенаправит его
         * на страницу входа.
         */

        return {
          success: true,
        };
      } catch {
        return {
          success: false,
          error:
            'Не удалось подключиться к серверу регистрации',
        };
      }
    },
    []
  );

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(
      REFRESH_TOKEN_KEY
    );

    clearAuthData();

    if (!refreshToken) {
      return;
    }

    void fetch(`${AUTH_API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    }).catch(() => {
      // Локальный выход уже выполнен.
    });
  }, [clearAuthData]);

  const getAccessToken = useCallback(() => {
    return (
      accessToken ??
      localStorage.getItem(ACCESS_TOKEN_KEY)
    );
  }, [accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(accessToken),
      loading,
      login,
      register,
      logout,
      getAccessToken,
      refreshAccessToken,
    }),
    [
      user,
      accessToken,
      loading,
      login,
      register,
      logout,
      getAccessToken,
      refreshAccessToken,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth должен использоваться внутри AuthProvider'
    );
  }

  return context;
}