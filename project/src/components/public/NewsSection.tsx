import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowRight,
  ImageOff,
  Loader2,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import {
  formatNewsDate,
  getNewsCategory,
  getNewsExcerpt,
  getNewsImage,
  getPublicNews,
  type PublicNewsPost,
} from '../../api/publicNewsApi';

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
        <ImageOff className="h-9 w-9 text-gray-300" />
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

export default function NewsSection() {
  const [news, setNews] =
    useState<PublicNewsPost[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      try {
        const data =
          await getPublicNews(3);

        if (isMounted) {
          setNews(
            data.slice(0, 3)
          );
        }
      } catch (error) {
        console.error(
          'Не удалось загрузить новости для главной страницы:',
          error
        );

        if (isMounted) {
          setNews([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadNews();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && news.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold text-red-600">
              Медиацентр
            </p>

            <h2 className="section-title">
              Жизнь школы
            </h2>
          </div>

          <Link
            to="/news"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 transition-colors hover:text-red-600"
          >
            Всё, что вы пропустили
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map(
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

                    <h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-red-600">
                      {post.title}
                    </h3>

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
      </div>
    </section>
  );
}
