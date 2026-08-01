import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  ImageOff,
  Loader2,
  Newspaper,
  RefreshCw,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  getCloudinaryVideoPosterUrl,
} from '../../api/cloudinaryApi';

import {
  formatNewsDate,
  getNewsCategory,
  getNewsImage,
  getPublicNewsBySlug,
  getPublicNewsMedia,
  type PublicNewsMedia,
  type PublicNewsPost,
} from '../../api/publicNewsApi';

const URL_PATTERN =
  /(?:https?:\/\/|www\.)[^\s<>"']+/gi;

const TRAILING_URL_PUNCTUATION =
  /[.,!?;:)\]}»]+$/;

function renderTextWithLinks(
  text: string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  URL_PATTERN.lastIndex = 0;

  while (
    (match = URL_PATTERN.exec(text)) !== null
  ) {
    if (match.index > lastIndex) {
      nodes.push(
        text.slice(lastIndex, match.index)
      );
    }

    const matchedValue = match[0];
    const punctuationMatch =
      matchedValue.match(
        TRAILING_URL_PUNCTUATION
      );
    const trailingPunctuation =
      punctuationMatch?.[0] ?? '';

    const visibleUrl = trailingPunctuation
      ? matchedValue.slice(
          0,
          -trailingPunctuation.length
        )
      : matchedValue;

    if (!visibleUrl) {
      nodes.push(matchedValue);
      lastIndex =
        match.index + matchedValue.length;
      continue;
    }

    const href = visibleUrl.startsWith('www.')
      ? `https://${visibleUrl}`
      : visibleUrl;

    nodes.push(
      <a
        key={`news-link-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-medium text-red-600 underline decoration-red-200 underline-offset-4 transition hover:text-red-700 hover:decoration-red-600"
      >
        {visibleUrl}
      </a>
    );

    if (trailingPunctuation) {
      nodes.push(trailingPunctuation);
    }

    lastIndex =
      match.index + matchedValue.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function formatFileSize(
  value: number | null
): string {
  if (
    value === null ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return '';
  }

  if (value < 1024) {
    return `${value} Б`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} КБ`;
  }

  return `${(
    value /
    (1024 * 1024)
  ).toFixed(1)} МБ`;
}

function NewsMedia({
  media,
}: {
  media: PublicNewsMedia;
}) {
  if (media.media_type === 'image') {
    return (
      <figure className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
        <img
          src={media.file_url}
          alt={media.alt_text ?? media.file_name ?? ''}
          loading="lazy"
          className="max-h-[720px] w-full object-contain"
        />
        {media.alt_text && (
          <figcaption className="px-4 py-3 text-sm text-gray-500">
            {media.alt_text}
          </figcaption>
        )}
      </figure>
    );
  }

  if (media.media_type === 'video') {
    const posterUrl =
      media.preview_url ??
      getCloudinaryVideoPosterUrl(
        media.file_url
      );

    return (
      <video
        src={media.file_url}
        poster={posterUrl ?? undefined}
        controls
        preload="metadata"
        className="max-h-[720px] w-full rounded-2xl bg-gray-950"
      />
    );
  }

  if (media.media_type === 'audio') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <p className="mb-3 font-semibold text-gray-900">
          {media.file_name ?? 'Аудиозапись'}
        </p>
        <audio
          src={media.file_url}
          controls
          className="w-full"
        />
      </div>
    );
  }

  const fileSize = formatFileSize(
    media.file_size
  );

  return (
    <a
      href={media.file_url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-red-200 hover:bg-red-50/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">
            {media.file_name ??
              media.alt_text ??
              'Открыть вложение'}
          </p>
          {fileSize && (
            <p className="mt-1 text-xs text-gray-500">
              {fileSize}
            </p>
          )}
        </div>
      </div>
      {media.media_type === 'document' ? (
        <Download className="h-5 w-5 shrink-0 text-red-600" />
      ) : (
        <ExternalLink className="h-5 w-5 shrink-0 text-red-600" />
      )}
    </a>
  );
}

export default function NewsDetail() {
  const { slug = '' } = useParams();

  const [post, setPost] =
    useState<PublicNewsPost | null>(null);
  const [media, setMedia] =
    useState<PublicNewsMedia[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const loadPost = useCallback(async () => {
    if (!slug) {
      setError('Адрес новости не указан');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const loadedPost =
        await getPublicNewsBySlug(slug);

      const loadedMedia =
        await getPublicNewsMedia(
          loadedPost.id
        ).catch(() => []);

      setPost(loadedPost);
      setMedia(loadedMedia);
    } catch (requestError) {
      setPost(null);
      setMedia([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось загрузить новость'
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  const primaryVideo = useMemo(
    () =>
      media.find(
        (item) =>
          item.media_type === 'video'
      ) ?? null,
    [media]
  );

  const additionalMedia = useMemo(() => {
    if (!post) {
      return [];
    }

    const coverUrl =
      post.cover_media_url?.trim();

    return media.filter((item) => {
      if (
        primaryVideo &&
        item.id === primaryVideo.id
      ) {
        return false;
      }

      if (
        coverUrl &&
        item.file_url === coverUrl
      ) {
        return false;
      }

      return true;
    });
  }, [media, post, primaryVideo]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-24">
        <Loader2 className="h-9 w-9 animate-spin text-red-600" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <section className="min-h-[70vh] bg-gray-50 px-4 pb-20 pt-36">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-11 w-11 text-red-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Новость не найдена
          </h1>
          <p className="mt-3 text-gray-500">
            {error ?? 'Публикация недоступна'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              К новостям
            </Link>
            <button
              type="button"
              onClick={() => void loadPost()}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </button>
          </div>
        </div>
      </section>
    );
  }

  const coverUrl = getNewsImage(post);
  const primaryVideoPoster =
    primaryVideo
      ? primaryVideo.preview_url ??
        getCloudinaryVideoPosterUrl(
          primaryVideo.file_url
        )
      : null;

  return (
    <article className="bg-gray-50 pb-20 pt-28 sm:pt-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-red-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Все новости
        </Link>

        <header className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-600">
              {getNewsCategory(post)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-500">
              <CalendarDays className="h-4 w-4" />
              {formatNewsDate(post)}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-tight text-gray-950 sm:text-5xl">
            {post.title}
          </h1>

          {post.summary && (
            <p className="mt-5 whitespace-pre-line break-words text-lg leading-8 text-gray-600">
              {renderTextWithLinks(post.summary)}
            </p>
          )}
        </header>

        {primaryVideo ? (
          <div className="mt-6 overflow-hidden rounded-3xl bg-white p-3 shadow-sm sm:p-5">
            <video
              src={primaryVideo.file_url}
              poster={
                primaryVideoPoster ?? undefined
              }
              controls
              preload="metadata"
              className="max-h-[820px] w-full rounded-2xl bg-gray-950"
            />
          </div>
        ) : coverUrl ? (
          <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
            <img
              src={coverUrl}
              alt={post.title}
              className="max-h-[760px] w-full object-contain"
            />
          </div>
        ) : (
          <div className="mt-6 flex min-h-64 items-center justify-center rounded-3xl bg-white shadow-sm">
            <div className="text-center text-gray-400">
              <ImageOff className="mx-auto h-11 w-11" />
              <p className="mt-3 text-sm">
                Медиа не добавлено
              </p>
            </div>
          </div>
        )}

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          {post.content?.trim() ? (
            <div className="whitespace-pre-line break-words text-base leading-8 text-gray-700 sm:text-lg">
              {renderTextWithLinks(
                post.content ?? ''
              )}
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center text-center text-gray-400">
              <Newspaper className="h-10 w-10" />
              <p className="mt-3">
                Текст новости пока не добавлен
              </p>
            </div>
          )}
        </section>

        {additionalMedia.length > 0 && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900">
              Фото, видео и файлы
            </h2>
            <div className="mt-6 space-y-5">
              {additionalMedia.map((item) => (
                <NewsMedia
                  key={item.id}
                  media={item}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
