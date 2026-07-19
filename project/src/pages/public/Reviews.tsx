import { Star } from 'lucide-react';
import { reviews } from '../../data/mockData';

const allReviews = [
  ...reviews,
  {
    id: 4,
    name: 'Артём Соколов',
    course: 'Python разработка',
    rating: 5,
    text: 'Отличная школа, сильная программа и поддержка. Python стал моим основным языком, сейчас работаю в data-команде.',
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 5,
    name: 'Камила Нурланова',
    course: 'Mobile Development',
    rating: 5,
    text: 'Училась на мобильной разработке. После выпуска выпустила два приложения в App Store. Спасибо преподавателям!',
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 6,
    name: 'Ербол Тлеугабылов',
    course: 'Game Development',
    rating: 4,
    text: 'Unity и C# преподаваются на высоком уровне. За год обучения выпустил свою первую инди-игру.',
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function Reviews() {
  return (
    <>
      <section className="pt-32 pb-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 text-sm font-semibold mb-2">Отзывы студентов</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Истории успеха</h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            Реальные отзывы наших студентов и выпускников о школе и программах обучения.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'fill-red-500 text-red-500' : 'text-gray-200'}`}
                    />
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
    </>
  );
}
