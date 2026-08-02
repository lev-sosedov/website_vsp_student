import { authorizedFetch } from './authorizedClient';
const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export type PostType =
  | 'post'
  | 'important'
  | 'event'
  | 'achievement'
  | 'article';

export type PostStatus =
  | 'draft'
  | 'published'
  | 'archived';

export type PostMediaType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'link';

export interface NewsPost {
  id: number;
  post_type: PostType;
  status: PostStatus;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  cover_media_url: string | null;
  cover_media_type: string | null;
  cover_preview_url: string | null;
  cover_width: number | null;
  cover_height: number | null;
  created_by: number;
  updated_by: number | null;
  published_by: number | null;
  is_pinned: boolean;
  is_active: boolean;
  allow_comments: boolean;
  send_notification: boolean;
  views_count: number;
  comments_count: number;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsPostListResponse {
  total: number;
  items: NewsPost[];
}

export interface NewsPostMedia {
  id: number;
  post_id: number;
  media_type: PostMediaType;
  file_url: string;
  preview_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  alt_text: string | null;
  sort_order: number;
  uploaded_by: number;
  created_at: string;
}

export interface NewsPostMediaListResponse {
  total: number;
  items: NewsPostMedia[];
}

export interface GetNewsPostsParams {
  postType?: PostType;
  status?: PostStatus;
  category?: string;
  createdBy?: number;
  isPinned?: boolean;
  isActive?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface CreateNewsPostData {
  post_type: PostType;
  title: string;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  cover_media_url?: string | null;
  cover_media_type?: string | null;
  cover_preview_url?: string | null;
  cover_width?: number | null;
  cover_height?: number | null;
  allow_comments: boolean;
  send_notification: boolean;
  expires_at?: string | null;
  created_by: number;
}

export interface UpdateNewsPostData {
  post_type?: PostType;
  title?: string;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  cover_media_url?: string | null;
  cover_media_type?: string | null;
  cover_preview_url?: string | null;
  cover_width?: number | null;
  cover_height?: number | null;
  allow_comments?: boolean;
  send_notification?: boolean;
  expires_at?: string | null;
  updated_by: number;
}

export interface CreateNewsPostMediaData {
  post_id: number;
  media_type: PostMediaType;
  file_url: string;
  preview_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  alt_text?: string | null;
  sort_order: number;
  uploaded_by: number;
}

export interface UpdateNewsPostMediaData {
  preview_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  alt_text?: string | null;
  sort_order?: number;
  updated_by: number;
}

interface FastApiValidationError {
  msg?: string;
}

interface FastApiErrorResponse {
  detail?: string | FastApiValidationError[];
  message?: string;
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data =
      (await response.json()) as FastApiErrorResponse;

    if (typeof data.detail === 'string') {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
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

    return (
      data.message ??
      `Ошибка News Service: ${response.status}`
    );
  } catch {
    return `Ошибка News Service: ${response.status}`;
  }
}

async function newsRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await authorizedFetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function appendQueryValue(
  query: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined
): void {
  if (
    value === undefined ||
    value === ''
  ) {
    return;
  }

  query.set(key, String(value));
}

export async function getNewsPosts(
  params: GetNewsPostsParams = {}
): Promise<NewsPostListResponse> {
  const query = new URLSearchParams();

  appendQueryValue(
    query,
    'post_type',
    params.postType
  );
  appendQueryValue(
    query,
    'status',
    params.status
  );
  appendQueryValue(
    query,
    'category',
    params.category
  );
  appendQueryValue(
    query,
    'created_by',
    params.createdBy
  );
  appendQueryValue(
    query,
    'is_pinned',
    params.isPinned
  );
  appendQueryValue(
    query,
    'is_active',
    params.isActive
  );
  appendQueryValue(
    query,
    'search',
    params.search
  );
  appendQueryValue(
    query,
    'skip',
    params.skip ?? 0
  );
  appendQueryValue(
    query,
    'limit',
    params.limit ?? 500
  );

  return newsRequest<NewsPostListResponse>(
    `/api/v1/posts?${query.toString()}`
  );
}

export async function createNewsPost(
  data: CreateNewsPostData
): Promise<NewsPost> {
  return newsRequest<NewsPost>(
    '/api/v1/posts',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateNewsPost(
  postId: number,
  data: UpdateNewsPostData
): Promise<NewsPost> {
  return newsRequest<NewsPost>(
    `/api/v1/posts/${postId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

async function postAction(
  postId: number,
  action: string,
  userId: number
): Promise<NewsPost> {
  return newsRequest<NewsPost>(
    `/api/v1/posts/${postId}/${action}`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
      }),
    }
  );
}

export async function publishNewsPost(
  postId: number,
  userId: number,
  sendNotification: boolean
): Promise<NewsPost> {
  return newsRequest<NewsPost>(
    `/api/v1/posts/${postId}/publish`,
    {
      method: 'POST',
      body: JSON.stringify({
        published_by: userId,
        send_notification: sendNotification,
      }),
    }
  );
}

export const unpublishNewsPost = (
  postId: number,
  userId: number
) => postAction(postId, 'unpublish', userId);

export const pinNewsPost = (
  postId: number,
  userId: number
) => postAction(postId, 'pin', userId);

export const unpinNewsPost = (
  postId: number,
  userId: number
) => postAction(postId, 'unpin', userId);

export const archiveNewsPost = (
  postId: number,
  userId: number
) => postAction(postId, 'archive', userId);

export const restoreNewsPost = (
  postId: number,
  userId: number
) => postAction(postId, 'restore', userId);

export const deactivateNewsPost = (
  postId: number,
  userId: number
) => postAction(postId, 'deactivate', userId);

export const activateNewsPost = (
  postId: number,
  userId: number
) => postAction(postId, 'activate', userId);

export async function getNewsPostMedia(
  postId: number
): Promise<NewsPostMediaListResponse> {
  return newsRequest<NewsPostMediaListResponse>(
    `/api/v1/post-media/post/${postId}?limit=500`
  );
}

export async function createNewsPostMedia(
  data: CreateNewsPostMediaData
): Promise<NewsPostMedia> {
  return newsRequest<NewsPostMedia>(
    '/api/v1/post-media',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateNewsPostMedia(
  mediaId: number,
  data: UpdateNewsPostMediaData
): Promise<NewsPostMedia> {
  return newsRequest<NewsPostMedia>(
    `/api/v1/post-media/${mediaId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteNewsPostMedia(
  mediaId: number,
  userId: number
): Promise<{
  media_id: number;
  post_id: number;
  deleted: boolean;
}> {
  return newsRequest(
    `/api/v1/post-media/${mediaId}`,
    {
      method: 'DELETE',
      body: JSON.stringify({
        user_id: userId,
      }),
    }
  );
}

export async function setNewsPostCover(
  mediaId: number,
  userId: number
): Promise<NewsPost> {
  return newsRequest<NewsPost>(
    `/api/v1/post-media/${mediaId}/set-cover`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
      }),
    }
  );
}
