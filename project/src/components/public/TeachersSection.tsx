import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import {
  getPublicTeachers,
  getTeacherFullName,
  getTeacherInitials,
  type PublicTeacher,
} from '../../api/publicTeacherApi';

export default function TeachersSection() {
  const [teachers, setTeachers] =
    useState<PublicTeacher[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTeachers() {
      try {
        const data =
          await getPublicTeachers();

        if (isMounted) {
          setTeachers(
            data.slice(0, 3)
          );
        }
      } catch (error) {
        console.error(
          'Не удалось загрузить преподавателей для главной страницы:',
          error
        );

        if (isMounted) {
          setTeachers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && teachers.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold text-red-600">
              Преподаватели
            </p>

            <h2 className="section-title">
              Учитесь у практиков
            </h2>
          </div>

          <Link
            to="/teachers"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 transition-colors hover:text-red-600"
          >
            Наша команда
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : (
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
                      <h3 className="text-lg font-bold text-gray-900">
                        {name}
                      </h3>

                      <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-6 text-gray-600">
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
  );
}
