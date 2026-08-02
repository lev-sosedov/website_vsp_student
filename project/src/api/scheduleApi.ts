import { authorizedFetch } from './authorizedClient';
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

export interface GetLessonsParams {
  groupId?: number;
  teacherId?: number;
  roomId?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  isExtra?: boolean;
  skip?: number;
  limit?: number;
}

export interface LessonCreate {
  group_id: number;
  teacher_id: number;
  room_id: number;
  template_id?: number | null;
  lesson_date: string;
  start_time: string;
  end_time: string;
  lesson_type: LessonType;
  topic?: string | null;
  description?: string | null;
  is_extra: boolean;
  created_by?: number | null;
}

export interface LessonUpdate {
  group_id?: number;
  teacher_id?: number;
  room_id?: number;
  template_id?: number | null;
  lesson_date?: string;
  start_time?: string;
  end_time?: string;
  lesson_type?: LessonType;
  topic?: string | null;
  description?: string | null;
  is_extra?: boolean;
  changed_by: number;
  reason?: string | null;
}

export interface LessonReschedule {
  lesson_date: string;
  start_time: string;
  end_time: string;
  room_id?: number;
  teacher_id?: number;
  changed_by: number;
  reason: string;
}

export interface ScheduleTemplate {
  id: number;
  group_id: number;
  teacher_id: number;
  room_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  lesson_type: LessonType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleTemplateCreate {
  group_id: number;
  teacher_id: number;
  room_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  lesson_type: LessonType;
}

export type ScheduleTemplateUpdate =
  Partial<ScheduleTemplateCreate> & {
    is_active?: boolean;
  };

export interface LessonGenerationRequest {
  date_from: string;
  date_to: string;
  created_by: number;
  skip_conflicts: boolean;
  topic?: string | null;
  description?: string | null;
}

export interface LessonGenerationResult {
  template_id: number;
  date_from: string;
  date_to: string;
  created_count: number;
  skipped_count: number;
  created_lesson_ids: number[];
  conflicts: Array<{
    lesson_date: string;
    reason: string;
    conflict_lesson_id: number | null;
  }>;
}

interface ScheduleTemplateListResponse {
  total: number;
  items: ScheduleTemplate[];
}

export interface GetScheduleTemplatesParams {
  groupId?: number;
  teacherId?: number;
  roomId?: number;
  weekday?: number;
  isActive?: boolean;
  skip?: number;
  limit?: number;
}

export interface ScheduleChange {
  id: number;
  lesson_id: number;
  change_type: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  reason: string | null;
  changed_by: number;
  comment: string | null;
  created_at: string;
}

interface ScheduleChangeListResponse {
  total: number;
  items: ScheduleChange[];
}

export interface GetScheduleChangesParams {
  lessonId?: number;
  changedBy?: number;
  changeType?: string;
  skip?: number;
  limit?: number;
}

interface RoomListResponse {
  total: number;
  items: Room[];
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

export interface RoomCreate {
  branch_id: number;
  name: string;
  capacity: number | null;
  description: string | null;
}

export interface RoomUpdate {
  branch_id?: number;
  name?: string;
  capacity?: number | null;
  description?: string | null;
  is_active?: boolean;
}

interface FastApiErrorResponse {
  detail?: string | Array<{
    loc?: Array<string | number>;
    msg?: string;
    type?: string;
  }>;
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
  const response = await authorizedFetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

export async function getRooms(
  branchId?: number,
  isActive: boolean | null = true
): Promise<Room[]> {
  const searchParams = new URLSearchParams({
    limit: '500',
  });

  if (isActive !== null) {
    searchParams.set(
      'is_active',
      String(isActive)
    );
  }

  if (branchId) {
    searchParams.set('branch_id', String(branchId));
  }

  const response = await request<RoomListResponse>(
    `/api/v1/rooms?${searchParams.toString()}`
  );

  return response.items;
}

export async function createRoom(
  data: RoomCreate
): Promise<Room> {
  return request<Room>('/api/v1/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoom(
  roomId: number,
  data: RoomUpdate
): Promise<Room> {
  return request<Room>(
    `/api/v1/rooms/${roomId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function deactivateRoom(
  roomId: number
): Promise<Room> {
  return request<Room>(
    `/api/v1/rooms/${roomId}/deactivate`,
    {
      method: 'POST',
    }
  );
}

export async function activateRoom(
  roomId: number
): Promise<Room> {
  return request<Room>(
    `/api/v1/rooms/${roomId}/activate`,
    {
      method: 'POST',
    }
  );
}

export async function getTeacherLessons(
  teacherId: number,
  dateFrom?: string,
  dateTo?: string
): Promise<LessonSchedule[]> {
  const searchParams = new URLSearchParams();

  if (dateFrom) {
    searchParams.set('lesson_date_from', dateFrom);
  }

  if (dateTo) {
    searchParams.set('lesson_date_to', dateTo);
  }

  const query = searchParams.toString();
  const response = await request<LessonListResponse>(
    `/api/v1/lessons/teacher/${teacherId}${
      query ? `?${query}` : ''
    }`
  );

  return response.items;
}

export async function getLessons(
  params: GetLessonsParams = {}
): Promise<LessonSchedule[]> {
  const searchParams = new URLSearchParams({
    skip: String(params.skip ?? 0),
    limit: String(params.limit ?? 500),
  });

  if (params.groupId) {
    searchParams.set('group_id', String(params.groupId));
  }

  if (params.teacherId) {
    searchParams.set(
      'teacher_id',
      String(params.teacherId)
    );
  }

  if (params.roomId) {
    searchParams.set('room_id', String(params.roomId));
  }

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

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.isExtra !== undefined) {
    searchParams.set(
      'is_extra',
      String(params.isExtra)
    );
  }

  const response = await request<LessonListResponse>(
    `/api/v1/lessons?${searchParams.toString()}`
  );

  return response.items;
}

export function createLesson(
  lesson: LessonCreate
): Promise<LessonSchedule> {
  return request<LessonSchedule>('/api/v1/lessons', {
    method: 'POST',
    body: JSON.stringify(lesson),
  });
}

export function updateLesson(
  lessonId: number,
  lesson: LessonUpdate
): Promise<LessonSchedule> {
  return request<LessonSchedule>(
    `/api/v1/lessons/${lessonId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(lesson),
    }
  );
}

export function cancelLesson(
  lessonId: number,
  changedBy: number,
  reason: string
): Promise<LessonSchedule> {
  return request<LessonSchedule>(
    `/api/v1/lessons/${lessonId}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({
        changed_by: changedBy,
        reason,
      }),
    }
  );
}

export function completeLesson(
  lessonId: number,
  changedBy: number,
  reason?: string
): Promise<LessonSchedule> {
  return request<LessonSchedule>(
    `/api/v1/lessons/${lessonId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({
        changed_by: changedBy,
        reason: reason?.trim() || null,
      }),
    }
  );
}

export function rescheduleLesson(
  lessonId: number,
  payload: LessonReschedule
): Promise<LessonSchedule> {
  return request<LessonSchedule>(
    `/api/v1/lessons/${lessonId}/reschedule`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function getTeacherScheduleTemplates(
  teacherId: number
): Promise<ScheduleTemplate[]> {
  const response =
    await request<ScheduleTemplateListResponse>(
      `/api/v1/schedule-templates?teacher_id=${teacherId}&limit=500`
    );

  return response.items;
}

export async function getScheduleTemplates(
  params: GetScheduleTemplatesParams = {}
): Promise<ScheduleTemplate[]> {
  const searchParams = new URLSearchParams({
    skip: String(params.skip ?? 0),
    limit: String(params.limit ?? 500),
  });

  if (params.groupId) {
    searchParams.set('group_id', String(params.groupId));
  }

  if (params.teacherId) {
    searchParams.set(
      'teacher_id',
      String(params.teacherId)
    );
  }

  if (params.roomId) {
    searchParams.set('room_id', String(params.roomId));
  }

  if (params.weekday !== undefined) {
    searchParams.set(
      'weekday',
      String(params.weekday)
    );
  }

  if (params.isActive !== undefined) {
    searchParams.set(
      'is_active',
      String(params.isActive)
    );
  }

  const response =
    await request<ScheduleTemplateListResponse>(
      `/api/v1/schedule-templates?${searchParams.toString()}`
    );

  return response.items;
}

export function createScheduleTemplate(
  template: ScheduleTemplateCreate
): Promise<ScheduleTemplate> {
  return request<ScheduleTemplate>(
    '/api/v1/schedule-templates',
    {
      method: 'POST',
      body: JSON.stringify(template),
    }
  );
}

export function updateScheduleTemplate(
  templateId: number,
  template: ScheduleTemplateUpdate
): Promise<ScheduleTemplate> {
  return request<ScheduleTemplate>(
    `/api/v1/schedule-templates/${templateId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(template),
    }
  );
}

export function setScheduleTemplateActive(
  templateId: number,
  isActive: boolean
): Promise<ScheduleTemplate> {
  return request<ScheduleTemplate>(
    `/api/v1/schedule-templates/${templateId}/${
      isActive ? 'activate' : 'deactivate'
    }`,
    {
      method: 'POST',
    }
  );
}

export function generateTemplateLessons(
  templateId: number,
  payload: LessonGenerationRequest
): Promise<LessonGenerationResult> {
  return request<LessonGenerationResult>(
    `/api/v1/schedule-templates/${templateId}/generate-lessons`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function getScheduleChanges(
  params: GetScheduleChangesParams = {}
): Promise<ScheduleChange[]> {
  const searchParams = new URLSearchParams({
    skip: String(params.skip ?? 0),
    limit: String(params.limit ?? 500),
  });

  if (params.lessonId) {
    searchParams.set(
      'lesson_id',
      String(params.lessonId)
    );
  }

  if (params.changedBy) {
    searchParams.set(
      'changed_by',
      String(params.changedBy)
    );
  }

  if (params.changeType) {
    searchParams.set(
      'change_type',
      params.changeType
    );
  }

  const response =
    await request<ScheduleChangeListResponse>(
      `/api/v1/schedule-changes?${searchParams.toString()}`
    );

  return response.items;
}
