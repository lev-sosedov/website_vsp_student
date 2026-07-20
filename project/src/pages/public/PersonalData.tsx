import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SITE_URL = 'https://it-proger.com';
const CONTACT_EMAIL = 'nochu-cit@mail.ru';

const personalDataList = [
  'фамилия, имя и отчество',
  'номер телефона',
  'адрес электронной почты',
  'сведения о выбранной программе обучения',
  'сведения о выбранном филиале',
  'данные, указанные в формах обратной связи',
  'данные учётной записи и профиля пользователя',
  'IP-адрес, cookie-файлы и обезличенная техническая информация',
];

const actions = [
  'сбор',
  'запись',
  'систематизация',
  'накопление',
  'хранение',
  'уточнение и обновление',
  'извлечение',
  'использование',
  'предоставление доступа уполномоченным лицам',
  'обезличивание',
  'блокирование',
  'удаление',
  'уничтожение',
];

const purposes = [
  'обработка заявок и обращений',
  'регистрация пользователя на сайте',
  'создание и обслуживание личного кабинета',
  'организация образовательного процесса',
  'предоставление доступа к учебным материалам',
  'информирование о расписании, занятиях и мероприятиях',
  'связь с пользователем или его законным представителем',
  'улучшение качества работы сайта и образовательных сервисов',
];

export default function PersonalData() {
  return (
    <>
      <section className="pt-32 pb-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 text-sm font-semibold mb-2">
            Правовая информация
          </p>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Согласие на обработку персональных данных
          </h1>

          <p className="text-lg text-gray-500 max-w-3xl leading-relaxed">
            Условия предоставления и обработки персональных данных
            пользователей сайта Высшей школы программирования.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться на главную
          </Link>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                1. Предоставление согласия
              </h2>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Я свободно, своей волей и в своём интересе даю согласие
                  индивидуальному предпринимателю Бояркину Анатолию
                  Анатольевичу, ЧУЗДО «Высшая школа программирования»,
                  ИНН 753600712013, ОГРН 319237500024062, на обработку
                  моих персональных данных.
                </p>

                <p>
                  Согласие распространяется на персональные данные,
                  переданные через сайт {SITE_URL}, формы обратной связи,
                  личный кабинет, заявления и другие средства связи со
                  школой.
                </p>

                <p>
                  Согласие является конкретным, предметным,
                  информированным, сознательным и однозначным.
                </p>
              </div>
            </section>

            <ListSection
              title="2. Перечень персональных данных"
              items={personalDataList}
            />

            <ListSection
              title="3. Цели обработки"
              items={purposes}
            />

            <ListSection
              title="4. Действия с персональными данными"
              items={actions}
            />

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                5. Способы обработки
              </h2>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Обработка персональных данных может осуществляться
                  автоматизированным и неавтоматизированным способами.
                </p>

                <p>
                  Доступ к данным может предоставляться сотрудникам и
                  уполномоченным представителям Оператора только в объёме,
                  необходимом для исполнения их обязанностей.
                </p>

                <p>
                  Передача персональных данных третьим лицам допускается
                  при наличии согласия субъекта или иного законного
                  основания.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                6. Данные несовершеннолетнего
              </h2>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Если через сайт передаются персональные данные
                  несовершеннолетнего, согласие предоставляет его законный
                  представитель: родитель, усыновитель, опекун или
                  попечитель.
                </p>

                <p>
                  Законный представитель подтверждает достоверность
                  передаваемых данных и наличие полномочий на их
                  предоставление.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                7. Срок действия согласия
              </h2>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Согласие действует в течение срока, необходимого для
                  достижения целей обработки персональных данных, либо до
                  момента его отзыва субъектом персональных данных.
                </p>

                <p>
                  Если для отдельных образовательных или консультационных
                  программ установлен срок действия согласия, он может
                  составлять три года с даты его предоставления.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                8. Отзыв согласия
              </h2>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Пользователь вправе в любой момент отозвать согласие,
                  направив Оператору письменное обращение.
                </p>

                <p>
                  Обращение можно направить по адресу электронной почты{' '}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="font-medium text-red-600 hover:text-red-700"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>

                <p>
                  Отзыв согласия может привести к прекращению доступа к
                  функциям сайта или образовательным сервисам, для работы
                  которых обработка данных объективно необходима.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                9. Подтверждение пользователя
              </h2>

              <div className="rounded-2xl bg-gray-50 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />

                  <p className="text-gray-600 leading-relaxed">
                    Устанавливая отдельную отметку в поле согласия под
                    формой сайта, пользователь подтверждает, что прочитал
                    настоящий документ, понимает его содержание и
                    добровольно соглашается на обработку указанных данных.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              Последнее обновление: июль 2026 года
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

interface ListSectionProps {
  title: string;
  items: string[];
}

function ListSection({ title, items }: ListSectionProps) {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
        {title}
      </h2>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

            <span className="text-gray-600 leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}