import { FormEvent, useState } from 'react';
import {CheckCircle2, Clock3, Mail, MapPin, MessageCircle, Phone, Send, Youtube,} from 'lucide-react';

const branches = [
  {
    id: 1,
    name: 'Центральный филиал',
    address: 'г. Краснодар, ул. Базовская, 254',
    phone: '+7 (988) 199-75-59',
    phoneHref: '+79881997559',
  },
  {
    id: 2,
    name: 'Филиал Фестивальный',
    address: 'г. Краснодар, ул. имени Валерия Гассия, 2',
    phone: '+7 (958) 609-27-74',
    phoneHref: '+79586092774',
  },
  {
    id: 3,
    name: 'Филиал Юбилейный',
    address: 'г. Краснодар, ул. Монтажников, 2',
    phone: '+7 (988) 199-75-59',
    phoneHref: '+79881997559',
  },
  {
    id: 4,
    name: 'Филиал Гидростроителей',
    address: 'г. Краснодар, ул. Зиповская, 31',
    phone: '+7 (958) 609-18-74',
    phoneHref: '+79586091874',
  },
  {
    id: 5,
    name: 'Филиал Комсомольский',
    address: 'г. Краснодар, ул. Сормовская, 163/1',
        phone: '+7 (988) 199-75-59',
    phoneHref: '+79881997559',
  },
];

const socialLinks = [
  {
    id: 1,
    name: 'ВКонтакте',
    href: 'https://vk.ru/school_programmistov',
    icon: MessageCircle,
  },
  {
    id: 2,
    name: 'Telegram',
    href: 'https://t.me/it_proger_com',
    icon: Send,
  },
  {
    id: 3,
    name: 'YouTube',
    href: 'https://www.youtube.com/@itprogerkrd',
    icon: Youtube,
  },
];

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  branch: string;
  message: string;
}

const initialFormData: ContactFormData = {
  name: '',
  phone: '',
  email: '',
  branch: '',
  message: '',
};

export default function Contacts() {
  const [formData, setFormData] =
    useState<ContactFormData>(initialFormData);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitted(true);

    window.setTimeout(() => {
      setIsSubmitted(false);
      setFormData(initialFormData);
    }, 2500);
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 text-sm font-semibold mb-2">
            Контакты
          </p>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Свяжитесь с нами
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
            Ответим на ваши вопросы, поможем выбрать направление
            и подскажем ближайший филиал Высшей школы программирования.
          </p>
        </div>
      </section>

      {/* Main contacts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ContactCard
              icon={Phone}
              label="Телефон"
              value="+7 (861) 000-00-00"
              href="tel:+78610000000"
            />

            <ContactCard
              icon={Mail}
              label="Электронная почта"
              value="info@vsp-school.ru"
              href="mailto:info@vsp-school.ru"
            />

            <ContactCard
              icon={Clock3}
              label="Часы работы"
              value="Вт–Вс: 10:00–21:00"
            />
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-red-600 text-sm font-semibold mb-2">
              Наши филиалы
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Выберите удобный адрес
            </h2>

            <p className="text-gray-500 leading-relaxed">
              Обучение проходит в пяти филиалах Краснодара.
              Перед посещением рекомендуем уточнить расписание и наличие мест.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {branches.map((branch, index) => (
              <article
                key={branch.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>

                  <span className="text-xs font-semibold text-gray-400">
                    Филиал {index + 1}
                  </span>
                </div>

  <div className="space-y-3 mb-6">
    <p className="text-sm text-gray-500 leading-relaxed">
      {branch.address}
    </p>

    <a
      href={`tel:${branch.phoneHref}`}
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
    >
      <Phone className="w-4 h-4 text-red-600" />
      {branch.phone}
    </a>
  </div>

                <a
                  href={`https://yandex.ru/maps/?text=${encodeURIComponent(
                    branch.address,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  Открыть на карте
                  <MapPin className="w-4 h-4" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Social + form */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-red-600 text-sm font-semibold mb-2">
                Мы на связи
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Напишите или позвоните
              </h2>

              <p className="text-gray-500 leading-relaxed mb-8 max-w-xl">
                Расскажем о программах, возрасте поступления,
                расписании, стоимости обучения и свободных местах.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    Поможем подобрать программу по возрасту и интересам.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    Подскажем ближайший филиал и актуальное расписание.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    Запишем на консультацию или знакомство со школой.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Мы в социальных сетях
                </p>

                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;

                    return (
                      <a
                        key={social.id}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-red-200 hover:text-red-600 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        {social.name}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              {isSubmitted ? (
                <div className="py-14 text-center">
                  <CheckCircle2 className="w-14 h-14 text-red-600 mx-auto mb-5" />

                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Сообщение отправлено
                  </h2>

                  <p className="text-gray-500">
                    Мы получили вашу заявку и скоро свяжемся с вами.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Напишите нам
                  </h2>

                  <p className="text-sm text-gray-500 mb-7">
                    Заполните форму, и администратор свяжется с вами.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        id="contact-name"
                        label="Имя"
                        type="text"
                        value={formData.name}
                        placeholder="Ваше имя"
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            name: value,
                          })
                        }
                      />

                      <FormField
                        id="contact-phone"
                        label="Телефон"
                        type="tel"
                        value={formData.phone}
                        placeholder="+7 (___) ___-__-__"
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            phone: value,
                          })
                        }
                      />
                    </div>

                    <FormField
                      id="contact-email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      placeholder="example@mail.ru"
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          email: value,
                        })
                      }
                    />

                    <div>
                      <label
                        htmlFor="contact-branch"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Филиал
                      </label>

                      <select
                        id="contact-branch"
                        value={formData.branch}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            branch: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">
                          Выберите филиал
                        </option>

                        {branches.map((branch) => (
                          <option
                            key={branch.id}
                            value={branch.name}
                          >
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Сообщение
                      </label>

                      <textarea
                        id="contact-message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            message: event.target.value,
                          })
                        }
                        placeholder="Напишите ваш вопрос"
                        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                    >
                      Отправить
                      <Send className="w-4 h-4" />
                    </button>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      Нажимая кнопку «Отправить», вы соглашаетесь
                      с политикой обработки персональных данных.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-red-600 text-sm font-semibold mb-2">
              Карта филиалов
            </p>

            <h2 className="text-3xl font-bold text-gray-900">
              Найдите ближайшую школу
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
            <iframe
              title="Филиалы Высшей школы программирования"
              src="https://yandex.ru/map-widget/v1/?ll=38.976481%2C45.035470&z=11"
              className="w-full h-[420px] border-0"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </>
  );
}

interface ContactCardProps {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
}: ContactCardProps) {
  const content = (
    <>
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-red-600" />
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-1">
          {label}
        </p>

        <p className="font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-red-200 transition-colors"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {content}
    </div>
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel';
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

function FormField({
  id,
  label,
  type,
  value,
  placeholder,
  onChange,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
      />
    </div>
  );
}