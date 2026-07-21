const API_URL = import.meta.env.VITE_API_URL;

export type LessonStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | string;

export type LessonType =
  | 'regular'
  | 'extra'
  | 'replacement'
  | 'consultation'
  | string;

export interface LessonSchedule {
  id: number;

  group_id: number;
  teacher_id: number;
  room_id: number;
  template_id: number | null;

  lesson_date: string;
  start_time: string;
  end_time: string;

  status: LessonStatus;
  lesson_type: LessonType;

  topic: string | null;
  description: string | null;

  is_extra: boolean;
  created_by: number | null;

  created_at: string;
  updated_at: string;
}

export interface LessonListResponse {
  total: number;
  items: LessonSchedule[];
}

/**
 * Параметры получения занятий группы.
 *
 * На backend они отправляются как:
 * lesson_date_from
 * lesson_date_to
 */
export interface GetGroupLessonsParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface Room {
  id: number;
  branch_id: number;
  name: string;
  capacity: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FastApiErrorResponse {
  detail?: string | Array<{
    loc?: Array<string | number>;
    msg?: string;
    type?: string;
  }>;
}

function getAccessToken(): string | null {
  return (
    localStorage.getItem('access_token') ??
    localStorage.getItem('accessToken')
  );
}

function getErrorMessage(
  errorData: FastApiErrorResponse | null,
  response: Response
): string {
  if (typeof errorData?.detail === 'string') {
    return errorData.detail;
  }

  if (Array.isArray(errorData?.detail)) {
    const messages = errorData.detail
      .map((item) => item.msg)
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  return `Ошибка Schedule API: ${response.status} ${response.statusText}`;
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
    let errorData: FastApiErrorResponse | null = null;

    try {
      errorData = (await response.json()) as FastApiErrorResponse;
    } catch {
      errorData = null;
    }

    throw new Error(
      getErrorMessage(errorData, response)
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Форматирует локальную дату без преобразования в UTC.
 *
 * Например:
 * 20 июля 2026 года -> 2026-07-20
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildGroupLessonsQueryString(
  params: GetGroupLessonsParams
): string {
  const searchParams = new URLSearchParams();

  if (params.dateFrom) {
    searchParams.set(
      'lesson_date_from',
      params.dateFrom
    );
  }

  if (params.dateTo) {
    searchParams.set(
      'lesson_date_to',
      params.dateTo
    );
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
}

/**
 * Получает полный ответ со списком занятий группы.
 *
 * Пример:
 * GET /api/v1/lessons/group/1
 *     ?lesson_date_from=2026-07-20
 *     &lesson_date_to=2026-07-26
 */
export async function getGroupLessonsResponse(
  groupId: number,
  params: GetGroupLessonsParams = {}
): Promise<LessonListResponse> {
  if (!Number.isInteger(groupId) || groupId <= 0) {
    throw new Error('Некорректный ID группы');
  }

  const queryString =
    buildGroupLessonsQueryString(params);

  return request<LessonListResponse>(
    `/api/v1/lessons/group/${groupId}${queryString}`
  );
}

/**
 * Получает только массив занятий группы.
 */
export async function getGroupLessons(
  groupId: number,
  params: GetGroupLessonsParams = {}
): Promise<LessonSchedule[]> {
  const response = await getGroupLessonsResponse(
    groupId,
    params
  );

  return response.items;
}

/**
 * Получает занятия группы за выбранный диапазон дат.
 */
export async function getGroupLessonsByDateRange(
  groupId: number,
  dateFrom: string,
  dateTo: string
): Promise<LessonSchedule[]> {
  if (!dateFrom || !dateTo) {
    throw new Error(
      'Необходимо указать начальную и конечную дату'
    );
  }

  if (dateTo < dateFrom) {
    throw new Error(
      'Конечная дата не может быть раньше начальной'
    );
  }

  return getGroupLessons(groupId, {
    dateFrom,
    dateTo,
  });
}

/**
 * Получает одно занятие по ID.
 */
export async function getLesson(
  lessonId: number
): Promise<LessonSchedule> {
  if (!Number.isInteger(lessonId) || lessonId <= 0) {
    throw new Error('Некорректный ID занятия');
  }

  return request<LessonSchedule>(
    `/api/v1/lessons/${lessonId}`
  );
}

/**
 * Получает занятия группы на сегодня.
 *
 * Отменённые занятия исключаются.
 */
export async function getTodayLessons(
  groupId: number
): Promise<LessonSchedule[]> {
  const today = formatLocalDate(new Date());

  const lessons = await getGroupLessonsByDateRange(
    groupId,
    today,
    today
  );

  return lessons
    .filter(
      (lesson) =>
        lesson.lesson_date === today &&
        lesson.status !== 'cancelled'
    )
    .sort((firstLesson, secondLesson) =>
      firstLesson.start_time.localeCompare(
        secondLesson.start_time
      )
    );
}

/**
 * Получает данные кабинета.
 */
export async function getRoom(
  roomId: number
): Promise<Room> {
  if (!Number.isInteger(roomId) || roomId <= 0) {
    throw new Error('Некорректный ID кабинета');
  }

  return request<Room>(
    `/api/v1/rooms/${roomId}`
  );
}