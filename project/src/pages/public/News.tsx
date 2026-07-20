import { useState } from 'react';
import { news } from '../../data/mockData';

const allNews = [
  ...news,
  {
    id: 4,
    title: 'Открыт новый филиал в Астане',
    category: 'Новости школы',
    date: '28 декабря 2025',
    image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'Пятый филиал ВШП открыл свои двери для студентов в столице. Современные классы и лаборатории.',
  },
  {
    id: 5,
    title: 'Стартовал сезон IT-встреч',
    category: 'События',
    date: '20 декабря 2025',
    image: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'Еженедельные встречи с приглашёнными спикерами из индустрии — стартуем серию открытых лекций.',
  },
  {
    id: 6,
    title: 'Выпуск 2025: 340 дипломов вручено',
    category: 'Образование',
    date: '15 декабря 2025',
    image: 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'Торжественная церемония вручения сертификатов прошла в большом зале. Поздравляем выпускников!',
  },
];

const categories = ['Все', 'Образование', 'События', 'Новости школы'];

export default function News() {
  const [active, setActive] = useState('Все');
  const filtered = active === 'Все' ? allNews : allNews.filter((n) => n.category === active);

  return (
    <>
      <section className="pt-32 pb-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 text-sm font-semibold mb-2">Медиацентр</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Жизнь школы</h1>
          <p className="text-lg text-gray-500 max-w-2xl">Всё, что вы пропустили: события, достижения, проекты 
            студентов и важные новости Высшей школы программирования.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  active === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
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
                  <p className="text-sm text-gray-500 leading-relaxed">{item.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
