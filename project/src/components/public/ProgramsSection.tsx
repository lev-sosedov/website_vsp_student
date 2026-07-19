import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { programs } from '../../data/public/programsData';
import { ArrowRight } from 'lucide-react';

export default function ProgramsSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-red-600 text-sm font-semibold mb-2">Программы обучения</p>
          <h2 className="section-title mb-4">Выберите направление</h2>
          <p className="section-subtitle">
            Современные программы, разработанные вместе с практикующими специалистами из IT-индустрии.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {programs.map((program) => {
            const Icon = (Icons as any)[program.icon] || Icons.Code2;
            return (
              <div
                key={program.id}
                className="card p-6 group hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              >
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-200">
                  <Icon className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{program.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{program.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{program.duration}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{program.level}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link to="/programs" className="btn-primary">
            Подробнее о направлениях <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
