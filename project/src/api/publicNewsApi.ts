import {
  getCloudinaryVideoPosterUrl,
} from './cloudinaryApi';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export type PublicNewsPost = {
  id: number;
  post_type:
    | 'post'
    | 'important'
    | 'event'
    | 'achievement'
    | 'article'
    | string;
  status: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  cover_media_url: string | null;
  cover_media_type?: string | null;
  cover_preview_url: string | null;
  is_pinned: boolean;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};


export type PublicNewsMedia = {
  id: number;
  post_id: number;
  media_type:
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'link'
    | string;
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
  created_at: string;
};

type NewsMediaListResponse = {
  total: number;
  items: PublicNewsMedia[];
};

type NewsListResponse = {
  total: number;
  items: PublicNewsPost[];
};

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string;
      message?: string;
    };

    return (
      data.detail ??
      data.message ??
      `Не удалось загрузить новости: ${response.status}`
    );
  } catch {
    const text = await response.text();

    return (
      text ||
      `Не удалось загрузить новости: ${response.status}`
    );
  }
}

export async function getPublicNews(
  limit = 500
): Promise<PublicNewsPost[]> {
  const searchParams =
    new URLSearchParams();

  searchParams.set(
    'status',
    'published'
  );

  searchParams.set(
    'is_active',
    'true'
  );

  searchParams.set(
    'skip',
    '0'
  );

  searchParams.set(
    'limit',
    String(limit)
  );

  const response = await fetch(
    `${API_URL}/api/v1/posts?${searchParams.toString()}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data =
    (await response.json()) as
      | NewsListResponse
      | PublicNewsPost[];

  if (Array.isArray(data)) {
    return data;
  }

  return data.items ?? [];
}


export async function getPublicNewsBySlug(
  slug: string
): Promise<PublicNewsPost> {
  const response = await fetch(
    `${API_URL}/api/v1/posts/slug/${encodeURIComponent(slug)}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const post =
    (await response.json()) as PublicNewsPost;

  if (
    post.status !== 'published' ||
    !post.is_active
  ) {
    throw new Error(
      'Новость недоступна для просмотра'
    );
  }

  return post;
}

export async function getPublicNewsMedia(
  postId: number
): Promise<PublicNewsMedia[]> {
  const response = await fetch(
    `${API_URL}/api/v1/post-media/post/${postId}?skip=0&limit=500`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data =
    (await response.json()) as
      | NewsMediaListResponse
      | PublicNewsMedia[];

  const items = Array.isArray(data)
    ? data
    : data.items ?? [];

  return [...items].sort(
    (first, second) =>
      first.sort_order - second.sort_order ||
      first.id - second.id
  );
}

export function getNewsCategory(
  post: PublicNewsPost
): string {
  const category =
    post.category?.trim();

  if (category) {
    return category;
  }

  const labels: Record<string, string> = {
    post: 'Новости школы',
    important: 'Важное',
    event: 'События',
    achievement: 'Достижения',
    article: 'Статьи',
  };

  return (
    labels[post.post_type] ??
    'Новости школы'
  );
}

export function getNewsImage(
  post: PublicNewsPost
): string | null {
  const previewUrl =
    post.cover_preview_url?.trim();

  if (previewUrl) {
    return previewUrl;
  }

  const coverUrl =
    post.cover_media_url?.trim();

  if (!coverUrl) {
    return null;
  }

  const isVideoCover =
    post.cover_media_type === 'video' ||
    coverUrl.includes('/video/upload/');

  if (isVideoCover) {
    return getCloudinaryVideoPosterUrl(
      coverUrl
    );
  }

  return coverUrl;
}

export function getNewsExcerpt(
  post: PublicNewsPost
): string {
  const summary =
    post.summary?.trim();

  if (summary) {
    return summary;
  }

  const content =
    post.content
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() ?? '';

  if (!content) {
    return 'Подробности новости скоро появятся.';
  }

  return content.length > 220
    ? `${content.slice(0, 217).trim()}...`
    : content;
}

export function formatNewsDate(
  post: PublicNewsPost
): string {
  const value =
    post.published_at ??
    post.created_at;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  )
    .format(date)
    .replace(/\s*г\.$/, '');
}
