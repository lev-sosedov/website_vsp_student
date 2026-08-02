import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  login as loginRequest,
  register as registerRequest,
} from '../api/authApi';

import {
  getUserProfile,
  type UserProfile,
} from '../api/userApi';


const ACCESS_TOKEN_KEY = 'vshp_access_token';
const REFRESH_TOKEN_KEY = 'vshp_refresh_token';
const USER_KEY = 'vshp_user';

export type AuthUser = UserProfile;

export type RegisterData = {
  phone_number: string;
  password: string;
  user_name: string;
};

type AuthResult = {
  success: boolean;
  error?: string;
};

type JwtPayload = {
  sub?: string;
  user_id?: number | string;
  role?: string;
  type?: string;
  token_version?: number;
  iss?: string;
  aud?: string | string[];
  iat?: number;
  nbf?: number;
  jti?: string;
  exp?: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;

  login: (
    phoneNumber: string,
    password: string
  ) => Promise<AuthResult>;

  register: (
    data: RegisterData
  ) => Promise<AuthResult>;

  logout: () => void;

  getAccessToken: () => string | null;

  refreshProfile: () => Promise<AuthResult>;
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

/**
 * Безопасно декодирует payload JWT.
 *
 * Это не проверка подписи токена.
 * Подпись токена проверяет backend.
 */
function decodeJwtPayload(
  token: string
): JwtPayload | null {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1];

    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const paddingLength =
      (4 - (base64.length % 4)) % 4;

    const paddedBase64 = base64.padEnd(
      base64.length + paddingLength,
      '='
    );

    const decoded = window.atob(paddedBase64);

    const bytes = Uint8Array.from(
      decoded,
      (character) => character.charCodeAt(0)
    );

    const json = new TextDecoder().decode(bytes);

    return JSON.parse(json) as JwtPayload;
  } catch (error) {
    console.error(
      'Не удалось декодировать JWT:',
      error
    );

    return null;
  }
}

/**
 * Проверяет срок действия access token.
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

/**
 * Получает user_id из access token.
 */
function getUserIdFromToken(
  token: string
): number | null {
  const payload = decodeJwtPayload(token);
  const rawUserId = payload?.sub ?? payload?.user_id;
  const userId = Number(rawUserId);

  if (
    payload?.type !== 'access' ||
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !payload.exp ||
    payload.exp * 1000 <= Date.now()
  ) {
    return null;
  }

  return userId;
}

/**
 * Читает ранее сохранённый профиль.
 */
function getStoredUser(): AuthUser | null {
  const storedUser =
    localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch (error) {
    console.error(
      'Не удалось прочитать пользователя из localStorage:',
      error
    );

    localStorage.removeItem(USER_KEY);

    return null;
  }
}

/**
 * Преобразует неизвестную ошибку в понятный текст.
 */
function getErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  if (typeof error === 'string') {
    return error || fallbackMessage;
  }

  return fallbackMessage;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  /**
   * Полностью очищает локальные данные авторизации.
   */
  const clearAuthData = useCallback(() => {
    setUser(null);
    setAccessToken(null);

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  /**
   * Сохраняет токены.
   */
  const saveTokens = useCallback(
    (
      newAccessToken: string,
      newRefreshToken: string
    ) => {
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        newAccessToken
      );

      localStorage.setItem(
        REFRESH_TOKEN_KEY,
        newRefreshToken
      );

      setAccessToken(newAccessToken);
    },
    []
  );

  /**
   * Сохраняет полный профиль пользователя.
   */
  const saveUser = useCallback(
    (profile: AuthUser) => {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(profile)
      );

      setUser(profile);
    },
    []
  );

  /**
   * Загружает полный профиль пользователя
   * через API Gateway.
   */
  const loadUserProfile = useCallback(
    async (
      token: string,
      userId?: number
    ): Promise<AuthUser> => {
      const resolvedUserId =
        userId ?? getUserIdFromToken(token);

      if (!resolvedUserId) {
        throw new Error(
          'В access token отсутствует идентификатор пользователя'
        );
      }

      const profile = await getUserProfile(
        resolvedUserId,
        token
      );

      saveUser(profile);

      return profile;
    },
    [saveUser]
  );

  /**
   * Восстанавливает авторизацию после F5
   * или повторного открытия сайта.
   */
  useEffect(() => {
    let isMounted = true;

    const restoreAuth = async () => {
      const storedAccessToken =
        localStorage.getItem(ACCESS_TOKEN_KEY);

      if (!storedAccessToken) {
        if (isMounted) {
          setLoading(false);
        }

        return;
      }

      if (isTokenExpired(storedAccessToken)) {
        clearAuthData();

        if (isMounted) {
          setLoading(false);
        }

        return;
      }

      setAccessToken(storedAccessToken);

      const storedUser = getStoredUser();

      if (storedUser && isMounted) {
        setUser(storedUser);
      }

      try {
        await loadUserProfile(storedAccessToken);
      } catch (error) {
        console.error(
          'Не удалось обновить профиль при восстановлении авторизации:',
          error
        );

        /*
         * Если Gateway временно недоступен, но в localStorage
         * уже есть профиль, не выбрасываем пользователя из кабинета.
         */
        if (!storedUser) {
          clearAuthData();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void restoreAuth();

    return () => {
      isMounted = false;
    };
  }, [
    clearAuthData,
    loadUserProfile,
  ]);

  /**
   * Вход по номеру телефона и паролю.
   */
  const login = useCallback(
    async (
      phoneNumber: string,
      password: string
    ): Promise<AuthResult> => {
      try {
        const loginData = await loginRequest({
          phone_number: phoneNumber,
          password,
        });

        if (
          !loginData.access_token ||
          !loginData.refresh_token
        ) {
          return {
            success: false,
            error:
              'Сервер не вернул токены авторизации',
          };
        }

        const userId = getUserIdFromToken(
          loginData.access_token
        );

        if (!userId) {
          return {
            success: false,
            error:
              'В access token отсутствует идентификатор пользователя',
          };
        }

        saveTokens(
          loginData.access_token,
          loginData.refresh_token
        );

        try {
          await loadUserProfile(
            loginData.access_token,
            userId
          );
        } catch (profileError) {
          /*
           * Если токены уже получены, но профиль не загрузился,
           * очищаем данные, чтобы не оставить неполный вход.
           */
          clearAuthData();

          return {
            success: false,
            error: getErrorMessage(
              profileError,
              'Вход выполнен, но не удалось загрузить профиль пользователя'
            ),
          };
        }

        return {
          success: true,
        };
      } catch (error) {
        console.error('Ошибка входа:', error);

        return {
          success: false,
          error: getErrorMessage(
            error,
            'Не удалось выполнить вход'
          ),
        };
      }
    },
    [
      clearAuthData,
      loadUserProfile,
      saveTokens,
    ]
  );

  /**
   * Регистрация пользователя.
   *
   * После регистрации backend пока не выдаёт JWT,
   * поэтому пользователь должен войти отдельно.
   */
  const register = useCallback(
    async (
      data: RegisterData
    ): Promise<AuthResult> => {
      try {
        await registerRequest({
          phone_number: data.phone_number,
          password: data.password,
          user_name: data.user_name,
        });

        return {
          success: true,
        };
      } catch (error) {
        console.error(
          'Ошибка регистрации:',
          error
        );

        return {
          success: false,
          error: getErrorMessage(
            error,
            'Не удалось создать аккаунт'
          ),
        };
      }
    },
    []
  );

  /**
   * Обновляет профиль пользователя вручную.
   *
   * Пригодится после изменения имени,
   * телефона, аватара или других данных.
   */
  const refreshProfile = useCallback(
    async (): Promise<AuthResult> => {
      const token =
        accessToken ??
        localStorage.getItem(ACCESS_TOKEN_KEY);

      if (!token) {
        return {
          success: false,
          error:
            'Пользователь не авторизован',
        };
      }

      if (isTokenExpired(token)) {
        clearAuthData();

        return {
          success: false,
          error:
            'Срок действия сессии истёк',
        };
      }

      try {
        await loadUserProfile(token);

        return {
          success: true,
        };
      } catch (error) {
        console.error(
          'Ошибка обновления профиля:',
          error
        );

        return {
          success: false,
          error: getErrorMessage(
            error,
            'Не удалось обновить профиль'
          ),
        };
      }
    },
    [
      accessToken,
      clearAuthData,
      loadUserProfile,
    ]
  );

  /**
   * Локальный выход из аккаунта.
   */
  const logout = useCallback(() => {
    clearAuthData();
  }, [clearAuthData]);

  /**
   * Возвращает текущий access token.
   */
  const getAccessToken = useCallback(() => {
    return (
      accessToken ??
      localStorage.getItem(ACCESS_TOKEN_KEY)
    );
  }, [accessToken]);

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,

        isAuthenticated:
          Boolean(accessToken && user),

        loading,

        login,
        register,
        logout,
        getAccessToken,
        refreshProfile,
      }),
      [
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        getAccessToken,
        refreshProfile,
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
