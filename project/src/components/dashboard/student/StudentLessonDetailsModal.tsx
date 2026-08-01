import {
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';

import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Paperclip,
  UserRound,
  X,
} from 'lucide-react';

import {
  formatFileSize,
  getAttachmentTypeLabel,
  getLessonContents,
  getVisibleContentAttachments,
  getVisibleContentLinks,
  type LessonAttachment,
  type LessonContent,
  type LessonLink,
} from '../../../api/contentApi';

import {
  getHomeworkByLesson,
  getVisibleHomeworkAttachments,
  type Homework,
  type HomeworkAttachment,
} from '../../../api/homeworkApi';

import type {
  LessonSchedule,
} from '../../../api/scheduleApi';

interface StudentLessonDetailsModalProps {
  lesson: LessonSchedule;
  groupName: string;
  teacherName: string;
  roomName: string;
  onClose: () => void;
}

interface MaterialBundle {
  content: LessonContent;
  attachments: LessonAttachment[];
  links: LessonLink[];
}

interface HomeworkBundle {
  homework: Homework;
  attachments: HomeworkAttachment[];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить данные занятия';
}

function formatDate(value: string): string {
  const [year, month, day] = value
    .split('-')
    .map(Number);

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return 'Срок не указан';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function getLocalDateKey(
  date = new Date()
): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');
  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function areLessonMaterialsAvailable(
  lessonDate: string
): boolean {
  return lessonDate <= getLocalDateKey();
}

function getLessonTypeLabel(
  lesson: LessonSchedule
): string {
  if (lesson.is_extra) {
    return 'Дополнительное занятие';
  }

  switch (lesson.lesson_type) {
    case 'extra':
      return 'Дополнительное занятие';

    case 'replacement':
      return 'Замена';

    case 'consultation':
      return 'Консультация';

    case 'regular':
    default:
      return 'Основное занятие';
  }
}

function isSafeExternalUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === 'http:' ||
      parsedUrl.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

function openExternalUrl(url: string): void {
  if (!isSafeExternalUrl(url)) {
    return;
  }

  window.open(
    url,
    '_blank',
    'noopener,noreferrer'
  );
}

function getDownloadFileName(
  attachment: LessonAttachment | HomeworkAttachment
): string {
  return (
    attachment.file_name?.trim() ||
    attachment.title.trim() ||
    'материал'
  );
}

export default function StudentLessonDetailsModal({
  lesson,
  groupName,
  teacherName,
  roomName,
  onClose,
}: StudentLessonDetailsModalProps) {
  const [material, setMaterial] =
    useState<MaterialBundle | null>(null);

  const [homework, setHomework] =
    useState<HomeworkBundle | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const materialsAreAvailable =
    areLessonMaterialsAvailable(
      lesson.lesson_date
    );

  useEffect(() => {
    let cancelled = false;

    async function loadLessonData() {
      setIsLoading(true);
      setError(null);

      try {
        const [materialResult, homeworkResult] =
          await Promise.allSettled([
            materialsAreAvailable
              ? getLessonContents({
                  lessonId: lesson.id,
                  isPublished: true,
                  skip: 0,
                  limit: 10,
                })
              : Promise.resolve<
                  LessonContent[]
                >([]),
            getHomeworkByLesson(lesson.id),
          ]);

        if (cancelled) {
          return;
        }

        const publishedMaterial =
          materialResult.status === 'fulfilled'
            ? materialResult.value.find(
                (item) => item.is_published
              ) ?? null
            : null;

        if (publishedMaterial) {
          const [attachmentsResult, linksResult] =
            await Promise.allSettled([
              getVisibleContentAttachments(
                publishedMaterial.id
              ),
              getVisibleContentLinks(
                publishedMaterial.id
              ),
            ]);

          if (!cancelled) {
            setMaterial({
              content: publishedMaterial,
              attachments:
                attachmentsResult.status ===
                'fulfilled'
                  ? attachmentsResult.value
                  : [],
              links:
                linksResult.status === 'fulfilled'
                  ? linksResult.value
                  : [],
            });
          }
        } else {
          setMaterial(null);
        }

        const publishedHomework =
          homeworkResult.status === 'fulfilled' &&
          homeworkResult.value.is_published &&
          homeworkResult.value.is_active
            ? homeworkResult.value
            : null;

        if (publishedHomework) {
          let attachments: HomeworkAttachment[] = [];

          try {
            attachments =
              await getVisibleHomeworkAttachments(
                publishedHomework.id
              );
          } catch {
            attachments = [];
          }

          if (!cancelled) {
            setHomework({
              homework: publishedHomework,
              attachments,
            });
          }
        } else {
          setHomework(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setMaterial(null);
          setHomework(null);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLessonData();

    return () => {
      cancelled = true;
    };
  }, [
    lesson.id,
    materialsAreAvailable,
  ]);

  const lessonTitle =
    lesson.topic?.trim() || 'Занятие';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-lesson-details-title"
      onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
          <div className="min-w-0">
            <h2
              id="student-lesson-details-title"
              className="text-xl font-bold text-gray-900"
            >
              {lessonTitle}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {groupName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Закрыть информацию о занятии"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-red-600" />

                <h3 className="font-semibold text-gray-900">
                  Информация о занятии
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <CalendarDays className="h-5 w-5 shrink-0 text-gray-400" />

                  <div>
                    <p className="text-xs text-gray-400">
                      Дата
                    </p>

                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(lesson.lesson_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <Clock className="h-5 w-5 shrink-0 text-gray-400" />

                  <div>
                    <p className="text-xs text-gray-400">
                      Время
                    </p>

                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(lesson.start_time)} —{' '}
                      {formatTime(lesson.end_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <UserRound className="h-5 w-5 shrink-0 text-gray-400" />

                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">
                      Преподаватель
                    </p>

                    <p className="truncate text-sm font-medium text-gray-900">
                      {teacherName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <MapPin className="h-5 w-5 shrink-0 text-gray-400" />

                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">
                      Кабинет
                    </p>

                    <p className="truncate text-sm font-medium text-gray-900">
                      {roomName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400">
                  Тип занятия
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {getLessonTypeLabel(lesson)}
                </p>

                {lesson.description?.trim() && (
                  <>
                    <p className="mt-4 text-xs text-gray-400">
                      Описание
                    </p>

                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-700">
                      {lesson.description}
                    </p>
                  </>
                )}
              </div>
            </section>

            {isLoading ? (
              <div className="flex min-h-36 flex-col items-center justify-center rounded-xl bg-gray-50">
                <Loader2 className="h-7 w-7 animate-spin text-red-600" />

                <p className="mt-3 text-sm text-gray-500">
                  Загружаем материалы и домашнее задание…
                </p>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <p className="text-sm leading-6 text-red-700">
                  {error}
                </p>
              </div>
            ) : (
              <>
                <section className="border-t border-gray-100 pt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-red-600" />

                    <h3 className="font-semibold text-gray-900">
                      Материалы занятия
                    </h3>
                  </div>

                  {!materialsAreAvailable ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-center">
                      <CalendarDays className="mx-auto h-8 w-8 text-blue-400" />

                      <p className="mt-2 text-sm font-semibold text-blue-900">
                        Материалы откроются в день занятия
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-700">
                        Занятие состоится{' '}
                        {formatDate(
                          lesson.lesson_date
                        )}. Расписание доступно
                        заранее, а файлы и ссылки
                        появятся в этот день.
                      </p>
                    </div>
                  ) : !material ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                      <FileText className="mx-auto h-8 w-8 text-gray-300" />

                      <p className="mt-2 text-sm font-medium text-gray-700">
                        Материалы пока не опубликованы
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-gray-100 p-4">
                        <h4 className="font-semibold text-gray-900">
                          {material.content.title}
                        </h4>

                        {material.content.summary?.trim() && (
                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {material.content.summary}
                          </p>
                        )}

                        {material.content.content?.trim() && (
                          <p className="mt-3 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                            {material.content.content}
                          </p>
                        )}
                      </div>

                      {material.attachments.map(
                        (attachment) => (
                          <div
                            key={attachment.id}
                            className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {attachment.title}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {getAttachmentTypeLabel(
                                  attachment
                                )}
                                {attachment.file_size !== null
                                  ? ` · ${formatFileSize(
                                      attachment.file_size
                                    )}`
                                  : ''}
                              </p>
                            </div>

                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openExternalUrl(
                                    attachment.file_url
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:text-red-600"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Открыть
                              </button>

                              <a
                                href={attachment.file_url}
                                download={getDownloadFileName(
                                  attachment
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                              >
                                <Download className="h-4 w-4" />
                                Скачать
                              </a>
                            </div>
                          </div>
                        )
                      )}

                      {material.links.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() =>
                            openExternalUrl(link.url)
                          }
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-red-200 hover:bg-red-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <LinkIcon className="h-5 w-5 shrink-0 text-red-500" />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {link.title}
                              </p>

                              {link.description?.trim() && (
                                <p className="mt-1 truncate text-xs text-gray-500">
                                  {link.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />
                        </button>
                      ))}

                      {material.attachments.length === 0 &&
                        material.links.length === 0 &&
                        !material.content.content?.trim() && (
                          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                            К материалу пока не добавлены файлы или ссылки.
                          </p>
                        )}
                    </div>
                  )}
                </section>

                <section className="border-t border-gray-100 pt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-red-600" />

                    <h3 className="font-semibold text-gray-900">
                      Домашнее задание
                    </h3>
                  </div>

                  {!homework ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                      <BookOpen className="mx-auto h-8 w-8 text-gray-300" />

                      <p className="mt-2 text-sm font-medium text-gray-700">
                        Домашнее задание не опубликовано
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-gray-100 p-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {homework.homework.title}
                        </h4>

                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                          {homework.homework.description}
                        </p>
                      </div>

                      {homework.homework.instructions?.trim() && (
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Инструкции
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                            {homework.homework.instructions}
                          </p>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-400">
                            Срок сдачи
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {formatDateTime(
                              homework.homework.due_at
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-400">
                            Максимальный балл
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {homework.homework.max_score}
                          </p>
                        </div>
                      </div>

                      {homework.attachments.map(
                        (attachment) => (
                          <div
                            key={attachment.id}
                            className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {attachment.title}
                              </p>

                              {attachment.file_size !== null && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {formatFileSize(
                                    attachment.file_size
                                  )}
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openExternalUrl(
                                    attachment.file_url
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:text-red-600"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Открыть
                              </button>

                              <a
                                href={attachment.file_url}
                                download={getDownloadFileName(
                                  attachment
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                              >
                                <Download className="h-4 w-4" />
                                Скачать
                              </a>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-gray-100 bg-gray-50/60 p-5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Закрыть
          </button>
        </footer>
      </div>
    </div>
  );
}
