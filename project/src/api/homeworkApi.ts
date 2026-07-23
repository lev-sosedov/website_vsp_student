const API_URL = import.meta.env.VITE_API_URL;

export type HomeworkSubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'needs_revision'
  | 'accepted'
  | 'rejected';

export interface Homework {
  id: number;
  lesson_id: number;
  group_id: number | null;

  title: string;
  description: string;
  instructions: string | null;

  max_score: number;
  due_at: string | null;

  allow_late_submission: boolean;
  is_published: boolean;
  is_active: boolean;

  created_by: number;
  updated_by: number | null;

  created_at: string;
  updated_at: string;
}

export interface HomeworkListResponse {
  total: number;
  items: Homework[];
}

export interface HomeworkSubmission {
  id: number;

  homework_id: number;
  student_id: number;

  answer_text: string | null;

  status: HomeworkSubmissionStatus;

  score: number | null;
  teacher_comment: string | null;
  checked_by: number | null;

  is_late: boolean;

  submitted_at: string | null;
  checked_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface HomeworkSubmissionListResponse {
  total: number;
  items: HomeworkSubmission[];
}

export interface HomeworkAttachment {
  id: number;
  homework_id: number;

  title: string;
  attachment_type: string;

  file_url: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;

  sort_order: number;
  is_visible: boolean;

  uploaded_by: number;
  created_at: string;
}

export interface HomeworkAttachmentListResponse {
  total: number;
  items: HomeworkAttachment[];
}

interface FastApiError {
  detail?:
    | string
    | Array<{
        msg?: string;
      }>;
}

function getAccessToken(): string | null {
  return (
    localStorage.getItem('access_token') ??
    localStorage.getItem('accessToken')
  );
}

function getApiErrorMessage(
  data: FastApiError | null,
  response: Response
): string {
  if (typeof data?.detail === 'string') {
    return data.detail;
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

  return `Ошибка Homework API: ${response.status} ${response.statusText}`;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
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
    }
  );

  if (!response.ok) {
    let errorData: FastApiError | null = null;

    try {
      errorData =
        (await response.json()) as FastApiError;
    } catch {
      errorData = null;
    }

    throw new Error(
      getApiErrorMessage(errorData, response)
    );
  }

  return response.json() as Promise<T>;
}

function validateId(
  id: number,
  fieldName: string
): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      `Некорректный ${fieldName}`
    );
  }
}

export async function getPublishedHomeworks(): Promise<
  Homework[]
> {
  const query = new URLSearchParams({
    is_published: 'true',
    is_active: 'true',
    skip: '0',
    limit: '500',
  });

  const response =
    await request<HomeworkListResponse>(
      `/api/v1/homeworks?${query.toString()}`
    );

  return response.items;
}


export async function getGroupHomeworks(
  groupId: number
): Promise<Homework[]> {
  validateId(groupId, 'ID группы');

  const query = new URLSearchParams({
    group_id: String(groupId),
    is_published: 'true',
    is_active: 'true',
    skip: '0',
    limit: '500',
  });

  const response =
    await request<HomeworkListResponse>(
      `/api/v1/homeworks?${query.toString()}`
    );

  return response.items;
}


export async function getHomework(
  homeworkId: number
): Promise<Homework> {
  validateId(
    homeworkId,
    'ID домашнего задания'
  );

  return request<Homework>(
    `/api/v1/homeworks/${homeworkId}`
  );
}

export async function getHomeworkByLesson(
  lessonId: number
): Promise<Homework> {
  validateId(
    lessonId,
    'ID занятия'
  );

  return request<Homework>(
    `/api/v1/homeworks/lesson/${lessonId}`
  );
}

export async function getStudentSubmissions(
  studentId: number
): Promise<HomeworkSubmission[]> {
  validateId(
    studentId,
    'ID студента'
  );

  const response =
    await request<HomeworkSubmissionListResponse>(
      `/api/v1/homework-submissions/student/${studentId}`
    );

  return response.items;
}

export async function getVisibleHomeworkAttachments(
  homeworkId: number
): Promise<HomeworkAttachment[]> {
  validateId(
    homeworkId,
    'ID домашнего задания'
  );

  const response =
    await request<HomeworkAttachmentListResponse>(
      `/api/v1/homework-attachments/homework/${homeworkId}?is_visible=true`
    );

  return response.items.sort(
    (first, second) =>
      first.sort_order -
        second.sort_order ||
      first.id - second.id
  );
}

export interface CreateHomeworkSubmissionData {
  homework_id: number;
  student_id: number;
  answer_text: string | null;
}

export interface UpdateHomeworkSubmissionData {
  student_id: number;
  answer_text: string | null;
}

export async function createHomeworkSubmission(
  data: CreateHomeworkSubmissionData
): Promise<HomeworkSubmission> {
  validateId(
    data.homework_id,
    'ID домашнего задания'
  );

  validateId(
    data.student_id,
    'ID студента'
  );

  return request<HomeworkSubmission>(
    '/api/v1/homework-submissions',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateHomeworkSubmission(
  submissionId: number,
  data: UpdateHomeworkSubmissionData
): Promise<HomeworkSubmission> {
  validateId(
    submissionId,
    'ID домашней работы'
  );

  validateId(
    data.student_id,
    'ID студента'
  );

  return request<HomeworkSubmission>(
    `/api/v1/homework-submissions/${submissionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function submitHomeworkSubmission(
  submissionId: number,
  studentId: number
): Promise<HomeworkSubmission> {
  validateId(
    submissionId,
    'ID домашней работы'
  );

  validateId(
    studentId,
    'ID студента'
  );

  return request<HomeworkSubmission>(
    `/api/v1/homework-submissions/${submissionId}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
      }),
    }
  );
}

export interface GetHomeworkSubmissionsParams {
  homeworkId?: number;
  studentId?: number;
  groupId?: number;
  status?: HomeworkSubmissionStatus;
  isLate?: boolean;
  checkedBy?: number;
  skip?: number;
  limit?: number;
}

export interface StartHomeworkReviewData {
  checked_by: number;
}

export interface RequestHomeworkRevisionData {
  checked_by: number;
  teacher_comment: string;
}

export interface AcceptHomeworkSubmissionData {
  checked_by: number;
  score: number;
  teacher_comment: string;
}

export interface RejectHomeworkSubmissionData {
  checked_by: number;
  teacher_comment: string;
  score: number;
}

export async function getHomeworkSubmissions(
  params: GetHomeworkSubmissionsParams = {}
): Promise<HomeworkSubmissionListResponse> {
  const query = new URLSearchParams();

  if (params.homeworkId !== undefined) {
    validateId(
      params.homeworkId,
      'ID домашнего задания'
    );

    query.set(
      'homework_id',
      String(params.homeworkId)
    );
  }

  if (params.studentId !== undefined) {
    validateId(
      params.studentId,
      'ID студента'
    );

    query.set(
      'student_id',
      String(params.studentId)
    );
  }

  if (params.groupId !== undefined) {
    validateId(
      params.groupId,
      'ID группы'
    );

    query.set(
      'group_id',
      String(params.groupId)
    );
  }

  if (params.status) {
    query.set(
      'status',
      params.status
    );
  }

  if (params.isLate !== undefined) {
    query.set(
      'is_late',
      String(params.isLate)
    );
  }

  if (params.checkedBy !== undefined) {
    validateId(
      params.checkedBy,
      'ID преподавателя'
    );

    query.set(
      'checked_by',
      String(params.checkedBy)
    );
  }

  query.set(
    'skip',
    String(params.skip ?? 0)
  );

  query.set(
    'limit',
    String(params.limit ?? 100)
  );

  return request<HomeworkSubmissionListResponse>(
    `/api/v1/homework-submissions?${query.toString()}`
  );
}

export async function getHomeworkSubmission(
  submissionId: number
): Promise<HomeworkSubmission> {
  validateId(
    submissionId,
    'ID домашней работы'
  );

  return request<HomeworkSubmission>(
    `/api/v1/homework-submissions/${submissionId}`
  );
}

export async function startHomeworkReview(
  submissionId: number,
  checkedBy: number
): Promise<HomeworkSubmission> {
  validateId(
    submissionId,
    'ID домашней работы'
  );

  validateId(
    checkedBy,
    'ID преподавателя'
  );

  return request<HomeworkSubmission>(
    `/api/v1/homework-submissions/${submissionId}/start-review`,
    {
      method: 'POST',
      body: JSON.stringify({
        checked_by: checkedBy,
      }),
    }
  );
}

export async function requestHomeworkRevision(
  submissionId: number,
  data: RequestHomeworkRevisionData
): Promise<HomeworkSubmission> {
  validateId(
    submissionId,
    'ID домашней работы'
  );

  validateId(
    data.checked_by,
    'ID преподавателя'
  );

  if (!data.teacher_comment.trim()) {
    throw new Error(
      'Укажите комментарий для студента'
    );
  }

  return request<HomeworkSubmission>(
    `/api/v1/homework-submissions/${submissionId}/request-revision`,
    {
      method: 'POST',
      body: JSON.stringify({
        checked_by: data.checked_by,
        teacher_comment:
          data.teacher_comment.trim(),
      }),
    }
  );
}

export async function acceptHomeworkSubmission(
  submissionId: number,
  data: AcceptHomeworkSubmissionData
): Promise<HomeworkSubmission> {
  validateId(
    submissionId,
    'ID домашней работы'
  );

  validateId(
    data.checked_by,
    'ID преподавателя'
  );

  if (
    !Number.isFinite(data.score) ||
    data.score < 0
  ) {
    throw new Error(
      'Некорректный балл'
    );
  }

  return request<HomeworkSubmission>(
    `/api/v1/homework-submissions/${submissionId}/accept`,
    {
      method: 'POST',
      body: JSON.stringify({
        checked_by: data.checked_by,
        score: data.score,
        teacher_comment:
          data.teacher_comment.trim(),
      }),
    }
  );
}

export async function rejectHomeworkSubmission(
  submissionId: number,
  data: RejectHomeworkSubmissionData
): Promise<HomeworkSubmission> {
  validateId(
    submissionId,
    'ID домашней работы'
  );

  validateId(
    data.checked_by,
    'ID преподавателя'
  );

  if (!data.teacher_comment.trim()) {
    throw new Error(
      'Укажите причину отклонения'
    );
  }

  if (
    !Number.isFinite(data.score) ||
    data.score < 0
  ) {
    throw new Error(
      'Некорректный балл'
    );
  }

  return request<HomeworkSubmission>(
    `/api/v1/homework-submissions/${submissionId}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({
        checked_by: data.checked_by,
        teacher_comment:
          data.teacher_comment.trim(),
        score: data.score,
      }),
    }
  );
}