import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  ImageOff,
  Loader2,
  Newspaper,
  RefreshCw,
} from 'lucide-react';

import {
  formatNewsDate,
  getNewsCategory,
  getNewsExcerpt,
  getNewsImage,
  getPublicNews,
  type PublicNewsPost,
} from '../../api/publicNewsApi';

const ALL_CATEGORY = 'Все';

function NewsCover({
  post,
}: {
  post: PublicNewsPost;
}) {
  const [imageError, setImageError] =
    useState(false);

  const imageUrl =
    getNewsImage(post);

  if (!imageUrl || imageError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <ImageOff className="h-9 w-9" />
          <span className="text-xs font-medium">
            Фото скоро появится
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={post.title}
      loading="lazy"
      onError={() =>
        setImageError(true)
      }
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

export default function News() {
  const [news, setNews] =
    useState<PublicNewsPost[]>([]);

  const [activeCategory, setActiveCategory] =
    useState(ALL_CATEGORY);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadNews =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getPublicNews();

        setNews(data);
      } catch (requestError) {
        console.error(
          'Не удалось загрузить новости:',
          requestError
        );

        setNews([]);

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не удалось загрузить новости'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const categories =
    useMemo(() => {
      const uniqueCategories = [
        ...new Set(
          news.map(
            (post) =>
              getNewsCategory(post)
          )
        ),
      ];

      return [
        ALL_CATEGORY,
        ...uniqueCategories,
      ];
    }, [news]);

  useEffect(() => {
    if (
      activeCategory !== ALL_CATEGORY &&
      !categories.includes(
        activeCategory
      )
    ) {
      setActiveCategory(
        ALL_CATEGORY
      );
    }
  }, [
    activeCategory,
    categories,
  ]);

  const filteredNews =
    useMemo(
      () =>
        activeCategory === ALL_CATEGORY
          ? news
          : news.filter(
              (post) =>
                getNewsCategory(post) ===
                activeCategory
            ),
      [
        activeCategory,
        news,
      ]
    );

  return (
    <>
      <section className="bg-gray-50 pb-12 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm font-semibold text-red-600">
            Медиацентр
          </p>

          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Жизнь школы
          </h1>

          <p className="max-w-2xl text-lg text-gray-500">
            Всё, что вы пропустили: события,
            достижения, проекты студентов и важные
            новости Высшей школы программирования.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />

              <p className="text-sm">
                Загружаем новости...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <AlertCircle className="h-9 w-9 text-red-600" />

              <h2 className="mt-4 text-lg font-bold text-red-900">
                Не удалось загрузить новости
              </h2>

              <p className="mt-2 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadNews()
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Повторить
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            news.length === 0 && (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <Newspaper className="h-12 w-12 text-gray-300" />

                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  Опубликованных новостей пока нет
                </h2>

                <p className="mt-2 max-w-md text-sm text-gray-500">
                  После публикации новости в News
                  Service она автоматически появится
                  на этой странице.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            news.length > 0 && (
              <>
                <div className="mb-10 flex flex-wrap items-center gap-2">
                  {categories.map(
                    (category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          setActiveCategory(
                            category
                          )
                        }
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          activeCategory ===
                          category
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    )
                  )}
                </div>

                {filteredNews.length === 0 ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                    <Newspaper className="h-10 w-10 text-gray-300" />

                    <p className="mt-3 font-semibold text-gray-800">
                      В этой категории новостей пока нет
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredNews.map(
                      (post) => (
                        <article
                          key={post.id}
                          className="card group overflow-hidden"
                        >
                          <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                            <NewsCover
                              post={post}
                            />
                          </div>

                          <div className="p-6">
                            <div className="mb-3 flex flex-wrap items-center gap-3">
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                                {getNewsCategory(
                                  post
                                )}
                              </span>

                              <span className="text-xs text-gray-400">
                                {formatNewsDate(
                                  post
                                )}
                              </span>
                            </div>

                            <h2 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-red-600">
                              {post.title}
                            </h2>

                            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-500">
                              {getNewsExcerpt(
                                post
                              )}
                            </p>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </>
            )}
        </div>
      </section>
    </>
  );
}
