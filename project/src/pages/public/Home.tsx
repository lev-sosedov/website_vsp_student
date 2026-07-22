import { Link } from 'react-router-dom';
import { ArrowRight, MapPin} from 'lucide-react';
import { stats } from '../../data/public/statsData';
import NewsSection from '../../components/public/NewsSection';
import ProgramsSection from '../../components/public/ProgramsSection';
import WhyChooseUs from '../../components/public/WhyChooseUs';
import TeachersSection from '../../components/public/TeachersSection';
import ReviewsSection from '../../components/public/ReviewsSection';
import heroSchool from "../../assets/images/home/hero-school.webp";

export default function Home() {
  return (
    <>
      {/* Hero */}
  <section className="bg-white pt-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="relative overflow-hidden rounded-none lg:rounded-2xl">
      <img
        src={heroSchool}
        alt="Здание Высшей школы программирования"
        className="block w-full h-auto"
      />

      {/* Затемнение только для читаемости текста */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />

      {/* Текст поверх изображения */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full px-6 sm:px-10 lg:px-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-sm font-medium">
                Набор 2026 открыт
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              ВШП Студент
            </h1>

            <p className="text-base md:text-lg text-white/90 mb-7 max-w-lg leading-relaxed">
              Современная образовательная платформа для студентов,
              родителей и преподавателей.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="btn-primary">
                Начать обучение
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/about"
                className="btn-secondary bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
              >
                Узнать больше
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Статистика */}
    <div className="bg-white border border-gray-100 border-t-0 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
        {stats.map((stat, i) => (
          <div key={i} className="py-6 md:py-8 text-center">
            <p className="text-2xl md:text-4xl font-bold text-gray-900">
              {stat.value}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
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
      <TeachersSection />
      <ReviewsSection />

      {/* Map + Contacts */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-red-600 text-sm font-semibold mb-2">Наши филиалы</p>
            <h2 className="section-title mb-4">Выберите ближайший филиал</h2>
            <p className="section-subtitle">
              5 современных учебных центров в Краснодаре. Найдите филиал, который
              находится ближе всего к вам.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Карта */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm min-h-[500px] bg-gray-100">
              <iframe
                title="Карта филиалов"
                src="https://www.openstreetmap.org/export/embed.html?bbox=38.90%2C45.00%2C39.20%2C45.15&layer=mapnik"
                className="w-full h-full min-h-[500px] border-0"
                loading="lazy"
              />
            </div>

            {/* Список филиалов */}
            <div className="space-y-4">
              {[
                {
                  name: "Центральный филиал",
                  address: "г. Краснодар, ул. Базовская, 254",
                },
                {
                  name: "Филиал Фестивальный",
                  address: "г. Краснодар, ул. имени Валерия Гассия, 2",
                },
                {
                  name: "Филиал Юбилейный",
                  address: "г. Краснодар, ул. Монтажников, 2",
                },
                {
                  name: "Филиал Гидростроителей",
                  address: "г. Краснодар, ул. Зиповская ул, 31",
                },
                {
                  name: "Филиал Комсомольский",
                  address: "г. Краснодар, ул. Сормовская, 163/1",
                },
              ].map((branch, i) => (
                <div
                  key={i}
                  className="card p-5 flex items-start gap-4 hover:border-red-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {branch.address}
                    </p>
                  </div>
                </div>
              ))}

              <Link to="/contacts" className="btn-primary w-full justify-center">
                Все филиалы и контакты
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
    </>
  );
}
