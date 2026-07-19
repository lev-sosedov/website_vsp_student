import * as Icons from 'lucide-react';
import { whyChooseUs } from '../../data/mockData';

export default function WhyChooseUs() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-red-600 text-sm font-semibold mb-2">Почему выбирают нас</p>
          <h2 className="section-title mb-4">Преимущества обучения в ВШП</h2>
          <p className="section-subtitle">
            Мы создаём среду, в которой студенты растут и достигают реальных результатов.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {whyChooseUs.map((item, i) => {
            const Icon = (Icons as any)[item.icon] || Icons.Star;
            return (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-base text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
