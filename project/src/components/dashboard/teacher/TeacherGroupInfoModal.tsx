import {
  BookOpen,
  Building2,
  CalendarDays,
  DoorOpen,
  GraduationCap,
  X,
} from 'lucide-react';

interface TeacherGroupInfoModalProps {
  isOpen: boolean;
  groupName: string;
  isActive: boolean;
  description: string | null;
  directionName: string;
  directionDescription: string | null;
  educationPlanName: string;
  educationPlanDescription: string | null;
  educationPlanDuration: string;
  lessonsPerWeek: string;
  startDate: string;
  endDate: string;
  branchName: string;
  roomName: string;
  onClose: () => void;
}

interface InfoItemProps {
  icon: typeof BookOpen;
  label: string;
  value: string;
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: InfoItemProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TeacherGroupInfoModal({
  isOpen,
  groupName,
  isActive,
  description,
  directionName,
  directionDescription,
  educationPlanName,
  educationPlanDescription,
  educationPlanDuration,
  lessonsPerWeek,
  startDate,
  endDate,
  branchName,
  roomName,
  onClose,
}: TeacherGroupInfoModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-group-info-title"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="teacher-group-info-title"
                className="text-xl font-bold text-gray-900"
              >
                {groupName}
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isActive
                  ? 'Активна'
                  : 'Неактивна'}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Подробная информация об учебной группе
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Закрыть информацию о группе"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {description?.trim() && (
            <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
              <p className="text-sm leading-6 text-gray-700">
                {description}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem
              icon={GraduationCap}
              label="Направление обучения"
              value={directionName}
            />

            <InfoItem
              icon={BookOpen}
              label="Учебный план"
              value={educationPlanName}
            />

            <InfoItem
              icon={CalendarDays}
              label="Начало обучения"
              value={startDate}
            />

            <InfoItem
              icon={CalendarDays}
              label="Окончание обучения"
              value={endDate}
            />

            <InfoItem
              icon={CalendarDays}
              label="Продолжительность"
              value={educationPlanDuration}
            />

            <InfoItem
              icon={BookOpen}
              label="Занятий в неделю"
              value={lessonsPerWeek}
            />

            <InfoItem
              icon={Building2}
              label="Филиал"
              value={branchName}
            />

            <InfoItem
              icon={DoorOpen}
              label="Кабинет"
              value={roomName}
            />
          </div>

          {directionDescription?.trim() && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                О направлении
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {directionDescription}
              </p>
            </div>
          )}

          {educationPlanDescription?.trim() && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Описание учебного плана
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {educationPlanDescription}
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-100 bg-white p-5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
