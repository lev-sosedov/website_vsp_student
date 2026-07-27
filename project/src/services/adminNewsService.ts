import {
  getNewsPostMedia,
  getNewsPosts,
  type NewsPost,
  type NewsPostMedia,
} from '../api/newsApi';
import {
  getUsersByIds,
  type UserProfile,
} from '../api/userApi';

export interface AdminNewsItem {
  post: NewsPost;
  media: NewsPostMedia[];
  author: UserProfile | null;
}

export interface AdminNewsData {
  items: AdminNewsItem[];
  total: number;
}

export const EMPTY_ADMIN_NEWS_DATA: AdminNewsData = {
  items: [],
  total: 0,
};

function postTimestamp(post: NewsPost): number {
  return new Date(
    post.published_at ??
      post.updated_at ??
      post.created_at
  ).getTime();
}

export async function loadAdminNews(): Promise<AdminNewsData> {
  const response = await getNewsPosts({
    limit: 500,
  });

  const authorIds = Array.from(
    new Set(
      response.items.map(
        (post) => post.created_by
      )
    )
  );

  const authors =
    authorIds.length > 0
      ? await getUsersByIds(authorIds)
      : [];

  const items = await Promise.all(
    response.items.map(
      async (post): Promise<AdminNewsItem> => {
        try {
          const media =
            await getNewsPostMedia(post.id);

          return {
            post,
            media: media.items.sort(
              (first, second) =>
                first.sort_order -
                second.sort_order
            ),
            author:
              authors[post.created_by] ??
              null,
          };
        } catch {
          return {
            post,
            media: [],
            author:
              authors[post.created_by] ??
              null,
          };
        }
      }
    )
  );

  items.sort((first, second) => {
    if (
      first.post.is_pinned !==
      second.post.is_pinned
    ) {
      return first.post.is_pinned ? -1 : 1;
    }

    return (
      postTimestamp(second.post) -
      postTimestamp(first.post)
    );
  });

  return {
    items,
    total: response.total,
  };
}

export function getNewsAuthorName(
  author: UserProfile | null
): string {
  if (!author) {
    return 'Администрация школы';
  }

  return (
    [
      author.user_name,
      author.first_name,
      author.last_name,
    ]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ') ||
    'Администрация школы'
  );
}
