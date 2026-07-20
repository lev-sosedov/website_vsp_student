import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Download,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LICENSE_DOWNLOAD_URL =
  'https://islod.obrnadzor.gov.ru/extract/1677?';

const licenseDetails = [
  {
    label: 'Статус лицензии',
    value: 'Действующая',
    icon: BadgeCheck,
    highlight: true,
  },
  {
    label: 'Регистрационный номер',
    value: 'Л035-01218-23/00243693',
    icon: FileCheck2,
  },
  {
    label: 'Дата предоставления',
    value: '28 ноября 2019 года',
    icon: CalendarDays,
  },
  {
    label: 'Решение о предоставлении',
    value: 'Приказ № 4863 от 28 ноября 2019 года',
    icon: FileCheck2,
  },
  {
    label: 'Срок действия',
    value: 'Бессрочная',
    icon: ShieldCheck,
  },
  {
    label: 'Субъект Российской Федерации',
    value: 'Краснодарский край',
    icon: MapPin,
  },
];

export default function License() {
  return (
    <>
      {/* Первый экран */}
      <section className="pt-32 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 text-sm font-semibold mb-3">
            Правовая информация
          </p>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5">
                Лицензия на образовательную деятельность
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed">
                Высшая школа программирования осуществляет образовательную
                деятельность на основании действующей государственной
                лицензии.
              </p>
            </div>

            <a
              href={LICENSE_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex-shrink-0"
            >
              <Download className="w-5 h-5" />
              Скачать реестровую выписку
            </a>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться на главную
          </Link>

          {/* Статус */}
          <div className="rounded-3xl bg-gray-900 text-white p-7 md:p-10 mb-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/15 text-green-300 rounded-full text-sm font-semibold mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Лицензия действует
                </div>

                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Дополнительное образование детей и взрослых
                </h2>

                <p className="text-gray-300 leading-relaxed max-w-3xl">
                  Лицензия предоставляет право осуществлять образовательную
                  деятельность по реализации программ дополнительного
                  образования детей и взрослых.
                </p>
              </div>
            </div>
          </div>

          {/* Основные реквизиты */}
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5 text-red-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-600">
                  Официальные сведения
                </p>

                <h2 className="text-2xl font-bold text-gray-900">
                  Реквизиты лицензии
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {licenseDetails.map((detail) => {
                const Icon = detail.icon;

                return (
                  <div
                    key={detail.label}
                    className={`rounded-2xl border p-5 ${
                      detail.highlight
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          detail.highlight
                            ? 'bg-green-100'
                            : 'bg-gray-50'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            detail.highlight
                              ? 'text-green-600'
                              : 'text-gray-500'
                          }`}
                        />
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {detail.label}
                        </p>

                        <p className="font-semibold text-gray-900 leading-relaxed">
                          {detail.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Лицензиат */}
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-red-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-600">
                  Об образовательной организации
                </p>

                <h2 className="text-2xl font-bold text-gray-900">
                  Сведения о лицензиате
                </h2>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <InfoRow
                label="Полное наименование"
                value="Индивидуальный предприниматель Бояркин Анатолий Анатольевич"
              />

              <InfoRow
                label="ОГРН"
                value="319237500024062"
              />

              <InfoRow
                label="ИНН"
                value="753600712013"
              />

              <InfoRow
                label="Лицензирующий орган"
                value="Министерство образования, науки и молодёжной политики Краснодарского края"
              />

              <InfoRow
                label="Место нахождения"
                value="350908, Россия, Краснодарский край, г. Краснодар, Старокорсунская станица, улица Сливовая, 809, СНТ «Железнодорожник-3»"
                last
              />
            </div>
          </section>

          {/* Место образовательной деятельности */}
          <section className="mb-14">
            <div className="rounded-3xl bg-gray-50 p-7 md:p-9">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MapPin className="w-6 h-6 text-red-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2">
                    Адрес осуществления образовательной деятельности
                  </p>

                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    Центральный филиал
                  </h2>

                  <p className="text-gray-600 leading-relaxed">
                    Краснодарский край, г. Краснодар, Центральный
                    внутригородской округ, ул. Базовская/Промышленная,
                    д. 254/54, помещения 10, 11, 12, второй этаж,
                    нежилые помещения № 12/1, 12/3, 12/4.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Вид деятельности */}
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-red-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-600">
                  Разрешённая деятельность
                </p>

                <h2 className="text-2xl font-bold text-gray-900">
                  Вид образования
                </h2>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-6 md:p-8">
              <p className="text-sm text-gray-500 mb-2">
                Вид образования
              </p>

              <p className="text-xl font-bold text-gray-900 mb-6">
                Дополнительное образование
              </p>

              <div className="h-px bg-gray-100 mb-6" />

              <p className="text-sm text-gray-500 mb-2">
                Подвид дополнительного образования
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl font-semibold">
                <BadgeCheck className="w-5 h-5" />
                Дополнительное образование детей и взрослых
              </div>
            </div>
          </section>

          {/* Проверка и скачивание */}
          <section className="rounded-3xl border border-gray-100 p-7 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Официальная реестровая выписка
                </h2>

                <p className="text-gray-500 leading-relaxed">
                  Для проверки актуальности сведений откройте официальную
                  выписку из государственного реестра лицензий. Документ
                  формируется информационной системой Рособрнадзора.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={LICENSE_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Скачать выписку
                </a>

                
              </div>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-400 leading-relaxed">
              Сведения приведены на основании выписки из реестра лицензий,
              сформированной 20 июля 2026 года. После формирования выписки
              в государственный реестр могли быть внесены изменения.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  last?: boolean;
}

function InfoRow({ label, value, last = false }: InfoRowProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-[240px_1fr] gap-2 md:gap-8 p-5 ${
        !last ? 'border-b border-gray-100' : ''
      }`}
    >
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="text-sm md:text-base font-medium text-gray-900 leading-relaxed">
        {value}
      </p>
    </div>
  );
}