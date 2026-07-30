import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AlertCircle,
  Loader2,
  RefreshCw,
  UserRound,
} from 'lucide-react';

import {
  getPublicTeachers,
  getTeacherFullName,
  getTeacherInitials,
  type PublicTeacher,
} from '../../api/publicTeacherApi';

export default function Teachers() {
  const [teachers, setTeachers] =
    useState<PublicTeacher[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadTeachers =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getPublicTeachers();

        setTeachers(data);
      } catch (requestError) {
        console.error(
          'Не удалось загрузить преподавателей:',
          requestError
        );

        setTeachers([]);

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не удалось загрузить преподавателей'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  return (
    <>
      <section className="bg-gray-50 pb-12 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm font-semibold text-red-600">
            Преподаватели
          </p>

          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Команда практиков
          </h1>

          <p className="max-w-2xl text-lg text-gray-500">
            Наши преподаватели — практикующие специалисты
            с опытом разработки, системного
            администрирования, дизайна и цифровых
            технологий. Они помогают студентам получить
            не только теоретические знания, но и
            практические навыки, необходимые для работы
            над реальными проектами.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />

              <p className="text-sm">
                Загружаем преподавателей...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <AlertCircle className="h-9 w-9 text-red-600" />

              <h2 className="mt-4 text-lg font-bold text-red-900">
                Не удалось загрузить преподавателей
              </h2>

              <p className="mt-2 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadTeachers()
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
            teachers.length === 0 && (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <UserRound className="h-12 w-12 text-gray-300" />

                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  Преподаватели пока не добавлены
                </h2>

                <p className="mt-2 max-w-md text-sm text-gray-500">
                  После назначения пользователям роли
                  преподавателя их карточки появятся на
                  этой странице.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            teachers.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {teachers.map(
                  (teacher) => {
                    const name =
                      getTeacherFullName(
                        teacher
                      );

                    return (
                      <article
                        key={teacher.id}
                        className="card group overflow-hidden"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                          {teacher.avatar_url ? (
                            <img
                              src={
                                teacher.avatar_url
                              }
                              alt={name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
                              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-bold text-red-600 shadow-sm">
                                {getTeacherInitials(
                                  teacher
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          <h2 className="text-lg font-bold text-gray-900">
                            {name}
                          </h2>

                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                            {teacher.about?.trim() ||
                              'Информация о преподавателе скоро появится.'}
                          </p>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </section>
    </>
  );
}
