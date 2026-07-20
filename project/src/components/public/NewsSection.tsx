import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { news } from '../../data/mockData';

export default function NewsSection() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-red-600 text-sm font-semibold mb-2">Медиацентр</p>
            <h2 className="section-title">Жизнь школы</h2>
          </div>
          <Link to="/news" className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors inline-flex items-center gap-1">
            Все, что вы пропустили <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <article key={item.id} className="card overflow-hidden group cursor-pointer">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-400">{item.date}</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.excerpt}</p>
                <span className="text-sm font-medium text-red-600 inline-flex items-center gap-1">
                  Читать далее <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
