import { FormEvent, useState } from 'react';
import {
  CheckCircle2,
  Play,
  Star,
  X,
} from 'lucide-react';
import { reviews } from '../../data/mockData';

const allReviews = [
  ...reviews,
  {
    id: 4,
    name: 'Артём Соколов',
    course: 'Python разработка',
    rating: 5,
    text: 'Отличная школа, сильная программа и поддержка. Python стал моим основным языком, сейчас работаю в data-команде.',
    photo:
      'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 5,
    name: 'Камила Нурланова',
    course: 'Mobile Development',
    rating: 5,
    text: 'Училась на мобильной разработке. После выпуска выпустила два приложения в App Store. Спасибо преподавателям!',
    photo:
      'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 6,
    name: 'Ербол Тлеугабылов',
    course: 'Game Development',
    rating: 4,
    text: 'Unity и C# преподаются на высоком уровне. За год обучения выпустил свою первую инди-игру.',
    photo:
      'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

const videoReviews = [
  {
    id: 1,
    name: 'Мария Ковалева',
    course: 'Web-разработка',
    duration: '2:34',
    cover:
      'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=900',
    videoUrl: 'https://vk.com/video_ext.php?oid=-1&id=1',
  },
  {
    id: 2,
    name: 'Алексей Воронов',
    course: 'Программная инженерия',
    duration: '3:12',
    cover:
      'https://images.pexels.com/photos/5212703/pexels-photo-5212703.jpeg?auto=compress&cs=tinysrgb&w=900',
    videoUrl: 'https://vk.com/video_ext.php?oid=-1&id=2',
  },
  {
    id: 3,
    name: 'Екатерина Белова',
    course: 'Графический дизайн и 3D',
    duration: '1:48',
    cover:
      'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=900',
    videoUrl: 'https://vk.com/video_ext.php?oid=-1&id=3',
  },
];

interface ReviewFormData {
  name: string;
  course: string;
  rating: number;
  text: string;
}

const initialFormData: ReviewFormData = {
  name: '',
  course: '',
  rating: 5,
  text: '',
};

export default function Reviews() {
  const [selectedVideo, setSelectedVideo] = useState<
    (typeof videoReviews)[number] | null
  >(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] =
    useState<ReviewFormData>(initialFormData);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitted(true);

    window.setTimeout(() => {
      setIsReviewModalOpen(false);
      setIsSubmitted(false);
      setFormData(initialFormData);
    }, 1800);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setIsSubmitted(false);
    setFormData(initialFormData);
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 text-sm font-semibold mb-2">
            Отзывы
          </p>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Что говорят о школе
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl">
            Истории студентов, выпускников и родителей о занятиях,
            преподавателях, проектах и результатах обучения.
          </p>
        </div>
      </section>

      {/* Text reviews */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allReviews.map((review) => (
              <article
                key={review.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`w-4 h-4 ${
                        index < review.rating
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                  «{review.text}»
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img
                    src={review.photo}
                    alt={review.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />

                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {review.name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {review.course}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Video reviews */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-red-600 text-sm font-semibold mb-2">
              Видеоотзывы
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Студенты рассказывают сами
            </h2>

            <p className="text-gray-500 leading-relaxed">
              Впечатления об обучении, преподавателях и собственных
              проектах.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoReviews.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => setSelectedVideo(video)}
                className="text-left bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.cover}
                    alt={`Видеоотзыв: ${video.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 text-red-600 fill-red-600 ml-1" />
                    </div>
                  </div>

                  <span className="absolute right-4 bottom-4 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
                    {video.duration}
                  </span>
                </div>

                <div className="p-5">
                  <p className="font-bold text-gray-900 mb-1">
                    {video.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {video.course}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-14 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-red-600">
                4,9
              </p>

              <p className="text-sm text-gray-500 mt-2">
                Средняя оценка
              </p>
            </div>

            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-red-600">
                90%
              </p>

              <p className="text-sm text-gray-500 mt-2">
                Рекомендуют обучение
              </p>
            </div>

            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-red-600">
                100+
              </p>

              <p className="text-sm text-gray-500 mt-2">
                Завершённых проектов
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leave review */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-red-600 text-sm font-semibold mb-2">
            Поделитесь мнением
          </p>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Уже учились в нашей школе?
          </h2>

          <p className="text-gray-500 max-w-2xl mx-auto mb-8">
            Расскажите о своём опыте и помогите будущим студентам
            выбрать подходящее направление.
          </p>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-7 py-3.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Оставить отзыв
          </button>
        </div>
      </section>

      {/* Video modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Закрыть видео"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video">
              <iframe
                src={selectedVideo.videoUrl}
                title={`Видеоотзыв ${selectedVideo.name}`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Review form modal */}
      {isReviewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeReviewModal}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeReviewModal}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Закрыть форму"
            >
              <X className="w-5 h-5" />
            </button>

            {isSubmitted ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-14 h-14 text-red-600 mx-auto mb-5" />

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Спасибо за отзыв!
                </h2>

                <p className="text-gray-500">
                  Ваш отзыв отправлен и появится на сайте после
                  проверки администратором.
                </p>
              </div>
            ) : (
              <>
                <p className="text-red-600 text-sm font-semibold mb-2">
                  Новый отзыв
                </p>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Расскажите о своём обучении
                </h2>

                <p className="text-sm text-gray-500 mb-7">
                  После подключения backend отзыв будет отправляться
                  администратору на модерацию.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="review-name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Имя
                    </label>

                    <input
                      id="review-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          name: event.target.value,
                        })
                      }
                      placeholder="Введите ваше имя"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="review-course"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Направление обучения
                    </label>

                    <input
                      id="review-course"
                      type="text"
                      required
                      value={formData.course}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          course: event.target.value,
                        })
                      }
                      placeholder="Например, Web-разработка"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Оценка
                    </span>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const value = index + 1;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                rating: value,
                              })
                            }
                            aria-label={`Оценка ${value}`}
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                value <= formData.rating
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-gray-200'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review-text"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Отзыв
                    </label>

                    <textarea
                      id="review-text"
                      required
                      rows={5}
                      value={formData.text}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          text: event.target.value,
                        })
                      }
                      placeholder="Расскажите о занятиях, преподавателях и результате обучения"
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-red-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    Отправить отзыв
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}