import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';

import {
  createLessonAttachment,
  createLessonContent,
  createLessonLink,
  deleteLessonContent,
  getLessonAttachments,
  getLessonContents,
  getLessonLinks,
  publishLessonContent,
  unpublishLessonContent,
  updateLessonContent,
  type LessonAttachment,
  type LessonContent,
  type LessonLink,
} from '../../../../api/contentApi';

import {
  detectAttachmentType,
  uploadFileToCloudinary,
} from '../../../../api/cloudinaryApi';

import type {
  LessonSchedule,
} from '../../../../api/scheduleApi';

interface TeacherLessonDetailsModalProps {
  lesson: LessonSchedule;
  groupName: string;
  teacherId: number;
  justCreated?: boolean;
  onClose: () => void;
  onEditLesson: () => void;
  onOpenAttendance: () => void;
  onOpenHomework: () => Promise<void>;
  onMaterialChanged: () => void;
}

type ViewMode =
  | 'details'
  | 'materials'
  | 'create'
  | 'reuse'
  | 'edit';

interface MaterialBundle {
  content: LessonContent;
  attachments: LessonAttachment[];
  links: LessonLink[];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить действие';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function openUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function TeacherLessonDetailsModal({
  lesson,
  groupName,
  teacherId,
  justCreated = false,
  onClose,
  onEditLesson,
  onOpenAttendance,
  onOpenHomework,
  onMaterialChanged,
}: TeacherLessonDetailsModalProps) {
  const [view, setView] = useState<ViewMode>(
    justCreated ? 'details' : 'details'
  );
  const [bundle, setBundle] =
    useState<MaterialBundle | null>(null);
  const [library, setLibrary] =
    useState<LessonContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingHomework, setOpeningHomework] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] =
    useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [contentText, setContentText] = useState('');
  const [publish, setPublish] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [selectedLibraryId, setSelectedLibraryId] =
    useState<number | null>(null);

  const loadLessonMaterial = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [lessonContents, teacherContents] =
        await Promise.all([
          getLessonContents({
            lessonId: lesson.id,
            skip: 0,
            limit: 10,
          }),
          getLessonContents({
            createdBy: teacherId,
            skip: 0,
            limit: 500,
          }),
        ]);

      const current = lessonContents[0] ?? null;

      if (current) {
        const [attachments, links] =
          await Promise.all([
            getLessonAttachments({
              lessonContentId: current.id,
              skip: 0,
              limit: 500,
            }),
            getLessonLinks({
              lessonContentId: current.id,
              skip: 0,
              limit: 500,
            }),
          ]);

        setBundle({
          content: current,
          attachments,
          links,
        });
      } else {
        setBundle(null);
      }

      setLibrary(
        teacherContents.filter(
          (item) => item.lesson_id !== lesson.id
        )
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [lesson.id, teacherId]);

  useEffect(() => {
    void loadLessonMaterial();
  }, [loadLessonMaterial]);

  useEffect(() => {
    if (view === 'edit' && bundle) {
      setTitle(bundle.content.title);
      setSummary(bundle.content.summary ?? '');
      setContentText(bundle.content.content ?? '');
      setPublish(bundle.content.is_published);
    }

    if (view === 'create') {
      setTitle(
        lesson.topic?.trim()
          ? `Материалы к занятию «${lesson.topic.trim()}»`
          : 'Материалы занятия'
      );
      setSummary('');
      setContentText('');
      setPublish(true);
      setFile(null);
    }
  }, [view, bundle, lesson.topic]);

  const lessonTitle =
    lesson.topic?.trim() || 'Занятие';

  const selectedLibraryMaterial = useMemo(
    () =>
      library.find(
        (item) => item.id === selectedLibraryId
      ) ?? null,
    [library, selectedLibraryId]
  );

  const createMaterial = async () => {
    if (!title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const created = await createLessonContent({
        lesson_id: lesson.id,
        title: title.trim(),
        summary: summary.trim() || null,
        content: contentText.trim() || null,
        created_by: teacherId,
        is_published: publish,
      });

      if (file) {
        const uploaded =
          await uploadFileToCloudinary(file);

        await createLessonAttachment({
          lesson_content_id: created.id,
          title: file.name.replace(/\.[^.]+$/, ''),
          attachment_type:
            detectAttachmentType(file),
          file_url: uploaded.secureUrl,
          file_name: file.name,
          mime_type: uploaded.mimeType,
          file_size: uploaded.bytes,
          sort_order: 0,
          is_visible: true,
          uploaded_by: teacherId,
        });
      }

      setSuccess('Материал добавлен к занятию');
      setView('materials');
      await loadLessonMaterial();
      onMaterialChanged();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const updateMaterial = async () => {
    if (!bundle || !title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await updateLessonContent(
        bundle.content.id,
        {
          title: title.trim(),
          summary: summary.trim() || null,
          content: contentText.trim() || null,
          updated_by: teacherId,
        }
      );

      if (publish && !updated.is_published) {
        await publishLessonContent(
          updated.id,
          teacherId
        );
      } else if (
        !publish &&
        updated.is_published
      ) {
        await unpublishLessonContent(
          updated.id,
          teacherId
        );
      }

      if (file) {
        const uploaded =
          await uploadFileToCloudinary(file);

        await createLessonAttachment({
          lesson_content_id: updated.id,
          title: file.name.replace(/\.[^.]+$/, ''),
          attachment_type:
            detectAttachmentType(file),
          file_url: uploaded.secureUrl,
          file_name: file.name,
          mime_type: uploaded.mimeType,
          file_size: uploaded.bytes,
          sort_order: bundle.attachments.length,
          is_visible: true,
          uploaded_by: teacherId,
        });
      }

      setSuccess('Материал обновлён');
      setView('materials');
      await loadLessonMaterial();
      onMaterialChanged();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const reuseMaterial = async () => {
    if (!selectedLibraryMaterial) return;

    setSaving(true);
    setError(null);

    try {
      const [attachments, links] =
        await Promise.all([
          getLessonAttachments({
            lessonContentId:
              selectedLibraryMaterial.id,
            skip: 0,
            limit: 500,
          }),
          getLessonLinks({
            lessonContentId:
              selectedLibraryMaterial.id,
            skip: 0,
            limit: 500,
          }),
        ]);

      const created = await createLessonContent({
        lesson_id: lesson.id,
        title: selectedLibraryMaterial.title,
        summary: selectedLibraryMaterial.summary,
        content: selectedLibraryMaterial.content,
        created_by: teacherId,
        is_published:
          selectedLibraryMaterial.is_published,
      });

      await Promise.all([
        ...attachments.map((attachment) =>
          createLessonAttachment({
            lesson_content_id: created.id,
            title: attachment.title,
            attachment_type:
              attachment.attachment_type,
            file_url: attachment.file_url,
            file_name: attachment.file_name,
            mime_type: attachment.mime_type,
            file_size: attachment.file_size,
            sort_order: attachment.sort_order,
            is_visible: attachment.is_visible,
            uploaded_by: teacherId,
          })
        ),
        ...links.map((link) =>
          createLessonLink({
            lesson_content_id: created.id,
            title: link.title,
            url: link.url,
            description: link.description,
            sort_order: link.sort_order,
            is_visible: link.is_visible,
            added_by: teacherId,
          })
        ),
      ]);

      setSuccess(
        'Ранее загруженный материал добавлен к занятию'
      );
      setView('materials');
      await loadLessonMaterial();
      onMaterialChanged();
    } catch (reuseError) {
      setError(getErrorMessage(reuseError));
    } finally {
      setSaving(false);
    }
  };

  const openHomework = async () => {
    if (openingHomework) {
      return;
    }

    setOpeningHomework(true);
    setError(null);

    try {
      await onOpenHomework();
    } catch (homeworkError) {
      setError(
        getErrorMessage(homeworkError)
      );
    } finally {
      setOpeningHomework(false);
    }
  };

  const detachMaterial = async () => {
    if (!bundle) return;

    if (
      !window.confirm(
        'Открепить и удалить материал этого занятия? Файлы и ссылки будут удалены из базы.'
      )
    ) return;

    setSaving(true);
    setError(null);

    try {
      await deleteLessonContent(
        bundle.content.id,
        teacherId
      );
      setBundle(null);
      setSuccess('Материал откреплён от занятия');
      onMaterialChanged();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-6">
          <div>
            {justCreated && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Занятие создано
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900">{lessonTitle}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {groupName} · {formatDate(lesson.lesson_date)} · {formatTime(lesson.start_time)}–{formatTime(lesson.end_time)}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-red-600" /></div>
          ) : (
            <>
              {view === 'details' && (
                <div className="space-y-5">
                  {lesson.description && <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">{lesson.description}</div>}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={onEditLesson}
                      className="rounded-xl border border-gray-200 p-4 text-left transition hover:border-red-200 hover:bg-red-50"
                    >
                      <Pencil className="h-5 w-5 text-red-600" />
                      <span className="mt-2 block font-semibold">
                        Редактировать занятие
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Изменить тему, дату, время, кабинет или описание
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setView('materials')}
                      className="rounded-xl border border-gray-200 p-4 text-left transition hover:border-red-200 hover:bg-red-50"
                    >
                      <Paperclip className="h-5 w-5 text-red-600" />
                      <span className="mt-2 block font-semibold">
                        Материалы
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {bundle
                          ? 'Материал добавлен'
                          : 'Загрузить новый или использовать ранее загруженный'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenAttendance}
                      className="rounded-xl border border-gray-200 p-4 text-left transition hover:border-red-200 hover:bg-red-50"
                    >
                      <Users className="h-5 w-5 text-red-600" />
                      <span className="mt-2 block font-semibold">
                        Посещаемость
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void openHomework()
                      }
                      disabled={openingHomework}
                      className="rounded-xl border border-gray-200 p-4 text-left transition hover:border-red-200 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      {openingHomework ? (
                        <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-red-600" />
                      )}
                      <span className="mt-2 block font-semibold">
                        Домашнее задание
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Создать или изменить задание для этого занятия
                      </span>
                    </button>
                  </div>

                  {justCreated && !bundle && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                      <p className="font-semibold text-gray-900">Что сделать дальше?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setView('create')} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Добавить материал</button>
                        <button
                          type="button"
                          onClick={() =>
                            void openHomework()
                          }
                          disabled={openingHomework}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-wait disabled:opacity-60"
                        >
                          {openingHomework && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          Создать домашнее задание
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {view === 'materials' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Материалы занятия</h3>
                      <p className="text-sm text-gray-500">Файлы и ссылки, которые увидят студенты после публикации.</p>
                    </div>
                    <button type="button" onClick={() => setView('details')} className="text-sm font-semibold text-gray-500">Назад</button>
                  </div>

                  {!bundle ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                      <FileText className="mx-auto h-9 w-9 text-gray-300" />
                      <p className="mt-2 font-semibold text-gray-700">Материал пока не добавлен</p>
                      <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                        <button type="button" onClick={() => setView('create')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Создать и загрузить</button>
                        <button type="button" onClick={() => setView('reuse')} disabled={library.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"><Paperclip className="h-4 w-4" />Использовать ранее загруженное</button>
                      </div>
                    </div>
                  ) : (
                    <article className="rounded-xl border border-gray-200 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-gray-900">{bundle.content.title}</h4>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bundle.content.is_published ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{bundle.content.is_published ? 'Опубликовано' : 'Черновик'}</span>
                          </div>
                          {bundle.content.summary && <p className="mt-2 text-sm text-gray-600">{bundle.content.summary}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setView('edit')} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold"><Pencil className="h-4 w-4" />Изменить</button>
                          <button type="button" onClick={() => void detachMaterial()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 className="h-4 w-4" />Открепить</button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {bundle.attachments.map((attachment) => (
                          <button key={attachment.id} type="button" onClick={() => openUrl(attachment.file_url)} className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left hover:bg-gray-100">
                            <FileText className="h-5 w-5 text-red-600" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{attachment.title}</span>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </button>
                        ))}
                        {bundle.links.map((link) => (
                          <button key={link.id} type="button" onClick={() => openUrl(link.url)} className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left hover:bg-gray-100">
                            <ExternalLink className="h-5 w-5 text-blue-600" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{link.title}</span>
                          </button>
                        ))}
                      </div>
                    </article>
                  )}
                </div>
              )}

              {(view === 'create' || view === 'edit') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{view === 'create' ? 'Добавить материал' : 'Изменить материал'}</h3>
                    <button type="button" onClick={() => setView('materials')} className="text-sm font-semibold text-gray-500">Назад</button>
                  </div>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Название материала" className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" />
                  <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Краткое описание" rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  <textarea value={contentText} onChange={(event) => setContentText(event.target.value)} placeholder="Текст материала или инструкция" rows={5} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50 p-4">
                    <UploadCloud className="h-6 w-6 text-red-600" />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{file ? file.name : 'Выбрать файл для Cloudinary'}</span><span className="block text-xs text-gray-500">Презентация, PDF, Word, Excel, изображение, видео или архив</span></span>
                    <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                  </label>
                  <label className="flex items-center gap-3 rounded-xl bg-gray-50 p-4"><input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} className="h-4 w-4 accent-red-600" /><span className="text-sm font-medium">Сразу опубликовать для студентов</span></label>
                  <button type="button" onClick={() => void (view === 'create' ? createMaterial() : updateMaterial())} disabled={saving || !title.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-red-300">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{view === 'create' ? 'Создать материал' : 'Сохранить изменения'}</button>
                </div>
              )}

              {view === 'reuse' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Использовать ранее загруженное</h3><button type="button" onClick={() => setView('materials')} className="text-sm font-semibold text-gray-500">Назад</button></div>
                  <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">Будет создана отдельная копия карточки для этого занятия, а уже загруженные Cloudinary-файлы и ссылки будут использованы повторно без повторной загрузки.</p>
                  <select value={selectedLibraryId ?? ''} onChange={(event) => setSelectedLibraryId(Number(event.target.value) || null)} className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm">
                    <option value="">Выберите материал</option>
                    {library.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                  {selectedLibraryMaterial && <div className="rounded-xl border border-gray-200 p-4"><p className="font-semibold">{selectedLibraryMaterial.title}</p><p className="mt-1 text-sm text-gray-500">{selectedLibraryMaterial.summary || 'Без описания'}</p></div>}
                  <button type="button" onClick={() => void reuseMaterial()} disabled={saving || !selectedLibraryMaterial} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-red-300">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Добавить к занятию</button>
                </div>
              )}

              {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
              {success && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
