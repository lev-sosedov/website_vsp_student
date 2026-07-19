import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { teachers } from '../../data/mockData';

export default function TeachersSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-red-600 text-sm font-semibold mb-2">Преподаватели</p>
            <h2 className="section-title">Учитесь у практиков</h2>
          </div>
          <Link to="/teachers" className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors inline-flex items-center gap-1">
            Наша команда <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.slice(0, 3).map((teacher) => (
            <div key={teacher.id} className="card overflow-hidden group">
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src={teacher.photo}
                  alt={teacher.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{teacher.name}</h3>
                <p className="text-sm text-red-600 font-medium mb-1">{teacher.specialization}</p>
                <p className="text-xs text-gray-400 mb-4">{teacher.experience}</p>
                <div className="flex flex-wrap gap-1.5">
                  {teacher.technologies.map((tech) => (
                    <span key={tech} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
