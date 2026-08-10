import { useEffect, useState } from 'react';
import {
  FileUp,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';

import {
  detectAttachmentType,
  isCloudinaryConfigured,
  uploadFileToCloudinary,
} from '../../../../api/cloudinaryApi';

export type TeacherResourceKind =
  | 'attachment'
  | 'link';

export interface TeacherMaterialResourceValues {
  title: string;
  url: string;
  description: string;
  attachmentType: string;
  sortOrder: number;
  isVisible: boolean;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
}

interface TeacherMaterialResourceModalProps {
  kind: TeacherResourceKind;
  mode: 'create' | 'edit';
  initialValues?: TeacherMaterialResourceValues;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: TeacherMaterialResourceValues
  ) => Promise<void>;
}

const ATTACHMENT_TYPES = [
  ['document', 'Документ'],
  ['presentation', 'Презентация'],
  ['image', 'Изображение'],
  ['video', 'Видео'],
  ['audio', 'Аудио'],
  ['archive', 'Архив'],
  ['code', 'Код'],
  ['other', 'Другое'],
] as const;

export default function TeacherMaterialResourceModal({
  kind,
  mode,
  initialValues,
  isSaving,
  error,
  onClose,
  onSubmit,
}: TeacherMaterialResourceModalProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [url, setUrl] = useState(initialValues?.url ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [attachmentType, setAttachmentType] = useState(initialValues?.attachmentType ?? 'document');
  const [sortOrder, setSortOrder] = useState(initialValues?.sortOrder ?? 0);
  const [isVisible, setIsVisible] = useState(initialValues?.isVisible ?? true);
  const [fileName, setFileName] = useState<string | null>(initialValues?.fileName ?? null);
  const [mimeType, setMimeType] = useState<string | null>(initialValues?.mimeType ?? null);
  const [fileSize, setFileSize] = useState<number | null>(initialValues?.fileSize ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setUrl(initialValues?.url ?? '');
    setDescription(initialValues?.description ?? '');
    setAttachmentType(initialValues?.attachmentType ?? 'document');
    setSortOrder(initialValues?.sortOrder ?? 0);
    setIsVisible(initialValues?.isVisible ?? true);
    setFileName(initialValues?.fileName ?? null);
    setMimeType(initialValues?.mimeType ?? null);
    setFileSize(initialValues?.fileSize ?? null);
  }, [initialValues]);

  const handleFile = async (file: File | null) => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);

      const result = await uploadFileToCloudinary(file);

      setUrl(result.secureUrl);
      setFileName(file.name);
      setMimeType(result.mimeType);
      setFileSize(result.bytes);
      setAttachmentType(detectAttachmentType(file));

      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, ''));
      }
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : 'Не удалось загрузить файл'
      );
    } finally {
      setUploading(false);
    }
  };

  const canSubmit =
    title.trim().length > 0 &&
    url.trim().length > 0 &&
    !uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? (kind === 'attachment' ? 'Добавить файл' : 'Добавить ссылку') : (kind === 'attachment' ? 'Изменить файл' : 'Изменить ссылку')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {kind === 'attachment'
                ? 'Выберите файл — он загрузится в Cloudinary автоматически. Ссылку можно указать и вручную.'
                : 'Добавьте полезный ресурс для студентов.'}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving || uploading} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5 p-6" onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit || isSaving) return;
          void onSubmit({
            title: title.trim(),
            url: url.trim(),
            description: description.trim(),
            attachmentType,
            sortOrder: Math.max(0, sortOrder),
            isVisible,
            fileName,
            mimeType,
            fileSize,
          });
        }}>
          {kind === 'attachment' && (
            <div className="rounded-xl border border-dashed border-red-200 bg-red-50/50 p-4">
              <label className="flex cursor-pointer flex-col items-center justify-center text-center">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin text-red-600" /> : <UploadCloud className="h-8 w-8 text-red-600" />}
                <span className="mt-2 text-sm font-semibold text-gray-800">
                  {uploading ? 'Загружаем в Cloudinary…' : 'Выбрать файл с компьютера'}
                </span>
                <span className="mt-1 text-xs text-gray-500">PDF, Word, Excel, презентации, изображения, видео и архивы</span>
                <input type="file" className="hidden" disabled={uploading || isSaving} onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} />
              </label>

              {!isCloudinaryConfigured() && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  Для загрузки добавьте Cloudinary-параметры в конфигурацию приложения. Ручная ссылка ниже продолжит работать.
                </p>
              )}

              {fileName && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-white p-3 text-sm text-gray-700">
                  <FileUp className="h-4 w-4 text-red-600" />
                  <span className="truncate">{fileName}</span>
                </div>
              )}
            </div>
          )}

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-gray-700">Название</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} disabled={isSaving || uploading} className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50" />
          </label>

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-gray-700">{kind === 'attachment' ? 'Ссылка на файл' : 'Адрес ссылки'}</span>
            <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." disabled={isSaving || uploading} className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50" />
          </label>

          {kind === 'attachment' ? (
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-gray-700">Тип файла</span>
              <select value={attachmentType} onChange={(event) => setAttachmentType(event.target.value)} disabled={isSaving || uploading} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm">
                {ATTACHMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          ) : (
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-gray-700">Описание</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Порядок</span>
              <input type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value) || 0)} className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" />
            </label>
            <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 sm:self-end">
              <input type="checkbox" checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} className="h-4 w-4 accent-red-600" />
              <span className="text-sm font-medium text-gray-700">Видно студентам</span>
            </label>
          </div>

          {(error || uploadError) && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{uploadError || error}</div>}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={isSaving || uploading} className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700">Отмена</button>
            <button type="submit" disabled={!canSubmit || isSaving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white disabled:bg-red-300">
              {(isSaving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Добавить' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
