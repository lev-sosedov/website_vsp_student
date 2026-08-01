import {
  Calendar,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
  Undo2,
  UserRound,
  Users,
} from 'lucide-react';

import type {
  LessonAttachment,
  LessonContent,
  LessonLink,
} from '../../../../api/contentApi';
import type { LessonSchedule } from '../../../../api/scheduleApi';
import TeacherResourceActions from './TeacherResourceActions';

export interface TeacherMaterialCardItem {
  content: LessonContent;
  lesson: LessonSchedule;
  groupId: number;
  groupName: string;
  teacherName: string;
  attachments: LessonAttachment[];
  links: LessonLink[];
}

interface TeacherMaterialCardProps {
  item: TeacherMaterialCardItem;
  busyAction: string | null;
  onEditMaterial: (
    item: TeacherMaterialCardItem
  ) => void;
  onTogglePublication: (
    item: TeacherMaterialCardItem
  ) => Promise<void>;
  onDeleteMaterial: (
    item: TeacherMaterialCardItem
  ) => Promise<void>;
  onAddAttachment: (
    item: TeacherMaterialCardItem
  ) => void;
  onEditAttachment: (
    item: TeacherMaterialCardItem,
    attachment: LessonAttachment
  ) => void;
  onToggleAttachmentVisibility: (
    attachment: LessonAttachment
  ) => Promise<void>;
  onDeleteAttachment: (
    attachment: LessonAttachment
  ) => Promise<void>;
  onAddLink: (
    item: TeacherMaterialCardItem
  ) => void;
  onEditLink: (
    item: TeacherMaterialCardItem,
    link: LessonLink
  ) => void;
  onToggleLinkVisibility: (
    link: LessonLink
  ) => Promise<void>;
  onDeleteLink: (
    link: LessonLink
  ) => Promise<void>;
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(
    new Date(`${dateValue}T00:00:00`)
  );
}

function openExternalUrl(url: string): void {
  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.protocol !== 'http:' &&
      parsedUrl.protocol !== 'https:'
    ) {
      return;
    }

    window.open(
      parsedUrl.toString(),
      '_blank',
      'noopener,noreferrer'
    );
  } catch {
    // Некорректный URL не открываем.
  }
}

export default function TeacherMaterialCard({
  item,
  busyAction,
  onEditMaterial,
  onTogglePublication,
  onDeleteMaterial,
  onAddAttachment,
  onEditAttachment,
  onToggleAttachmentVisibility,
  onDeleteAttachment,
  onAddLink,
  onEditLink,
  onToggleLinkVisibility,
  onDeleteLink,
}: TeacherMaterialCardProps) {
  const { content, lesson } = item;

  const publicationAction =
    `publication-${content.id}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">
                {content.title}
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  content.is_published
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {content.is_published
                  ? 'Опубликовано'
                  : 'Черновик'}
              </span>
            </div>

            {content.summary && (
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {content.summary}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {item.groupName}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(
                  lesson.lesson_date
                )}
                {' · '}
                {lesson.topic?.trim() ||
                  'Занятие'}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4" />
                Преподаватель:{' '}
                {item.teacherName}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onEditMaterial(item)
              }
              disabled={busyAction !== null}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
              Изменить
            </button>


            <button
              type="button"
              onClick={() =>
                void onDeleteMaterial(item)
              }
              disabled={busyAction !== null}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              {busyAction ===
              `material-${content.id}-delete` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Удалить
            </button>
            <button
              type="button"
              onClick={() =>
                void onTogglePublication(item)
              }
              disabled={busyAction !== null}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50 ${
                content.is_published
                  ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {busyAction ===
              publicationAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : content.is_published ? (
                <Undo2 className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {content.is_published
                ? 'Снять публикацию'
                : 'Опубликовать'}
            </button>
          </div>
        </div>

        {content.content && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Текст материала
            </p>

            <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {content.content}
            </p>
          </div>
        )}
      </div>

      <div className="grid divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <section className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                Файлы
              </h3>

              <p className="mt-0.5 text-xs text-gray-500">
                Вложений: {item.attachments.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onAddAttachment(item)
              }
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить файл
            </button>
          </div>

          {item.attachments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
              Файлов пока нет
            </p>
          ) : (
            <div className="space-y-2">
              {item.attachments.map(
                (attachment) => {
                  const prefix =
                    `attachment-${attachment.id}`;

                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openExternalUrl(
                            attachment.file_url
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <FileText className="h-5 w-5 shrink-0 text-red-500" />

                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-800">
                            {attachment.title}
                          </span>

                          <span className="mt-0.5 block text-xs text-gray-400">
                            {attachment.is_visible
                              ? 'Видно студентам'
                              : 'Скрыто'}
                          </span>
                        </span>

                        <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />
                      </button>

                      <TeacherResourceActions
                        isVisible={
                          attachment.is_visible
                        }
                        isBusy={
                          busyAction?.startsWith(
                            prefix
                          ) ?? false
                        }
                        onEdit={() =>
                          onEditAttachment(
                            item,
                            attachment
                          )
                        }
                        onToggleVisibility={() =>
                          void onToggleAttachmentVisibility(
                            attachment
                          )
                        }
                        onDelete={() =>
                          void onDeleteAttachment(
                            attachment
                          )
                        }
                      />
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                Полезные ссылки
              </h3>

              <p className="mt-0.5 text-xs text-gray-500">
                Ссылок: {item.links.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onAddLink(item)}
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить ссылку
            </button>
          </div>

          {item.links.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
              Ссылок пока нет
            </p>
          ) : (
            <div className="space-y-2">
              {item.links.map((link) => {
                const prefix =
                  `link-${link.id}`;

                return (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openExternalUrl(link.url)
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <LinkIcon className="h-5 w-5 shrink-0 text-blue-500" />

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-800">
                          {link.title}
                        </span>

                        <span className="mt-0.5 block text-xs text-gray-400">
                          {link.is_visible
                            ? 'Видно студентам'
                            : 'Скрыто'}
                        </span>
                      </span>

                      <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />
                    </button>

                    <TeacherResourceActions
                      isVisible={link.is_visible}
                      isBusy={
                        busyAction?.startsWith(
                          prefix
                        ) ?? false
                      }
                      onEdit={() =>
                        onEditLink(item, link)
                      }
                      onToggleVisibility={() =>
                        void onToggleLinkVisibility(
                          link
                        )
                      }
                      onDelete={() =>
                        void onDeleteLink(
                          link
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
