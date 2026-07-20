import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import { programs } from '../../data/public/programsData';

export default function Programs() {
  return (
    <>
      <section className="pt-32 pb-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 text-sm font-semibold mb-2">
            Программы обучения
          </p>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Все направления
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl">
            Шесть направлений для детей, подростков и взрослых:
            программирование, web-разработка, системное администрирование,
            графический дизайн и 3D, 3D-печать и летний IT-лагерь.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map((program) => {
              const Icon =
                (Icons as unknown as Record<string, React.ElementType>)[
                  program.icon
                ] || Icons.Code2;

              return (
                <Link
                  key={program.id}
                  to={`/programs/${program.slug}`}
                  className="card p-6 group hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-200">
                    <Icon className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-200" />
                  </div>

                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {program.title}
                  </h3>

                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                    {program.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{program.duration}</span>

                    <span className="w-1 h-1 rounded-full bg-gray-300" />

                    <span>{program.level}</span>
                  </div>

                  <p className="mt-5 text-sm font-semibold text-red-600">
                    Подробнее →
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}