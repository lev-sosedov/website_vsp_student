import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  FilePlus2,
  Loader2,
  X,
} from 'lucide-react';

import type {
  CreateHomeworkAttachmentData,
  Homework,
  HomeworkAttachment,
} from '../../../../api/homeworkApi';

interface TeacherHomeworkAttachmentModalProps {
  homework: Homework | null;
  attachment: HomeworkAttachment | null;
  teacherId: number;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: CreateHomeworkAttachmentData
  ) => Promise<void>;
}

const ATTACHMENT_TYPES = [
  ['document', 'Документ'],
  ['presentation', 'Презентация'],
  ['image', 'Изображение'],
  ['video', 'Видео'],
  ['audio', 'Аудио'],
  ['archive', 'Архив'],
  ['code', 'Исходный код'],
  ['other', 'Другое'],
] as const;

export default function TeacherHomeworkAttachmentModal({
  homework,
  attachment,
  teacherId,
  isSaving,
  error,
  onClose,
  onSubmit,
}: TeacherHomeworkAttachmentModalProps) {
  const [title, setTitle] = useState('');
  const [attachmentType, setAttachmentType] =
    useState('document');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!homework) {
      return;
    }

    setTitle(attachment?.title ?? '');
    setAttachmentType(
      attachment?.attachment_type ?? 'document'
    );
    setFileUrl(attachment?.file_url ?? '');
    setFileName(attachment?.file_name ?? '');
    setMimeType(attachment?.mime_type ?? '');
    setFileSize(
      attachment?.file_size !== null &&
        attachment?.file_size !== undefined
        ? String(attachment.file_size)
        : ''
    );
    setSortOrder(String(attachment?.sort_order ?? 0));
    setIsVisible(attachment?.is_visible ?? true);
  }, [attachment, homework]);

  if (!homework) {
    return null;
  }

  const submitForm = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await onSubmit({
      homework_id: homework.id,
      title: title.trim(),
      attachment_type: attachmentType,
      file_url: fileUrl.trim(),
      file_name: fileName.trim() || null,
      mime_type: mimeType.trim() || null,
      file_size: fileSize ? Number(fileSize) : null,
      sort_order: Number(sortOrder),
      is_visible: isVisible,
      uploaded_by: teacherId,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attachment-modal-title"
    >
      <form
        onSubmit={(event) => void submitForm(event)}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <FilePlus2 className="h-5 w-5 text-red-600" />
            <div>
              <h2
                id="attachment-modal-title"
                className="text-lg font-bold text-gray-900"
              >
                {attachment
                  ? 'Изменить вложение'
                  : 'Добавить вложение'}
              </h2>
              <p className="max-w-md truncate text-sm text-gray-500">
                {homework.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-6 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Название вложения
            </span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Тип файла
            </span>
            <select
              value={attachmentType}
              onChange={(event) =>
                setAttachmentType(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-red-400"
            >
              {ATTACHMENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Ссылка на файл
            </span>
            <input
              required
              type="url"
              value={fileUrl}
              onChange={(event) =>
                setFileUrl(event.target.value)
              }
              placeholder="https://..."
              maxLength={3000}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
            <p className="text-xs text-gray-400">
              Content Service хранит URL файла, а не загружает
              бинарный файл напрямую.
            </p>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Имя файла
            </span>
            <input
              value={fileName}
              onChange={(event) =>
                setFileName(event.target.value)
              }
              placeholder="Задание.pdf"
              maxLength={255}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              MIME-тип
            </span>
            <input
              value={mimeType}
              onChange={(event) =>
                setMimeType(event.target.value)
              }
              placeholder="application/pdf"
              maxLength={150}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Размер, байт
            </span>
            <input
              type="number"
              min="0"
              value={fileSize}
              onChange={(event) =>
                setFileSize(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Порядок отображения
            </span>
            <input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          {!attachment && (
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 sm:col-span-2">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(event) =>
                  setIsVisible(event.target.checked)
                }
                className="h-4 w-4 accent-red-600"
              />
              <span className="text-sm text-gray-700">
                Показывать вложение студентам
              </span>
            </label>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={
              isSaving ||
              !title.trim() ||
              !fileUrl.trim()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:bg-gray-300"
          >
            {isSaving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {attachment ? 'Сохранить' : 'Добавить'}
          </button>
        </footer>
      </form>
    </div>
  );
}
