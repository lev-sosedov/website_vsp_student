import { authorizedFetch } from './authorizedClient';
const API_URL = import.meta.env.VITE_API_URL;

export type AttendanceStatus =
  | 'present'
  | 'remote'
  | 'absent'
  | 'late'
  | 'excused';

export interface AttendanceRecord {
  id: number;
  lesson_id: number;
  student_id: number;

  status: AttendanceStatus;
  late_minutes: number;
  comment: string | null;

  marked_by: number;

  created_at: string;
  updated_at: string;
}

export interface AttendanceListResponse {
  total: number;
  items: AttendanceRecord[];
}

export interface CreateAttendanceData {
  lesson_id: number;
  student_id: number;
  status: AttendanceStatus;
  late_minutes: number;
  comment: string | null;
  marked_by: number;
}

export interface UpdateAttendanceData {
  status?: AttendanceStatus;
  late_minutes?: number;
  comment?: string | null;
  marked_by: number;
}

interface FastApiErrorResponse {
  detail?:
    | string
    | {
        error?: string;
        message?: string;
      }
    | Array<{
        msg?: string;
      }>;
}

function validateId(
  id: number,
  fieldName: string
): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Некорректный ${fieldName}`);
  }
}

function getApiErrorMessage(
  data: FastApiErrorResponse | null,
  response: Response
): string {
  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (
    data?.detail &&
    !Array.isArray(data.detail) &&
    typeof data.detail === 'object'
  ) {
    return (
      data.detail.message ??
      data.detail.error ??
      `Ошибка Attendance API: ${response.status}`
    );
  }

  if (Array.isArray(data?.detail)) {
    const messages = data.detail
      .map((item) => item.msg)
      .filter(
        (message): message is string =>
          Boolean(message)
      );

    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  return `Ошибка Attendance API: ${response.status} ${response.statusText}`;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authorizedFetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',


        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    let errorData: FastApiErrorResponse | null =
      null;

    try {
      errorData =
        (await response.json()) as FastApiErrorResponse;
    } catch {
      errorData = null;
    }

    throw new Error(
      getApiErrorMessage(errorData, response)
    );
  }

  return response.json() as Promise<T>;
}

export async function getStudentAttendance(
  studentId: number,
  skip = 0,
  limit = 500
): Promise<AttendanceListResponse> {
  validateId(studentId, 'ID студента');

  const query = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  return request<AttendanceListResponse>(
    `/api/v1/attendance/student/${studentId}?${query.toString()}`
  );
}

export async function getLessonAttendance(
  lessonId: number
): Promise<AttendanceListResponse> {
  validateId(lessonId, 'ID занятия');

  return request<AttendanceListResponse>(
    `/api/v1/attendance/lesson/${lessonId}`
  );
}

export async function createAttendance(
  data: CreateAttendanceData
): Promise<AttendanceRecord> {
  validateId(data.lesson_id, 'ID занятия');
  validateId(data.student_id, 'ID студента');
  validateId(data.marked_by, 'ID преподавателя');

  return request<AttendanceRecord>(
    '/api/v1/attendance',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateAttendance(
  attendanceId: number,
  data: UpdateAttendanceData
): Promise<AttendanceRecord> {
  validateId(
    attendanceId,
    'ID отметки посещаемости'
  );

  validateId(
    data.marked_by,
    'ID преподавателя'
  );

  return request<AttendanceRecord>(
    `/api/v1/attendance/${attendanceId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}
