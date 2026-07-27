import {
  FileUp,
  Image,
  Loader2,
  Plus,
  Star,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import {
  uploadNewsMediaToCloudinary,
} from '../../../../api/cloudinaryApi';
import type {
  NewsPostMedia,
  PostMediaType,
  PostType,
} from '../../../../api/newsApi';
import type {
  AdminNewsItem,
} from '../../../../services/adminNewsService';

export interface AdminNewsMediaDraft {
  key: string;
  mediaType: PostMediaType;
  fileUrl: string;
  previewUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  altText: string | null;
}

export interface AdminNewsFormValues {
  postType: PostType;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  allowComments: boolean;
  sendNotification: boolean;
  expiresAt: string;
  newMedia: AdminNewsMediaDraft[];
  deletedMediaIds: number[];
  coverSelection: string;
}

interface AdminNewsEditorModalProps {
  isOpen: boolean;
  item: AdminNewsItem | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: AdminNewsFormValues
  ) => Promise<void>;
}

const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100';

const POST_TYPES: Array<{
  value: PostType;
  label: string;
}> = [
  { value: 'post', label: 'Обычная новость' },
  { value: 'important', label: 'Важное объявление' },
  { value: 'event', label: 'Мероприятие' },
  { value: 'achievement', label: 'Достижение' },
  { value: 'article', label: 'Статья' },
];

const MEDIA_TYPES: Array<{
  value: PostMediaType;
  label: string;
}> = [
  { value: 'image', label: 'Изображение' },
  { value: 'video', label: 'Видео' },
  { value: 'audio', label: 'Аудио' },
  { value: 'document', label: 'Документ' },
  { value: 'link', label: 'Ссылка' },
];

function toDateTimeInput(
  value: string | null
): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset =
    date.getTimezoneOffset() * 60_000;

  return new Date(
    date.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 16);
}

function draftKey(): string {
  return `${Date.now()}-${Math.random()}`;
}

function inferMediaType(
  file: File
): PostMediaType {
  if (file.type.startsWith('image/')) {
    return 'image';
  }

  if (file.type.startsWith('video/')) {
    return 'video';
  }

  if (file.type.startsWith('audio/')) {
    return 'audio';
  }

  return 'document';
}

function mediaPreview(
  media: {
    mediaType: PostMediaType;
    fileUrl: string;
    previewUrl?: string | null;
    altText?: string | null;
  }
) {
  if (media.mediaType === 'image') {
    return (
      <img
        src={media.fileUrl}
        alt={media.altText ?? ''}
        className="h-28 w-full rounded-xl object-cover"
      />
    );
  }

  if (media.mediaType === 'video') {
    return (
      <video
        src={media.fileUrl}
        poster={media.previewUrl ?? undefined}
        controls
        preload="metadata"
        className="h-28 w-full rounded-xl bg-gray-950 object-cover"
      />
    );
  }

  return (
    <div className="flex h-28 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
      <FileUp className="h-7 w-7" />
    </div>
  );
}

function existingMediaPreview(
  media: NewsPostMedia
) {
  return mediaPreview({
    mediaType: media.media_type,
    fileUrl: media.file_url,
    previewUrl: media.preview_url,
    altText: media.alt_text,
  });
}

export default function AdminNewsEditorModal({
  isOpen,
  item,
  isSaving,
  error,
  onClose,
  onSubmit,
}: AdminNewsEditorModalProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [postType, setPostType] =
    useState<PostType>('post');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [allowComments, setAllowComments] =
    useState(true);
  const [
    sendNotification,
    setSendNotification,
  ] = useState(false);
  const [expiresAt, setExpiresAt] =
    useState('');

  const [newMedia, setNewMedia] =
    useState<AdminNewsMediaDraft[]>([]);
  const [
    deletedMediaIds,
    setDeletedMediaIds,
  ] = useState<number[]>([]);
  const [
    coverSelection,
    setCoverSelection,
  ] = useState('');

  const [mediaType, setMediaType] =
    useState<PostMediaType>('image');
  const [mediaUrl, setMediaUrl] =
    useState('');
  const [previewUrl, setPreviewUrl] =
    useState('');
  const [altText, setAltText] =
    useState('');
  const [isUploading, setIsUploading] =
    useState(false);
  const [mediaError, setMediaError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setPostType(item?.post.post_type ?? 'post');
    setTitle(item?.post.title ?? '');
    setSlug(item?.post.slug ?? '');
    setSummary(item?.post.summary ?? '');
    setContent(item?.post.content ?? '');
    setCategory(item?.post.category ?? '');
    setAllowComments(
      item?.post.allow_comments ?? true
    );
    setSendNotification(
      item?.post.send_notification ?? false
    );
    setExpiresAt(
      toDateTimeInput(
        item?.post.expires_at ?? null
      )
    );
    setNewMedia([]);
    setDeletedMediaIds([]);

    const currentCover =
      item?.media.find(
        (media) =>
          media.file_url ===
          item.post.cover_media_url
      );

    setCoverSelection(
      currentCover
        ? `existing:${currentCover.id}`
        : ''
    );
    setMediaType('image');
    setMediaUrl('');
    setPreviewUrl('');
    setAltText('');
    setMediaError(null);
  }, [isOpen, item]);

  const visibleExistingMedia = useMemo(
    () =>
      (item?.media ?? []).filter(
        (media) =>
          !deletedMediaIds.includes(media.id)
      ),
    [deletedMediaIds, item?.media]
  );

  if (!isOpen) {
    return null;
  }

  const addUrlMedia = () => {
    const normalizedUrl = mediaUrl.trim();

    if (!normalizedUrl) {
      setMediaError(
        'Укажите ссылку на медиа'
      );
      return;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setMediaError(
        'Укажите корректную ссылку'
      );
      return;
    }

    const key = draftKey();

    setNewMedia((current) => [
      ...current,
      {
        key,
        mediaType,
        fileUrl: normalizedUrl,
        previewUrl:
          previewUrl.trim() || null,
        fileName: null,
        mimeType: null,
        fileSize: null,
        width: null,
        height: null,
        durationSeconds: null,
        altText: altText.trim() || null,
      },
    ]);

    if (
      !coverSelection &&
      (mediaType === 'image' ||
        mediaType === 'video')
    ) {
      setCoverSelection(`new:${key}`);
    }

    setMediaUrl('');
    setPreviewUrl('');
    setAltText('');
    setMediaError(null);
  };

  const uploadFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    setIsUploading(true);
    setMediaError(null);

    try {
      const result =
        await uploadNewsMediaToCloudinary(
          file
        );
      const key = draftKey();
      const detectedType =
        inferMediaType(file);

      setNewMedia((current) => [
        ...current,
        {
          key,
          mediaType: detectedType,
          fileUrl: result.secure_url,
          previewUrl: null,
          fileName:
            result.original_filename ??
            file.name,
          mimeType: file.type || null,
          fileSize:
            result.bytes ?? file.size,
          width: result.width ?? null,
          height: result.height ?? null,
          durationSeconds:
            result.duration !== undefined
              ? Math.round(result.duration)
              : null,
          altText:
            detectedType === 'image'
              ? file.name
              : null,
        },
      ]);

      if (
        !coverSelection &&
        (detectedType === 'image' ||
          detectedType === 'video')
      ) {
        setCoverSelection(`new:${key}`);
      }
    } catch (uploadError) {
      setMediaError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Не удалось загрузить медиа'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeExistingMedia = (
    mediaId: number
  ) => {
    setDeletedMediaIds((current) => [
      ...current,
      mediaId,
    ]);

    if (
      coverSelection ===
      `existing:${mediaId}`
    ) {
      setCoverSelection('');
    }
  };

  const removeNewMedia = (key: string) => {
    setNewMedia((current) =>
      current.filter(
        (media) => media.key !== key
      )
    );

    if (coverSelection === `new:${key}`) {
      setCoverSelection('');
    }
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    void onSubmit({
      postType,
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim(),
      content: content.trim(),
      category: category.trim(),
      allowComments,
      sendNotification,
      expiresAt,
      newMedia,
      deletedMediaIds,
      coverSelection,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-editor-title"
    >
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="news-editor-title"
              className="text-lg font-bold text-gray-900"
            >
              {item
                ? 'Редактирование новости'
                : 'Новая публикация'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Текст, изображения и видео
              объединяются в одну публикацию.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isUploading}
            aria-label="Закрыть окно"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            <section className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">
                  Тип публикации
                </span>

                <select
                  value={postType}
                  onChange={(event) =>
                    setPostType(
                      event.target.value as PostType
                    )
                  }
                  className={inputClassName}
                >
                  {POST_TYPES.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">
                  Категория
                </span>

                <input
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  placeholder="Например: жизнь школы"
                  className={inputClassName}
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">
                  Заголовок
                </span>

                <input
                  required
                  maxLength={500}
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Заголовок новости"
                  className={inputClassName}
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">
                  Краткое описание
                </span>

                <textarea
                  maxLength={1500}
                  value={summary}
                  onChange={(event) =>
                    setSummary(
                      event.target.value
                    )
                  }
                  rows={2}
                  placeholder="Короткий текст для карточки новости"
                  className={`${inputClassName} resize-y`}
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">
                  Текст новости
                </span>

                <textarea
                  maxLength={100000}
                  value={content}
                  onChange={(event) =>
                    setContent(
                      event.target.value
                    )
                  }
                  rows={8}
                  placeholder="Полный текст публикации"
                  className={`${inputClassName} resize-y leading-6`}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">
                  Адрес публикации
                </span>

                <input
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value)
                  }
                  placeholder="Создастся автоматически"
                  className={inputClassName}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">
                  Показывать до
                </span>

                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) =>
                    setExpiresAt(
                      event.target.value
                    )
                  }
                  className={inputClassName}
                />
              </label>
            </section>

            <section className="border-t border-gray-100 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Фото, видео и файлы
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Загрузите файл или добавьте
                    готовую ссылку.
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    onChange={(event) =>
                      void uploadFile(event)
                    }
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={isUploading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileUp className="h-4 w-4" />
                    )}
                    Загрузить файл
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 md:grid-cols-[180px_minmax(0,1fr)_auto]">
                <select
                  value={mediaType}
                  onChange={(event) =>
                    setMediaType(
                      event.target
                        .value as PostMediaType
                    )
                  }
                  className={inputClassName}
                >
                  {MEDIA_TYPES.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>

                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(event) =>
                    setMediaUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://... ссылка на медиа"
                  className={inputClassName}
                />

                <button
                  type="button"
                  onClick={addUrlMedia}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Plus className="h-4 w-4" />
                  Добавить
                </button>

                <input
                  type="url"
                  value={previewUrl}
                  onChange={(event) =>
                    setPreviewUrl(
                      event.target.value
                    )
                  }
                  placeholder="Ссылка на превью видео (необязательно)"
                  className={`${inputClassName} md:col-start-2`}
                />

                <input
                  value={altText}
                  onChange={(event) =>
                    setAltText(
                      event.target.value
                    )
                  }
                  placeholder="Описание медиа для доступности"
                  className={`${inputClassName} md:col-start-2`}
                />
              </div>

              {mediaError && (
                <p className="mt-3 text-sm text-red-600">
                  {mediaError}
                </p>
              )}

              {visibleExistingMedia.length === 0 &&
              newMedia.length === 0 ? (
                <div className="mt-4 flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
                  <div className="flex gap-2 text-gray-300">
                    <Image className="h-6 w-6" />
                    <Video className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Медиа пока не добавлены
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleExistingMedia.map(
                    (media) => {
                      const selection =
                        `existing:${media.id}`;

                      return (
                        <article
                          key={media.id}
                          className="rounded-xl border border-gray-200 bg-white p-2"
                        >
                          {existingMediaPreview(
                            media
                          )}

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setCoverSelection(
                                  selection
                                )
                              }
                              className={`inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${
                                coverSelection ===
                                selection
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'text-gray-500 hover:bg-gray-100'
                              }`}
                            >
                              <Star className="h-3.5 w-3.5" />
                              Обложка
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeExistingMedia(
                                  media.id
                                )
                              }
                              aria-label="Удалить медиа"
                              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}

                  {newMedia.map((media) => {
                    const selection =
                      `new:${media.key}`;

                    return (
                      <article
                        key={media.key}
                        className="rounded-xl border border-blue-100 bg-blue-50/30 p-2"
                      >
                        {mediaPreview(media)}

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCoverSelection(
                                selection
                              )
                            }
                            className={`inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${
                              coverSelection ===
                              selection
                                ? 'bg-amber-50 text-amber-700'
                                : 'text-gray-500 hover:bg-white'
                            }`}
                          >
                            <Star className="h-3.5 w-3.5" />
                            Обложка
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeNewMedia(
                                media.key
                              )
                            }
                            aria-label="Убрать новое медиа"
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="grid gap-3 border-t border-gray-100 pt-5 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(event) =>
                    setAllowComments(
                      event.target.checked
                    )
                  }
                  className="mt-0.5 h-4 w-4 accent-red-600"
                />

                <span>
                  <span className="block text-sm font-semibold text-gray-800">
                    Разрешить комментарии
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Посетители смогут обсуждать новость.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(event) =>
                    setSendNotification(
                      event.target.checked
                    )
                  }
                  className="mt-0.5 h-4 w-4 accent-red-600"
                />

                <span>
                  <span className="block text-sm font-semibold text-gray-800">
                    Отправить уведомление
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Сработает при публикации новости.
                  </span>
                </span>
              </label>
            </section>

            {(error || (!content.trim() &&
              !item?.post.cover_media_url &&
              visibleExistingMedia.length === 0 &&
              newMedia.length === 0)) && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error ??
                  'Для публикации добавьте текст или медиа. Черновик можно сохранить и без них.'}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploading}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={
                isSaving ||
                isUploading ||
                !title.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {item
                ? 'Сохранить изменения'
                : 'Создать черновик'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
