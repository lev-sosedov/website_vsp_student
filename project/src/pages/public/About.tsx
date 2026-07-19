import { CheckCircle2 } from 'lucide-react';
import { stats } from '../../data/public/statsData';

export default function About() {
  return (
    <>
      <section className="pt-32 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-red-600 text-sm font-semibold mb-2">О школе</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
              Школа, которая готовит будущих IT-лидеров
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Высшая Школа Программирования — это образовательное пространство, где студенты получают практические навыки современной разработки. Мы объединяем опытных преподавателей, актуальные программы и реальную практику.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 mb-16">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-red-600">{s.value}</p>
                <p className="text-sm text-gray-500 mt-2">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://images.pexels.com/photos/2076899/pexels-photo-2076899.jpeg?auto=compress&cs=tinysrgb&w=900"
                alt="Школа"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Наша миссия</h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Мы верим, что качественное IT-образование должно быть доступным и практичным. Наша цель — подготовить специалистов, готовых решать реальные задачи с первого дня работы.
              </p>
              <ul className="space-y-3">
                {[
                  'Практический подход к обучению',
                  'Преподаватели — действующие специалисты',
                  'Помощь в трудоустройстве',
                  'Современное оборудование и материалы',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
