import {
  Archive,
  Bell,
  CalendarDays,
  Eye,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  RotateCcw,
  Send,
  UserRound,
} from 'lucide-react';
import {
  useState,
} from 'react';

import type {
  NewsPostMedia,
} from '../../../../api/newsApi';
import {
  getNewsAuthorName,
  type AdminNewsItem,
} from '../../../../services/adminNewsService';

interface AdminNewsFeedCardProps {
  item: AdminNewsItem;
  activeAction: string | null;
  onEdit: (item: AdminNewsItem) => void;
  onPublish: (item: AdminNewsItem) => void;
  onUnpublish: (item: AdminNewsItem) => void;
  onTogglePin: (item: AdminNewsItem) => void;
  onToggleActive: (item: AdminNewsItem) => void;
  onArchive: (item: AdminNewsItem) => void;
  onRestore: (item: AdminNewsItem) => void;
}

const TYPE_LABELS: Record<
  AdminNewsItem['post']['post_type'],
  string
> = {
  post: 'Новость',
  important: 'Важное',
  event: 'Мероприятие',
  achievement: 'Достижение',
  article: 'Статья',
};

const STATUS_LABELS: Record<
  AdminNewsItem['post']['status'],
  string
> = {
  draft: 'Черновик',
  published: 'Опубликована',
  archived: 'В архиве',
};

function formatDate(
  value: string | null
): string {
  if (!value) {
    return 'Не опубликована';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function statusClassName(
  status: AdminNewsItem['post']['status']
): string {
  switch (status) {
    case 'published':
      return 'bg-green-50 text-green-700';
    case 'archived':
      return 'bg-gray-100 text-gray-600';
    case 'draft':
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

function renderMedia(media: NewsPostMedia) {
  if (media.media_type === 'image') {
    return (
      <img
        src={media.file_url}
        alt={media.alt_text ?? ''}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }

  if (media.media_type === 'video') {
    return (
      <video
        src={media.file_url}
        poster={media.preview_url ?? undefined}
        controls
        preload="metadata"
        className="h-full w-full bg-gray-950 object-cover"
      />
    );
  }

  return (
    <a
      href={media.file_url}
      target="_blank"
      rel="noreferrer"
      className="flex h-full min-h-32 items-center justify-center bg-gray-100 px-4 text-center text-sm font-medium text-red-600 hover:underline"
    >
      {media.file_name ??
        media.alt_text ??
        'Открыть вложение'}
    </a>
  );
}

export default function AdminNewsFeedCard({
  item,
  activeAction,
  onEdit,
  onPublish,
  onUnpublish,
  onTogglePin,
  onToggleActive,
  onArchive,
  onRestore,
}: AdminNewsFeedCardProps) {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);
  const { post, media, author } = item;
  const actionInProgress =
    activeAction?.endsWith(
      `:${post.id}`
    ) ?? false;

  const coverMedia =
    media.find(
      (entry) =>
        entry.file_url ===
        post.cover_media_url
    ) ?? media[0];

  const additionalMedia = coverMedia
    ? media.filter(
        (entry) => entry.id !== coverMedia.id
      )
    : media;

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        post.is_pinned
          ? 'border-red-200'
          : 'border-gray-200'
      } ${!post.is_active ? 'opacity-70' : ''}`}
    >
      {coverMedia && (
        <div className="aspect-[16/7] max-h-96 overflow-hidden bg-gray-100">
          {renderMedia(coverMedia)}
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusClassName(post.status)}`}
              >
                {STATUS_LABELS[post.status]}
              </span>

              <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                {TYPE_LABELS[post.post_type]}
              </span>

              {post.category && (
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {post.category}
                </span>
              )}

              {post.is_pinned && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <Pin className="h-3 w-3" />
                  Закреплена
                </span>
              )}

              {!post.is_active && (
                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  Отключена
                </span>
              )}
            </div>

            <h2 className="mt-3 text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
              {post.title}
            </h2>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() =>
                setIsMenuOpen(
                  (current) => !current
                )
              }
              disabled={actionInProgress}
              aria-label="Действия с новостью"
              aria-expanded={isMenuOpen}
              className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                {post.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(item);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-4 w-4" />
                    Редактировать
                  </button>
                )}

                {post.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onPublish(item);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-green-700 hover:bg-green-50"
                  >
                    <Send className="h-4 w-4" />
                    Опубликовать
                  </button>
                )}

                {post.status === 'published' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onUnpublish(item);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-amber-700 hover:bg-amber-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Снять с публикации
                  </button>
                )}

                {post.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onTogglePin(item);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {post.is_pinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                    {post.is_pinned
                      ? 'Открепить'
                      : 'Закрепить'}
                  </button>
                )}

                {post.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onToggleActive(item);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    {post.is_active
                      ? 'Отключить'
                      : 'Включить'}
                  </button>
                )}

                {post.status === 'archived' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRestore(item);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-blue-700 hover:bg-blue-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Восстановить
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onArchive(item);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    <Archive className="h-4 w-4" />
                    В архив
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {post.summary && (
          <p className="mt-4 text-base leading-7 text-gray-600">
            {post.summary}
          </p>
        )}

        {post.content && (
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {post.content}
          </div>
        )}

        {additionalMedia.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {additionalMedia.map((entry) => (
              <div
                key={entry.id}
                className="min-h-36 overflow-hidden rounded-xl border border-gray-100"
              >
                {renderMedia(entry)}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />
              {getNewsAuthorName(author)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(
                post.published_at ??
                  post.created_at
              )}
            </span>

            {post.send_notification && (
              <span className="inline-flex items-center gap-1.5 text-red-600">
                <Bell className="h-3.5 w-3.5" />
                С уведомлением
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {post.views_count}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.comments_count}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
