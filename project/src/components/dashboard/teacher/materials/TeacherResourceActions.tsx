import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';

interface TeacherResourceActionsProps {
  isVisible: boolean;
  isBusy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

export default function TeacherResourceActions({
  isVisible,
  isBusy,
  onEdit,
  onToggleVisibility,
  onDelete,
}: TeacherResourceActionsProps) {
  if (isBusy) {
    return (
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-red-500" />
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        aria-label="Изменить"
        title="Изменить"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onToggleVisibility}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        aria-label={
          isVisible
            ? 'Скрыть от студентов'
            : 'Показать студентам'
        }
        title={
          isVisible
            ? 'Скрыть от студентов'
            : 'Показать студентам'
        }
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
        aria-label="Удалить"
        title="Удалить"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
