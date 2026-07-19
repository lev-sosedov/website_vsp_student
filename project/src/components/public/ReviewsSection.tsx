import { Star } from 'lucide-react';
import { reviews } from '../../data/mockData';

export default function ReviewsSection() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-red-600 text-sm font-semibold mb-2">Отзывы выпускников</p>
          <h2 className="section-title mb-4">Истории успеха наших выпускников</h2>
          <p className="section-subtitle">
            Реальные результаты студентов, которые изменили свою карьеру благодаря обучению в ВШП.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-red-500 text-red-500" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 text-sm">"{review.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <img src={review.photo} alt={review.name} className="w-11 h-11 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-400">{review.course}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
