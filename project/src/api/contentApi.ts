const API_URL = import.meta.env.VITE_API_URL;

export type AttachmentType = string;

export interface LessonContent {
  id: number;
  lesson_id: number;

  title: string;
  summary: string | null;
  content: string | null;

  is_published: boolean;

  created_by: number;
  updated_by: number | null;

  created_at: string;
  updated_at: string;
}

export interface LessonContentListResponse {
  total: number;
  items: LessonContent[];
}

export interface LessonAttachment {
  id: number;
  lesson_content_id: number;

  title: string;
  attachment_type: AttachmentType;

  file_url: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;

  sort_order: number;
  is_visible: boolean;

  uploaded_by: number;
  created_at: string;
}

export interface LessonAttachmentListResponse {
  total: number;
  items: LessonAttachment[];
}

export interface LessonLink {
  id: number;
  lesson_content_id: number;

  title: string;
  url: string;
  description: string | null;

  sort_order: number;
  is_visible: boolean;

  added_by: number;

  created_at: string;
  updated_at: string;
}

export interface LessonLinkListResponse {
  total: number;
  items: LessonLink[];
}

export interface GetLessonContentsParams {
  lessonId?: number;
  createdBy?: number;
  isPublished?: boolean;
  skip?: number;
  limit?: number;
}

export interface GetLessonAttachmentsParams {
  lessonContentId?: number;
  isVisible?: boolean;
  uploadedBy?: number;
  skip?: number;
  limit?: number;
}

export interface GetLessonLinksParams {
  lessonContentId?: number;
  isVisible?: boolean;
  addedBy?: number;
  skip?: number;
  limit?: number;
}

export interface CreateLessonContentData {
  lesson_id: number;
  title: string;
  summary: string | null;
  content: string | null;
  created_by: number;
  is_published: boolean;
}

export interface UpdateLessonContentData {
  title?: string;
  summary?: string | null;
  content?: string | null;
  updated_by: number;
}

export interface CreateLessonAttachmentData {
  lesson_content_id: number;
  title: string;
  attachment_type: AttachmentType;
  file_url: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  sort_order: number;
  is_visible: boolean;
  uploaded_by: number;
}

export interface UpdateLessonAttachmentData {
  title?: string;
  attachment_type?: AttachmentType;
  file_url?: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  sort_order?: number;
  updated_by: number;
}

export interface CreateLessonLinkData {
  lesson_content_id: number;
  title: string;
  url: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  added_by: number;
}

export interface UpdateLessonLinkData {
  title?: string;
  url?: string;
  description?: string | null;
  sort_order?: number;
  updated_by: number;
}

interface DeleteResponse {
  deleted: boolean;
}

interface FastApiValidationError {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
}

interface FastApiErrorResponse {
  detail?: string | FastApiValidationError[];
}

function getAccessToken(): string | null {
  return (
    localStorage.getItem(
      'vshp_access_token'
    ) ??
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
      .map((error) => error.msg)
      .filter(
        (message): message is string =>
          Boolean(message)
      );

    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  return (
    `Ошибка Content API: ` +
    `${response.status} ${response.statusText}`
  );
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
    let errorData: FastApiErrorResponse | null =
      null;

    try {
      errorData =
        (await response.json()) as FastApiErrorResponse;
    } catch {
      errorData = null;
    }

    throw new Error(
      getErrorMessage(errorData, response)
    );
  }

  return response.json() as Promise<T>;
}

function validatePositiveId(
  id: number,
  fieldName: string
): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      `Некорректный ${fieldName}`
    );
  }
}

function addOptionalNumber(
  searchParams: URLSearchParams,
  name: string,
  value: number | undefined
): void {
  if (value !== undefined) {
    searchParams.set(name, String(value));
  }
}

function addOptionalBoolean(
  searchParams: URLSearchParams,
  name: string,
  value: boolean | undefined
): void {
  if (value !== undefined) {
    searchParams.set(name, String(value));
  }
}

function createQueryString(
  searchParams: URLSearchParams
): string {
  const query = searchParams.toString();

  return query ? `?${query}` : '';
}

/* =====================================================
   Основные материалы занятий
===================================================== */

function buildLessonContentsQuery(
  params: GetLessonContentsParams
): string {
  const searchParams = new URLSearchParams();

  addOptionalNumber(
    searchParams,
    'lesson_id',
    params.lessonId
  );

  addOptionalNumber(
    searchParams,
    'created_by',
    params.createdBy
  );

  addOptionalBoolean(
    searchParams,
    'is_published',
    params.isPublished
  );

  addOptionalNumber(
    searchParams,
    'skip',
    params.skip
  );

  addOptionalNumber(
    searchParams,
    'limit',
    params.limit
  );

  return createQueryString(searchParams);
}

export async function getLessonContentsResponse(
  params: GetLessonContentsParams = {}
): Promise<LessonContentListResponse> {
  const query = buildLessonContentsQuery(params);

  return request<LessonContentListResponse>(
    `/api/v1/lesson-contents${query}`
  );
}

export async function getLessonContents(
  params: GetLessonContentsParams = {}
): Promise<LessonContent[]> {
  const response =
    await getLessonContentsResponse(params);

  return response.items;
}

export async function getPublishedLessonContents(): Promise<
  LessonContent[]
> {
  return getLessonContents({
    isPublished: true,
    skip: 0,
    limit: 500,
  });
}

export async function getLessonContent(
  contentId: number
): Promise<LessonContent> {
  validatePositiveId(
    contentId,
    'ID материала'
  );

  return request<LessonContent>(
    `/api/v1/lesson-contents/${contentId}`
  );
}

export async function getLessonContentByLesson(
  lessonId: number
): Promise<LessonContent> {
  validatePositiveId(
    lessonId,
    'ID занятия'
  );

  return request<LessonContent>(
    `/api/v1/lesson-contents/lesson/${lessonId}`
  );
}

export async function createLessonContent(
  data: CreateLessonContentData
): Promise<LessonContent> {
  return request<LessonContent>(
    '/api/v1/lesson-contents',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateLessonContent(
  contentId: number,
  data: UpdateLessonContentData
): Promise<LessonContent> {
  validatePositiveId(
    contentId,
    'ID материала'
  );

  return request<LessonContent>(
    `/api/v1/lesson-contents/${contentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function publishLessonContent(
  contentId: number,
  updatedBy: number
): Promise<LessonContent> {
  validatePositiveId(
    contentId,
    'ID материала'
  );

  return request<LessonContent>(
    `/api/v1/lesson-contents/${contentId}/publish`,
    {
      method: 'POST',
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    }
  );
}

export async function unpublishLessonContent(
  contentId: number,
  updatedBy: number
): Promise<LessonContent> {
  validatePositiveId(
    contentId,
    'ID материала'
  );

  return request<LessonContent>(
    `/api/v1/lesson-contents/${contentId}/unpublish`,
    {
      method: 'POST',
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    }
  );
}

/* =====================================================
   Файлы материалов
===================================================== */

function buildLessonAttachmentsQuery(
  params: GetLessonAttachmentsParams
): string {
  const searchParams = new URLSearchParams();

  addOptionalNumber(
    searchParams,
    'lesson_content_id',
    params.lessonContentId
  );

  addOptionalBoolean(
    searchParams,
    'is_visible',
    params.isVisible
  );

  addOptionalNumber(
    searchParams,
    'uploaded_by',
    params.uploadedBy
  );

  addOptionalNumber(
    searchParams,
    'skip',
    params.skip
  );

  addOptionalNumber(
    searchParams,
    'limit',
    params.limit
  );

  return createQueryString(searchParams);
}

export async function getLessonAttachmentsResponse(
  params: GetLessonAttachmentsParams = {}
): Promise<LessonAttachmentListResponse> {
  const query =
    buildLessonAttachmentsQuery(params);

  return request<LessonAttachmentListResponse>(
    `/api/v1/lesson-attachments${query}`
  );
}

export async function getLessonAttachments(
  params: GetLessonAttachmentsParams = {}
): Promise<LessonAttachment[]> {
  const response =
    await getLessonAttachmentsResponse(params);

  return response.items;
}

export async function getVisibleContentAttachments(
  lessonContentId: number
): Promise<LessonAttachment[]> {
  validatePositiveId(
    lessonContentId,
    'ID материала'
  );

  const response =
    await request<LessonAttachmentListResponse>(
      `/api/v1/lesson-attachments/content/` +
        `${lessonContentId}?is_visible=true`
    );

  return response.items.sort(
    (firstAttachment, secondAttachment) =>
      firstAttachment.sort_order -
        secondAttachment.sort_order ||
      firstAttachment.id -
        secondAttachment.id
  );
}

export async function createLessonAttachment(
  data: CreateLessonAttachmentData
): Promise<LessonAttachment> {
  return request<LessonAttachment>(
    '/api/v1/lesson-attachments',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateLessonAttachment(
  attachmentId: number,
  data: UpdateLessonAttachmentData
): Promise<LessonAttachment> {
  validatePositiveId(
    attachmentId,
    'ID вложения'
  );

  return request<LessonAttachment>(
    `/api/v1/lesson-attachments/${attachmentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function setLessonAttachmentVisibility(
  attachmentId: number,
  isVisible: boolean,
  updatedBy: number
): Promise<LessonAttachment> {
  validatePositiveId(
    attachmentId,
    'ID вложения'
  );

  const action = isVisible
    ? 'show'
    : 'hide';

  return request<LessonAttachment>(
    `/api/v1/lesson-attachments/${attachmentId}/${action}`,
    {
      method: 'POST',
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    }
  );
}

export async function deleteLessonAttachment(
  attachmentId: number,
  deletedBy: number
): Promise<void> {
  validatePositiveId(
    attachmentId,
    'ID вложения'
  );

  await request<DeleteResponse>(
    `/api/v1/lesson-attachments/${attachmentId}` +
      `?deleted_by=${deletedBy}`,
    {
      method: 'DELETE',
    }
  );
}

/* =====================================================
   Ссылки материалов
===================================================== */

function buildLessonLinksQuery(
  params: GetLessonLinksParams
): string {
  const searchParams = new URLSearchParams();

  addOptionalNumber(
    searchParams,
    'lesson_content_id',
    params.lessonContentId
  );

  addOptionalBoolean(
    searchParams,
    'is_visible',
    params.isVisible
  );

  addOptionalNumber(
    searchParams,
    'added_by',
    params.addedBy
  );

  addOptionalNumber(
    searchParams,
    'skip',
    params.skip
  );

  addOptionalNumber(
    searchParams,
    'limit',
    params.limit
  );

  return createQueryString(searchParams);
}

export async function getLessonLinksResponse(
  params: GetLessonLinksParams = {}
): Promise<LessonLinkListResponse> {
  const query = buildLessonLinksQuery(params);

  return request<LessonLinkListResponse>(
    `/api/v1/lesson-links${query}`
  );
}

export async function getLessonLinks(
  params: GetLessonLinksParams = {}
): Promise<LessonLink[]> {
  const response =
    await getLessonLinksResponse(params);

  return response.items;
}

export async function getVisibleContentLinks(
  lessonContentId: number
): Promise<LessonLink[]> {
  validatePositiveId(
    lessonContentId,
    'ID материала'
  );

  const response =
    await request<LessonLinkListResponse>(
      `/api/v1/lesson-links/content/` +
        `${lessonContentId}?is_visible=true`
    );

  return response.items.sort(
    (firstLink, secondLink) =>
      firstLink.sort_order -
        secondLink.sort_order ||
      firstLink.id - secondLink.id
  );
}

export async function createLessonLink(
  data: CreateLessonLinkData
): Promise<LessonLink> {
  return request<LessonLink>(
    '/api/v1/lesson-links',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateLessonLink(
  linkId: number,
  data: UpdateLessonLinkData
): Promise<LessonLink> {
  validatePositiveId(
    linkId,
    'ID ссылки'
  );

  return request<LessonLink>(
    `/api/v1/lesson-links/${linkId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function setLessonLinkVisibility(
  linkId: number,
  isVisible: boolean,
  updatedBy: number
): Promise<LessonLink> {
  validatePositiveId(
    linkId,
    'ID ссылки'
  );

  const action = isVisible
    ? 'show'
    : 'hide';

  return request<LessonLink>(
    `/api/v1/lesson-links/${linkId}/${action}`,
    {
      method: 'POST',
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    }
  );
}

export async function deleteLessonLink(
  linkId: number,
  deletedBy: number
): Promise<void> {
  validatePositiveId(
    linkId,
    'ID ссылки'
  );

  await request<DeleteResponse>(
    `/api/v1/lesson-links/${linkId}` +
      `?deleted_by=${deletedBy}`,
    {
      method: 'DELETE',
    }
  );
}

/* =====================================================
   Вспомогательные функции
===================================================== */

export function formatFileSize(
  fileSize: number | null
): string {
  if (
    fileSize === null ||
    fileSize < 0
  ) {
    return 'Размер не указан';
  }

  if (fileSize === 0) {
    return '0 Б';
  }

  const units = [
    'Б',
    'КБ',
    'МБ',
    'ГБ',
    'ТБ',
  ];

  const unitIndex = Math.min(
    Math.floor(
      Math.log(fileSize) / Math.log(1024)
    ),
    units.length - 1
  );

  const value =
    fileSize / 1024 ** unitIndex;

  const formattedValue =
    unitIndex === 0
      ? Math.round(value).toString()
      : value.toFixed(value >= 10 ? 1 : 2);

  return `${formattedValue} ${units[unitIndex]}`;
}

export function getAttachmentTypeLabel(
  attachment: LessonAttachment
): string {
  const mimeType =
    attachment.mime_type?.toLowerCase() ?? '';

  const fileName =
    attachment.file_name?.toLowerCase() ?? '';

  if (
    mimeType.includes('pdf') ||
    fileName.endsWith('.pdf')
  ) {
    return 'PDF';
  }

  if (
    mimeType.startsWith('video/') ||
    /\.(mp4|webm|mov|avi|mkv)$/i.test(
      fileName
    )
  ) {
    return 'Видео';
  }

  if (
    mimeType.includes('presentation') ||
    /\.(ppt|pptx|odp)$/i.test(fileName)
  ) {
    return 'Презентация';
  }

  if (
    mimeType.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(
      fileName
    )
  ) {
    return 'Изображение';
  }

  if (
    mimeType.includes('word') ||
    /\.(doc|docx|odt)$/i.test(fileName)
  ) {
    return 'Документ';
  }

  if (
    mimeType.includes('zip') ||
    /\.(zip|rar|7z)$/i.test(fileName)
  ) {
    return 'Архив';
  }

  return attachment.attachment_type || 'Файл';
}
