import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { useState } from 'react';

export default function Contacts() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <section className="pt-32 pb-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 text-sm font-semibold mb-2">Контакты</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Свяжитесь с нами</h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            Мы ответим на все ваши вопросы и поможем выбрать подходящую программу обучения.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { icon: MapPin, label: 'Адрес', value: 'Алматы, ул. Абая, 150' },
                { icon: Phone, label: 'Телефон', value: '+7 (727) 123-45-67' },
                { icon: Mail, label: 'Email', value: 'info@vshp.kz' },
                { icon: Clock, label: 'Часы работы', value: 'Пн–Сб: 9:00 – 20:00' },
              ].map((item, i) => (
                <div key={i} className="card p-5 flex items-start gap-4">
                  <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="font-semibold text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}

              <div className="card p-5">
                <p className="text-xs text-gray-400 mb-3">Мы в социальных сетях</p>
                <div className="flex gap-3">
                  {['Instagram', 'Telegram', 'YouTube', 'Facebook'].map((s) => (
                    <a key={s} href="#" className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      {s}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Напишите нам</h3>
              {sent ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Сообщение отправлено!</p>
                  <p className="text-sm text-gray-500">Мы свяжемся с вами в ближайшее время.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input className="input-field" placeholder="Имя" required />
                    <input className="input-field" type="email" placeholder="Email" required />
                  </div>
                  <input className="input-field" placeholder="Тема" />
                  <textarea className="input-field min-h-[120px] resize-none" placeholder="Сообщение" required />
                  <button type="submit" className="btn-primary w-full justify-center">
                    Отправить <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm min-h-[400px] bg-gray-100">
            <iframe
              title="Карта"
              src="https://www.openstreetmap.org/export/embed.html?bbox=76.85%2C43.22%2C76.95%2C43.27&layer=mapnik"
              className="w-full h-full min-h-[400px] border-0"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}
