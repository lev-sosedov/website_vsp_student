import { Link } from 'react-router-dom';
import { GraduationCap, Phone, Mail, MapPin } from 'lucide-react';

const footerNav = [
  { to: '/about', label: 'О школе' },
  { to: '/programs', label: 'Программы' },
  { to: '/questions', label: 'Вопросы' },
  { to: '/news', label: 'Новости' },
  { to: '/reviews', label: 'Отзывы' },
  { to: '/contacts', label: 'Контакты' },
];

const documentLinks = [
  { to: '/privacy', label: 'Политика конфиденциальности' },
  { to: '/terms', label: 'Пользовательское соглашение' },
  { to: '/personal-data', label: 'Обработка персональных данных' },
  { to: '/license', label: 'Лицензия на образовательную деятельность' }
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* О школе */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>

              <span className="font-bold text-lg text-gray-900">
                ВШП Студент
              </span>
            </Link>

            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Современная школа программирования с практикой и реальными
              проектами.
            </p>
          </div>

          {/* Навигация */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Навигация
            </h4>

            <ul className="space-y-2.5">
              {footerNav.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Контакты
            </h4>

            <ul className="space-y-2.5 text-sm text-gray-500">
              <li>
                <a
                  href="tel:+78610000000"
                  className="flex items-center gap-2 hover:text-red-600 transition-colors"
                >
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>+7 (988) 199-75-59</span>
                </a>
              </li>

              <li>
                <a
                  href="mailto:nochu-cit@mail.ru"
                  className="flex items-center gap-2 hover:text-red-600 transition-colors"
                >
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>nochu-cit@mail.ru</span>
                </a>
              </li>

              <li>
                <Link
                  to="/contacts"
                  className="flex items-start gap-2 hover:text-red-600 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>г. Краснодар, ул. Базовская, 254</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Документы */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Документы
            </h4>

            <ul className="space-y-2.5">
              {documentLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 text-center sm:text-left">
            © 2011–2026 Высшая школа программирования. Все права защищены.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://vk.ru/school_programmistov"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gray-400 hover:text-red-600 transition-colors"
            >
              ВКонтакте
            </a>

            <a
              href="https://t.me/it_proger_com"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gray-400 hover:text-red-600 transition-colors"
            >
              Телеграм
            </a>

                      
            <a
              href="https://www.youtube.com/@itprogerkrd"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gray-400 hover:text-red-600 transition-colors"
            >
              YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}