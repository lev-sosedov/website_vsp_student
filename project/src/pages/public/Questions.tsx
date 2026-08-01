import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface QuestionItem {
  question: string;
  answer: string;
}

const questions: QuestionItem[] = [
  {
    question: 'Кто преподает?',
    answer:
      'Коллектив нашей школы ведет активную жизнь в сфере IT. Мы постоянные гости, эксперты, участники и спикеры различных мероприятий! Деловые контакты и дружба с компаниями — взаимовыгодное сотрудничество: благодаря этому мы можем направлять своих выпускников нашим партнерам для комплектации штата их компаний классными IT-специалистами. Штат менторов ВШП — это айтишники с опытом и педагогическим талантом. Они специалисты в своих направлениях и не являются совместителями, имеют профильное высшее образование и на каждом этапе являются надежными наставниками своих учеников.',
  },
  {
    question: 'Что получает выпускник?',
    answer:
      'ДИПЛОМ о дополнительном образовании, выписку к диплому с перечнем дисциплин и стека технологий, который выпускник освоил за время учебы. А еще ВШП выдает международный документ об образовании, который сопровождает выпускника: к диплому прилагается резюме, портфолио и многое другое. Деловые контакты и дружба с компаниями — взаимовыгодное сотрудничество: благодаря этому мы можем направлять своих выпускников нашим партнерам для комплектации штата их компаний классными IT-специалистами.',
  },
  {
    question: 'Кто может стать учащимся?',
    answer:
      'Мы обучаем детей с 9 лет, молодежь и взрослых. У нас есть разные формы, сроки, программы и группы для обучения. Чтобы понять, что подойдет именно вам, приглашаем на собеседование — это живая встреча со специалистом школы, на которой вам подберут подходящие варианты обучения. Помимо встречи в одном из наших учебных корпусов, вы всегда можете позвонить или написать и получить полную консультацию и все ответы на вопросы.',
  },
  {
    question: 'Могут ли выпускники сразу работать?',
    answer:
      'Это наша основная цель — учить так, чтобы после окончания наши выпускники могли трудоустроиться и получить востребованную и высокооплачиваемую работу! В учебной программе предусмотрен и блок по стратегии профессионального роста, на котором выпускника полностью готовят к собеседованию и будущей карьере.',
  },
];

export default function Questions() {
  const [openedQuestions, setOpenedQuestions] = useState<Set<number>>(
    () => new Set()
  );

  const toggleQuestion = (questionIndex: number) => {
    setOpenedQuestions((currentQuestions) => {
      const nextQuestions = new Set(currentQuestions);

      if (nextQuestions.has(questionIndex)) {
        nextQuestions.delete(questionIndex);
      } else {
        nextQuestions.add(questionIndex);
      }

      return nextQuestions;
    });
  };

  return (
    <>
      {/* Заголовок в общем стиле публичного сайта */}
      <section className="bg-gray-50 pb-12 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm font-semibold text-red-600">
            Вопросы
          </p>

          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Важные вопросы и ответы
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-gray-500">
            Чтобы поступить в ВШП, необходимо пройти собеседование
            или тестирование, заключить договор и приступить к
            занятиям.
          </p>
        </div>
      </section>

      {/* Список вопросов */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {questions.map((item, index) => {
              const isOpened = openedQuestions.has(index);
              const answerId = `question-answer-${index}`;

              return (
                <article
                  key={item.question}
                  className={
                    index === questions.length - 1
                      ? ''
                      : 'border-b border-gray-100'
                  }
                >
                  <button
                    type="button"
                    onClick={() => toggleQuestion(index)}
                    aria-expanded={isOpened}
                    aria-controls={answerId}
                    className="group flex w-full items-center justify-between gap-6 px-6 py-6 text-left transition-colors hover:bg-gray-50 sm:px-8 sm:py-7"
                  >
                    <span className="text-lg font-bold text-gray-900 sm:text-xl">
                      {item.question}
                    </span>

                    <span
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                        isOpened
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 text-red-600 group-hover:bg-red-100'
                      }`}
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-300 ${
                          isOpened ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>

                  <div
                    id={answerId}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                      isOpened
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-7 text-base leading-7 text-gray-600 sm:px-8 sm:pb-8 sm:text-lg sm:leading-8">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
