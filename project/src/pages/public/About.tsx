import {
  BookOpenCheck,
  CheckCircle2,
  Code2,
  Target,
} from 'lucide-react';
import { stats } from '../../data/public/statsData';
import { aboutData } from '../../data/public/aboutData';
import aboutSchoolImage from '../../assets/images/about/about-school.webp';

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-red-600 text-sm font-semibold mb-2">
              {aboutData.eyebrow}
            </p>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
              {aboutData.title}
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed">
              {aboutData.description}
            </p>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-red-600">
                  {stat.value}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src={aboutSchoolImage}
                alt="Высшая школа программирования"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                {aboutData.missionTitle}
              </h2>

              <p className="text-gray-500 leading-relaxed mb-6">
                {aboutData.missionText}
              </p>

              <ul className="space-y-3">
                {aboutData.missionFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0" />

                    <span className="text-gray-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      {/* Learning approach */}
      <section className="border-t border-gray-100 bg-gray-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
              «От простого к сложному»
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-gray-500">
              Мы обучаем с нуля. От учащегося потребуется вовлеченность
              в учебный процесс, жажда знаний, упорство и готовность
              учиться.
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-700">
              Обучаем детей 10+ / подростков и взрослых.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm sm:p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <BookOpenCheck className="h-6 w-6" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                Теория / база
              </h3>

              <div className="mt-6 space-y-5 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                <p>
                  <strong className="font-semibold text-gray-800">
                    Закрепление теории:
                  </strong>{' '}
                  применение полученных знаний на практике, помогает
                  глубже понять материал и закрепить теорию. Это
                  особенно важно в наших дисциплинах, где теория тесно
                  связана с реальными действиями на практике.
                </p>

                <p>
                  <strong className="font-semibold text-gray-800">
                    Развитие навыков:
                  </strong>{' '}
                  на практических занятиях вы разовьете навыки,
                  необходимые для будущей профессиональной
                  деятельности.
                </p>

                <ul className="space-y-2">
                  {[
                    'Коммуникация и эффективное общение',
                    'Технические навыки',
                    'Креативность и инновационное мышление',
                    'Гибкость и адаптивность',
                    'Управление временем и приоритизация задач',
                    'Тимбилдинг и работа в команде',
                    'Умение обучаться и развиваться и многие другие',
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm sm:p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Code2 className="h-6 w-6" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                Практика / hard
              </h3>

              <div className="mt-6 space-y-5 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                <p>
                  <strong className="font-semibold text-gray-800">
                    Формирование опыта:
                  </strong>{' '}
                  через огромное количество практических кейсов,
                  которые войдут в ваше портфолио, вы так же получите
                  колоссальный опыт работы в реальных условиях, что
                  подготовит вас как высококлассного специалиста в
                  выбранной профессии. Вы научитесь решать задачи,
                  возникающие в реальной жизни, и находить
                  нестандартные решения.
                </p>

                <p>
                  <strong className="font-semibold text-gray-800">
                    Повышение мотивации:
                  </strong>{' '}
                  вы будете видеть урок за уроком результаты своей
                  работы и понимать, как вы можете применить свои
                  знания на практике, как следствие это так же будет
                  повышать вашу мотивацию к обучению. Благодаря этому
                  учебный процесс станет более интересным и
                  увлекательным.
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm sm:p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Target className="h-6 w-6" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                Навык / результат
              </h3>

              <div className="mt-6 space-y-5 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                <p>
                  <strong className="font-semibold text-gray-800">
                    Оценка прогресса:
                  </strong>{' '}
                  в процессе обучения у вас будут проходить
                  контрольные срезы, вы будете сдавать зачеты и
                  экзамены, писать и готовиться к защите курсовых
                  проектов (практических кейсов). Это позволяет
                  выявлять пробелы в знаниях и корректировать процесс
                  освоения материала — для нас важно качество того
                  образования, которое вы получите по окончанию нашей
                  школы. Каждый выпускник — это наша гордость!
                </p>

                <p>
                  <strong className="font-semibold text-gray-800">
                    Командная работа:
                  </strong>{' '}
                  многие практические задания выполняются в группах,
                  что развивает навыки командной работы, коммуникации
                  и сотрудничества. Эти навыки важны в любой сфере
                  деятельности.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}