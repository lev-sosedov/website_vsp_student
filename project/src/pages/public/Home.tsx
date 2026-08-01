import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Flag,
  MapPin,
} from 'lucide-react';

import { stats } from '../../data/public/statsData';
import NewsSection from '../../components/public/NewsSection';
import ProgramsSection from '../../components/public/ProgramsSection';
import WhyChooseUs from '../../components/public/WhyChooseUs';
import ReviewsSection from '../../components/public/ReviewsSection';
import heroSchool from '../../assets/images/home/hero-school.webp';
import schoolBanner from '../../assets/images/home/baner1.webp';
import {
  getPublicHomeCounters,
} from '../../api/publicStatisticsApi';

interface PublicBranch {
  name: string;
  address: string;
  markerLeft: number;
  markerTop: number;
}

const branches: PublicBranch[] = [
  {
    name: 'Центральный филиал',
    address: 'г. Краснодар, ул. Базовская, 254',
    markerLeft: 27.59,
    markerTop: 39.45,
  },
  {
    name: 'Филиал Фестивальный',
    address: 'г. Краснодар, ул. имени Валерия Гассия, 2',
    markerLeft: 72.56,
    markerTop: 87.8,
  },
  {
    name: 'Филиал Юбилейный',
    address: 'г. Краснодар, ул. Монтажников, 2',
    markerLeft: 12.33,
    markerTop: 21.31,
  },
  {
    name: 'Филиал Гидростроителей',
    address: 'г. Краснодар, ул. Зиповская, 31',
    markerLeft: 37.22,
    markerTop: 17.15,
  },
  {
    name: 'Филиал Комсомольский',
    address: 'г. Краснодар, ул. Сормовская, 163/1',
    markerLeft: 83.83,
    markerTop: 47.3,
  },
];

function getMapLink(address: string): string {
  return `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
}

export default function Home() {
  const [teacherCount, setTeacherCount] =
    useState<number | null>(null);
  const [branchCount, setBranchCount] =
    useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    getPublicHomeCounters()
      .then((counters) => {
        if (!isMounted) {
          return;
        }

        setTeacherCount(counters.teacherCount);
        setBranchCount(counters.branchCount);
      })
      .catch((counterError) => {
        console.error(
          'Не удалось загрузить счётчики главной страницы:',
          counterError
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayedStats = useMemo(
    () =>
      stats.map((stat) => {
        if (stat.label === 'Преподавателей') {
          return {
            ...stat,
            value:
              teacherCount === null
                ? '—'
                : String(teacherCount),
          };
        }

        if (stat.label === 'Филиалов') {
          return {
            ...stat,
            value:
              branchCount === null
                ? '—'
                : String(branchCount),
          };
        }

        return stat;
      }),
    [branchCount, teacherCount]
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-none lg:rounded-2xl">
            <img
              src={heroSchool}
              alt="Здание Высшей школы программирования"
              className="block h-auto w-full"
            />

            {/* Затемнение только для читаемости текста */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />

            {/* Текст поверх изображения */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full px-6 sm:px-10 lg:px-12">
                <div className="max-w-xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-white">
                      Набор 2026 открыт
                    </span>
                  </div>

                  <h1 className="mb-5 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                    ВШП Студент
                  </h1>

                  <p className="mb-7 max-w-lg text-base leading-relaxed text-white/90 md:text-lg">
                    Современная образовательная платформа для студентов,
                    родителей и преподавателей.
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/register"
                      className="btn-primary"
                    >
                      Начать обучение
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      to="/about"
                      className="btn-secondary border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                    >
                      Узнать больше
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="border border-t-0 border-gray-100 bg-white shadow-sm">
            <div className="grid grid-cols-2 divide-x divide-gray-100 md:grid-cols-4">
              {displayedStats.map((stat, index) => (
                <div
                  key={index}
                  className="py-6 text-center md:py-8"
                >
                  <p className="text-2xl font-bold text-gray-900 md:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 md:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <NewsSection />
      <ProgramsSection />
      <WhyChooseUs />

      {/* Баннер школы вместо блока преподавателей */}
      <section className="py-16 lg:py-24">
        {/*
         * Блок не имеет фиксированной ширины или высоты.
         * Изображение показывается в своём естественном размере.
         * На маленьком экране оно только пропорционально уменьшается.
         */}
        <div className="flex w-full justify-center px-4 sm:px-6 lg:px-8">
          <img
            src={schoolBanner}
            alt="Газета Высшей школы программирования"
            loading="lazy"
            className="block h-auto w-auto max-w-full rounded-2xl border border-gray-100 shadow-sm"
          />
        </div>
      </section>

      <ReviewsSection />

      {/* Map + Contacts */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold text-red-600">
              Наши филиалы
            </p>
            <h2 className="section-title mb-4">
              Выберите ближайший филиал
            </h2>
            <p className="section-subtitle">
              5 современных учебных центров в Краснодаре. Найдите филиал,
              который находится ближе всего к вам.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Карта с пятью отметками филиалов */}
            <div className="relative aspect-[6/5] overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-sm">
              <iframe
                title="Карта филиалов"
                src="https://www.openstreetmap.org/export/embed.html?bbox=38.94%2C44.98%2C39.12%2C45.08&layer=mapnik"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
              />

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-4 top-4 rounded-xl border border-white/70 bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow-md backdrop-blur-sm">
                  На карте отмечено: {branches.length}
                </div>

                {branches.map((branch, index) => (
                  <a
                    key={branch.name}
                    href={getMapLink(branch.address)}
                    target="_blank"
                    rel="noreferrer"
                    title={`${branch.name}: ${branch.address}`}
                    aria-label={`Открыть на карте: ${branch.name}, ${branch.address}`}
                    className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-full"
                    style={{
                      left: `${branch.markerLeft}%`,
                      top: `${branch.markerTop}%`,
                    }}
                  >
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-red-600 text-white shadow-lg transition-transform group-hover:scale-110">
                      <Flag className="h-5 w-5" />
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
                        {index + 1}
                      </span>
                    </span>

                    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-52 -translate-x-1/2 rounded-xl bg-gray-950/95 px-3 py-2 text-center text-xs leading-5 text-white shadow-xl group-hover:block">
                      <strong className="block font-semibold">
                        {branch.name}
                      </strong>
                      <span className="text-white/75">
                        {branch.address}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Список филиалов */}
            <div className="space-y-4">
              {branches.map((branch, index) => (
                <a
                  key={branch.name}
                  href={getMapLink(branch.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="card flex items-start gap-4 p-5 transition-all hover:border-red-200 hover:shadow-md"
                >
                  <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {branch.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {branch.address}
                    </p>
                  </div>
                </a>
              ))}

              <Link
                to="/contacts"
                className="btn-primary w-full justify-center"
              >
                Все филиалы и контакты
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
