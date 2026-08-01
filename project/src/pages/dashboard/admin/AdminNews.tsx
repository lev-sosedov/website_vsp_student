import {
  AlertCircle,
  Archive,
  CheckCircle2,
  FileEdit,
  Loader2,
  Newspaper,
  Pin,
  Plus,
  Search,
  Send,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  activateNewsPost,
  archiveNewsPost,
  createNewsPost,
  createNewsPostMedia,
  deactivateNewsPost,
  deleteNewsPostMedia,
  pinNewsPost,
  publishNewsPost,
  restoreNewsPost,
  setNewsPostCover,
  unpinNewsPost,
  unpublishNewsPost,
  updateNewsPost,
  type CreateNewsPostData,
  type NewsPost,
  type PostStatus,
  type PostType,
  type UpdateNewsPostData,
} from '../../../api/newsApi';
import AdminNewsEditorModal, {
  type AdminNewsFormValues,
  type AdminNewsSubmitMode,
} from '../../../components/dashboard/admin/news/AdminNewsEditorModal';
import AdminNewsFeedCard from '../../../components/dashboard/admin/news/AdminNewsFeedCard';
import { useAuth } from '../../../context/AuthContext';
import {
  EMPTY_ADMIN_NEWS_DATA,
  loadAdminNews,
  type AdminNewsData,
  type AdminNewsItem,
} from '../../../services/adminNewsService';

const selectClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100';

const POST_TYPE_OPTIONS: Array<{
  value: PostType;
  label: string;
}> = [
  { value: 'post', label: 'Новости' },
  { value: 'important', label: 'Важные' },
  { value: 'event', label: 'Мероприятия' },
  { value: 'achievement', label: 'Достижения' },
  { value: 'article', label: 'Статьи' },
];

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить операцию';
}

function toApiDateTime(
  value: string
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

export default function AdminNews() {
  const { user } = useAuth();

  const [data, setData] =
    useState<AdminNewsData>(
      EMPTY_ADMIN_NEWS_DATA
    );
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [searchValue, setSearchValue] =
    useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | PostStatus>('all');
  const [typeFilter, setTypeFilter] =
    useState<'all' | PostType>('all');
  const [categoryFilter, setCategoryFilter] =
    useState('all');
  const [pinnedOnly, setPinnedOnly] =
    useState(false);

  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [selectedItem, setSelectedItem] =
    useState<AdminNewsItem | null>(null);
  const [isSaving, setIsSaving] =
    useState(false);
  const [modalError, setModalError] =
    useState<string | null>(null);
  const [activeAction, setActiveAction] =
    useState<string | null>(null);

  const loadNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedData =
        await loadAdminNews();

      setData(loadedData);
      return loadedData;
    } catch (loadError) {
      setData(EMPTY_ADMIN_NEWS_DATA);
      setError(getErrorMessage(loadError));
      return EMPTY_ADMIN_NEWS_DATA;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setSuccessMessage(null),
      4_000
    );

    return () =>
      window.clearTimeout(timeoutId);
  }, [successMessage]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          data.items
            .map((item) =>
              item.post.category?.trim()
            )
            .filter(
              (category): category is string =>
                Boolean(category)
            )
        )
      ).sort((first, second) =>
        first.localeCompare(second, 'ru')
      ),
    [data.items]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return data.items.filter((item) => {
      const { post } = item;
      const searchableText = [
        post.title,
        post.summary,
        post.content,
        post.category,
        post.slug,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        (!normalizedSearch ||
          searchableText.includes(
            normalizedSearch
          )) &&
        (statusFilter === 'all' ||
          post.status === statusFilter) &&
        (typeFilter === 'all' ||
          post.post_type === typeFilter) &&
        (categoryFilter === 'all' ||
          post.category === categoryFilter) &&
        (!pinnedOnly || post.is_pinned)
      );
    });
  }, [
    categoryFilter,
    data.items,
    pinnedOnly,
    searchValue,
    statusFilter,
    typeFilter,
  ]);

  const statistics = useMemo(
    () => ({
      total: data.items.length,
      published: data.items.filter(
        (item) =>
          item.post.status === 'published'
      ).length,
      draft: data.items.filter(
        (item) =>
          item.post.status === 'draft'
      ).length,
      archived: data.items.filter(
        (item) =>
          item.post.status === 'archived'
      ).length,
      pinned: data.items.filter(
        (item) => item.post.is_pinned
      ).length,
    }),
    [data.items]
  );

  const openCreateModal = () => {
    setSelectedItem(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (
    item: AdminNewsItem
  ) => {
    setSelectedItem(item);
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setSelectedItem(null);
    setModalError(null);
  };

  const savePost = async (
    values: AdminNewsFormValues,
    submitMode: AdminNewsSubmitMode
  ) => {
    if (!user?.id) {
      setModalError(
        'Не удалось определить администратора'
      );
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const commonData = {
        post_type: values.postType,
        title: values.title,
        summary: values.summary || null,
        content: values.content || null,
        category: values.category || null,
        allow_comments:
          values.allowComments,
        send_notification:
          values.sendNotification,
        expires_at: toApiDateTime(
          values.expiresAt
        ),
      };

      let savedPost: NewsPost;

      if (selectedItem) {
        const updateData: UpdateNewsPostData = {
          ...commonData,
          ...(values.slug
            ? { slug: values.slug }
            : {}),
          updated_by: user.id,
        };

        savedPost = await updateNewsPost(
          selectedItem.post.id,
          updateData
        );
      } else {
        const createData: CreateNewsPostData = {
          ...commonData,
          ...(values.slug
            ? { slug: values.slug }
            : {}),
          created_by: user.id,
        };

        savedPost =
          await createNewsPost(createData);
      }

      for (
        const mediaId of
        values.deletedMediaIds
      ) {
        await deleteNewsPostMedia(
          mediaId,
          user.id
        );
      }

      const createdMediaByKey = new Map<
        string,
        number
      >();
      const baseSortOrder =
        (selectedItem?.media.length ?? 0) -
        values.deletedMediaIds.length;

      for (
        let index = 0;
        index < values.newMedia.length;
        index += 1
      ) {
        const media =
          values.newMedia[index];
        const createdMedia =
          await createNewsPostMedia({
            post_id: savedPost.id,
            media_type: media.mediaType,
            file_url: media.fileUrl,
            preview_url: media.previewUrl,
            file_name: media.fileName,
            mime_type: media.mimeType,
            file_size: media.fileSize,
            width:
              media.width && media.height
                ? media.width
                : null,
            height:
              media.width && media.height
                ? media.height
                : null,
            duration_seconds:
              media.durationSeconds,
            alt_text: media.altText,
            sort_order:
              Math.max(baseSortOrder, 0) +
              index,
            uploaded_by: user.id,
          });

        createdMediaByKey.set(
          media.key,
          createdMedia.id
        );
      }

      if (
        values.coverSelection.startsWith(
          'existing:'
        )
      ) {
        const mediaId = Number(
          values.coverSelection.replace(
            'existing:',
            ''
          )
        );

        if (
          Number.isInteger(mediaId) &&
          mediaId > 0
        ) {
          await setNewsPostCover(
            mediaId,
            user.id
          );
        }
      }

      if (
        values.coverSelection.startsWith(
          'new:'
        )
      ) {
        const key =
          values.coverSelection.replace(
            'new:',
            ''
          );
        const mediaId =
          createdMediaByKey.get(key);

        if (mediaId) {
          await setNewsPostCover(
            mediaId,
            user.id
          );
        }
      }

      if (
        submitMode === 'publish' &&
        savedPost.status !== 'published'
      ) {
        savedPost = await publishNewsPost(
          savedPost.id,
          user.id,
          values.sendNotification
        );
      }

      await loadNews();
      setSuccessMessage(
        submitMode === 'publish'
          ? 'Новость опубликована'
          : selectedItem
            ? 'Новость обновлена'
            : 'Черновик новости создан'
      );
      closeModal();
    } catch (saveError) {
      setModalError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runAction = async (
    key: string,
    item: AdminNewsItem,
    action: (
      postId: number,
      userId: number
    ) => Promise<unknown>,
    successText: string
  ) => {
    if (!user?.id) {
      setError(
        'Не удалось определить администратора'
      );
      return;
    }

    setActiveAction(
      `${key}:${item.post.id}`
    );
    setError(null);

    try {
      await action(item.post.id, user.id);
      await loadNews();
      setSuccessMessage(successText);
    } catch (actionError) {
      setError(
        getErrorMessage(actionError)
      );
    } finally {
      setActiveAction(null);
    }
  };

  const publishPost = (
    item: AdminNewsItem
  ) => {
    if (!user?.id) {
      return;
    }

    setActiveAction(
      `publish:${item.post.id}`
    );
    setError(null);

    void publishNewsPost(
      item.post.id,
      user.id,
      item.post.send_notification
    )
      .then(async () => {
        await loadNews();
        setSuccessMessage(
          'Новость опубликована'
        );
      })
      .catch((publishError: unknown) => {
        setError(
          getErrorMessage(publishError)
        );
      })
      .finally(() =>
        setActiveAction(null)
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Новости
          </h1>

          <p className="mt-1 text-gray-500">
            Лента публикаций школы и управление контентом
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Создать новость
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: 'Всего',
            value: statistics.total,
            icon: Newspaper,
            color:
              'bg-red-50 text-red-600',
          },
          {
            label: 'Опубликовано',
            value: statistics.published,
            icon: Send,
            color:
              'bg-green-50 text-green-600',
          },
          {
            label: 'Черновики',
            value: statistics.draft,
            icon: FileEdit,
            color:
              'bg-amber-50 text-amber-600',
          },
          {
            label: 'Закреплено',
            value: statistics.pinned,
            icon: Pin,
            color:
              'bg-blue-50 text-blue-600',
          },
          {
            label: 'В архиве',
            value: statistics.archived,
            icon: Archive,
            color:
              'bg-gray-100 text-gray-600',
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="stat-card"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-gray-900">
              Лента новостей
            </h2>
            <p className="text-xs text-gray-500">
              Показано: {filteredItems.length}
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.5fr)_repeat(3,minmax(155px,0.72fr))_auto]">
            <label className="relative">
              <span className="sr-only">
                Поиск новостей
              </span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Заголовок, текст или категория"
                className={`${selectClassName} pl-10`}
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | 'all'
                    | PostStatus
                )
              }
              aria-label="Статус новости"
              className={selectClassName}
            >
              <option value="all">
                Все статусы
              </option>
              <option value="published">
                Опубликовано
              </option>
              <option value="draft">
                Черновики
              </option>
              <option value="archived">
                Архив
              </option>
            </select>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as
                    | 'all'
                    | PostType
                )
              }
              aria-label="Тип новости"
              className={selectClassName}
            >
              <option value="all">
                Все типы
              </option>
              {POST_TYPE_OPTIONS.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              aria-label="Категория новости"
              className={selectClassName}
            >
              <option value="all">
                Все категории
              </option>
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                setPinnedOnly(
                  (current) => !current
                )
              }
              aria-pressed={pinnedOnly}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                pinnedOnly
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Pin className="h-4 w-4" />
              Закреплённые
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            <p className="mt-3 text-sm text-gray-500">
              Загружаем новости…
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
            <Newspaper className="h-10 w-10 text-gray-300" />
            <h3 className="mt-4 font-semibold text-gray-900">
              Новости не найдены
            </h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              Измените фильтры или создайте первую публикацию.
            </p>
          </div>
        ) : (
          <div className="min-h-[64rem] bg-gray-50/60 p-4 sm:p-6 lg:p-8">
            <div className="w-full space-y-7">
              {filteredItems.map((item) => (
                <AdminNewsFeedCard
                  key={item.post.id}
                  item={item}
                  activeAction={activeAction}
                  onEdit={openEditModal}
                  onPublish={publishPost}
                  onUnpublish={(current) =>
                    void runAction(
                      'unpublish',
                      current,
                      unpublishNewsPost,
                      'Новость снята с публикации'
                    )
                  }
                  onTogglePin={(current) =>
                    void runAction(
                      current.post.is_pinned
                        ? 'unpin'
                        : 'pin',
                      current,
                      current.post.is_pinned
                        ? unpinNewsPost
                        : pinNewsPost,
                      current.post.is_pinned
                        ? 'Новость откреплена'
                        : 'Новость закреплена'
                    )
                  }
                  onToggleActive={(current) =>
                    void runAction(
                      current.post.is_active
                        ? 'deactivate'
                        : 'activate',
                      current,
                      current.post.is_active
                        ? deactivateNewsPost
                        : activateNewsPost,
                      current.post.is_active
                        ? 'Новость отключена'
                        : 'Новость включена'
                    )
                  }
                  onArchive={(current) => {
                    if (
                      window.confirm(
                        'Переместить новость в архив?'
                      )
                    ) {
                      void runAction(
                        'archive',
                        current,
                        archiveNewsPost,
                        'Новость перемещена в архив'
                      );
                    }
                  }}
                  onRestore={(current) =>
                    void runAction(
                      'restore',
                      current,
                      restoreNewsPost,
                      'Новость восстановлена'
                    )
                  }
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <AdminNewsEditorModal
        isOpen={isModalOpen}
        item={selectedItem}
        isSaving={isSaving}
        error={modalError}
        onClose={closeModal}
        onSubmit={savePost}
      />
    </div>
  );
}
