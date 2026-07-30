import {
  useState,
  type FormEvent,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Youtube,
} from 'lucide-react';

import {
  sendContactMessage,
} from '../../api/contactApi';

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
    address:
      'г. Краснодар, ул. имени Валерия Гассия, 2',
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
    address:
      'г. Краснодар, ул. Сормовская, 163/1',
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
    href:
      'https://www.youtube.com/@itprogerkrd',
    icon: Youtube,
  },
];

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  branch: string;
  message: string;
  website: string;
}

const initialFormData: ContactFormData = {
  name: '',
  phone: '',
  email: '',
  branch: '',
  message: '',
  website: '',
};

export default function Contacts() {
  const [formData, setFormData] =
    useState<ContactFormData>(
      initialFormData
    );

  const [isSubmitted, setIsSubmitted] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await sendContactMessage({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        branch: formData.branch.trim(),
        message: formData.message.trim(),
        website: formData.website,
      });

      setFormData(initialFormData);
      setIsSubmitted(true);

      window.setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error(
        'Ошибка отправки контактной формы:',
        error
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Не удалось отправить сообщение'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="bg-gray-50 pb-14 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm font-semibold text-red-600">
            Контакты
          </p>

          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Свяжитесь с нами
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-gray-500">
            Ответим на ваши вопросы, поможем выбрать
            направление и подскажем ближайший филиал
            Высшей школы программирования.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ContactCard
              icon={Phone}
              label="Телефон"
              value="+7 (861) 000-00-00"
              href="tel:+78610000000"
            />

            <ContactCard
              icon={Mail}
              label="Электронная почта"
              value="lev_sosedov@mail.ru"
              href="mailto:lev_sosedov@mail.ru"
            />

            <ContactCard
              icon={Clock3}
              label="Часы работы"
              value="Вт–Вс: 10:00–21:00"
            />
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="mb-2 text-sm font-semibold text-red-600">
              Наши филиалы
            </p>

            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Выберите удобный адрес
            </h2>

            <p className="leading-relaxed text-gray-500">
              Обучение проходит в пяти филиалах
              Краснодара. Перед посещением рекомендуем
              уточнить расписание и наличие мест.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {branches.map(
              (branch, index) => (
                <article
                  key={branch.id}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                      <MapPin className="h-6 w-6 text-red-600" />
                    </div>

                    <span className="text-xs font-semibold text-gray-400">
                      Филиал {index + 1}
                    </span>
                  </div>

                  <div className="mb-6 space-y-3">
                    <p className="text-sm leading-relaxed text-gray-500">
                      {branch.address}
                    </p>

                    <a
                      href={`tel:${branch.phoneHref}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-red-600"
                    >
                      <Phone className="h-4 w-4 text-red-600" />
                      {branch.phone}
                    </a>
                  </div>

                  <a
                    href={`https://yandex.ru/maps/?text=${encodeURIComponent(
                      branch.address
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
                  >
                    Открыть на карте
                    <MapPin className="h-4 w-4" />
                  </a>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-red-600">
                Мы на связи
              </p>

              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Напишите или позвоните
              </h2>

              <p className="mb-8 max-w-xl leading-relaxed text-gray-500">
                Расскажем о программах, возрасте
                поступления, расписании, стоимости
                обучения и свободных местах.
              </p>

              <div className="mb-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-gray-600">
                    Поможем подобрать программу по
                    возрасту и интересам.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-gray-600">
                    Подскажем ближайший филиал и
                    актуальное расписание.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-gray-600">
                    Запишем на консультацию или
                    знакомство со школой.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-4 text-sm font-semibold text-gray-900">
                  Мы в социальных сетях
                </p>

                <div className="flex flex-wrap gap-3">
                  {socialLinks.map(
                    (social) => {
                      const Icon =
                        social.icon;

                      return (
                        <a
                          key={social.id}
                          href={social.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-red-200 hover:text-red-600"
                        >
                          <Icon className="h-4 w-4" />
                          {social.name}
                        </a>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              {isSubmitted ? (
                <div className="py-14 text-center">
                  <CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-red-600" />
                  <h2 className="mb-3 text-2xl font-bold text-gray-900">
                    Сообщение отправлено
                  </h2>
                  <p className="text-gray-500">
                    Заявка отправлена на почту
                    администратора. Мы скоро свяжемся
                    с вами.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">
                    Напишите нам
                  </h2>

                  <p className="mb-7 text-sm text-gray-500">
                    Заполните форму, и администратор
                    свяжется с вами.
                  </p>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        id="contact-name"
                        label="Имя"
                        type="text"
                        value={formData.name}
                        placeholder="Ваше имя"
                        autoComplete="name"
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
                        autoComplete="tel"
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
                      autoComplete="email"
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
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Филиал
                      </label>

                      <select
                        id="contact-branch"
                        required
                        value={formData.branch}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            branch:
                              event.target
                                .value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">
                          Выберите филиал
                        </option>

                        {branches.map(
                          (branch) => (
                            <option
                              key={branch.id}
                              value={
                                branch.name
                              }
                            >
                              {branch.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Сообщение
                      </label>

                      <textarea
                        id="contact-message"
                        required
                        minLength={5}
                        maxLength={5000}
                        rows={5}
                        value={
                          formData.message
                        }
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            message:
                              event.target
                                .value,
                          })
                        }
                        placeholder="Напишите ваш вопрос"
                        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      />
                    </div>

                    <div
                      className="hidden"
                      aria-hidden="true"
                    >
                      <label htmlFor="contact-website">
                        Ваш сайт
                      </label>
                      <input
                        id="contact-website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formData.website}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            website:
                              event.target
                                .value,
                          })
                        }
                      />
                    </div>

                    {submitError && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                        <p className="text-sm text-red-700">
                          {submitError}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                    >
                      {isSubmitting ? (
                        <>
                          Отправляем...
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          Отправить
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <p className="text-xs leading-relaxed text-gray-400">
                      Нажимая кнопку «Отправить», вы
                      соглашаетесь с политикой обработки
                      персональных данных.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-red-600">
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
              className="h-[420px] w-full border-0"
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
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
        <Icon className="h-5 w-5 text-red-600" />
      </div>

      <div>
        <p className="mb-1 text-xs text-gray-400">
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
        className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-colors hover:border-red-200"
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
  autoComplete?: string;
  onChange: (value: string) => void;
}

function FormField({
  id,
  label,
  type,
  value,
  placeholder,
  autoComplete,
  onChange,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        required
        minLength={2}
        maxLength={200}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
      />
    </div>
  );
}
