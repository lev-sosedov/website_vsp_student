import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  CalendarDays,
  Loader2,
  Pencil,
  Play,
  Power,
  X,
} from 'lucide-react';

import type { AcademicGroup } from '../../../../api/academicApi';
import type {
  LessonType,
  Room,
  ScheduleTemplate,
  ScheduleTemplateCreate,
} from '../../../../api/scheduleApi';

interface TeacherTemplateManagerModalProps {
  isOpen: boolean;
  teacherId: number;
  groups: AcademicGroup[];
  rooms: Room[];
  templates: ScheduleTemplate[];
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (
    values: ScheduleTemplateCreate,
    templateId: number | null
  ) => Promise<void>;
  onToggle: (template: ScheduleTemplate) => Promise<void>;
  onGenerate: (
    template: ScheduleTemplate,
    dateFrom: string,
    dateTo: string
  ) => Promise<void>;
}

const DAYS = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

export default function TeacherTemplateManagerModal({
  isOpen,
  teacherId,
  groups,
  rooms,
  templates,
  isSaving,
  error,
  onClose,
  onSave,
  onToggle,
  onGenerate,
}: TeacherTemplateManagerModalProps) {
  const [editingId, setEditingId] =
    useState<number | null>(null);
  const [groupId, setGroupId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [weekday, setWeekday] = useState('0');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [lessonType, setLessonType] =
    useState<LessonType>('regular');
  const [generationId, setGenerationId] =
    useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setGroupId(String(groups[0]?.id ?? ''));
    setRoomId(String(rooms[0]?.id ?? ''));
    setWeekday('0');
    setStartTime('18:00');
    setEndTime('19:30');
    setLessonType('regular');
  };

  useEffect(() => {
    if (isOpen) {
      setEditingId(null);
      setGroupId(String(groups[0]?.id ?? ''));
      setRoomId(String(rooms[0]?.id ?? ''));
      setWeekday('0');
      setStartTime('18:00');
      setEndTime('19:30');
      setLessonType('regular');
    }
  }, [isOpen, groups, rooms]);

  if (!isOpen) {
    return null;
  }

  const editTemplate = (template: ScheduleTemplate) => {
    setEditingId(template.id);
    setGroupId(String(template.group_id));
    setRoomId(String(template.room_id));
    setWeekday(String(template.weekday));
    setStartTime(template.start_time.slice(0, 5));
    setEndTime(template.end_time.slice(0, 5));
    setLessonType(template.lesson_type);
  };

  const submitForm = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await onSave(
      {
        group_id: Number(groupId),
        teacher_id: teacherId,
        room_id: Number(roomId),
        weekday: Number(weekday),
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        lesson_type: lessonType,
      },
      editingId
    );
    resetForm();
  };

  const groupNames = new Map(
    groups.map((group) => [group.id, group.name])
  );
  const roomNames = new Map(
    rooms.map((room) => [room.id, room.name])
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-manager-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2
              id="template-manager-title"
              className="text-lg font-bold text-gray-900"
            >
              Недельные шаблоны
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Настройте повторяющиеся занятия и сформируйте расписание.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[360px_1fr]">
          <form
            onSubmit={(event) => void submitForm(event)}
            className="space-y-4 border-b border-gray-100 p-5 lg:border-b-0 lg:border-r"
          >
            <h3 className="font-semibold text-gray-900">
              {editingId ? 'Изменить шаблон' : 'Новый шаблон'}
            </h3>
            <select
              required
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5"
              aria-label="Группа"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <select
              required
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5"
              aria-label="Кабинет"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            <select
              value={weekday}
              onChange={(event) => setWeekday(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5"
              aria-label="День недели"
            >
              {DAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
                className="rounded-xl border border-gray-200 px-3 py-2.5"
                aria-label="Время начала"
              />
              <input
                required
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(event.target.value)
                }
                className="rounded-xl border border-gray-200 px-3 py-2.5"
                aria-label="Время окончания"
              />
            </div>
            <select
              value={lessonType}
              onChange={(event) =>
                setLessonType(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5"
              aria-label="Тип занятия"
            >
              <option value="regular">Основное занятие</option>
              <option value="extra">Дополнительное</option>
              <option value="consultation">Консультация</option>
              <option value="replacement">Замена</option>
              <option value="exam">Экзамен</option>
            </select>
            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold"
                >
                  Отмена
                </button>
              )}
              <button
                type="submit"
                disabled={
                  isSaving ||
                  !groupId ||
                  !roomId ||
                  endTime <= startTime
                }
                className="flex-1 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white disabled:bg-gray-300"
              >
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </form>

          <div className="space-y-3 p-5">
            {templates.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-500">
                Шаблонов пока нет.
              </p>
            ) : (
              templates.map((template) => (
                <article
                  key={template.id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {DAYS[template.weekday]}
                          {' · '}
                          {template.start_time.slice(0, 5)}–
                          {template.end_time.slice(0, 5)}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            template.is_active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {template.is_active
                            ? 'Активен'
                            : 'Неактивен'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {groupNames.get(template.group_id)}
                        {' · '}
                        {roomNames.get(template.room_id)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editTemplate(template)}
                        disabled={isSaving}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        aria-label="Изменить шаблон"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void onToggle(template)}
                        disabled={isSaving}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        aria-label={
                          template.is_active
                            ? 'Деактивировать шаблон'
                            : 'Активировать шаблон'
                        }
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      {template.is_active && (
                        <button
                          type="button"
                          onClick={() => {
                            setGenerationId(template.id);
                            setDateFrom('');
                            setDateTo('');
                          }}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Сформировать занятия
                        </button>
                      )}
                    </div>
                  </div>

                  {generationId === template.id && (
                    <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(event) =>
                          setDateFrom(event.target.value)
                        }
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        aria-label="Начало периода генерации"
                      />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(event) =>
                          setDateTo(event.target.value)
                        }
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        aria-label="Конец периода генерации"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          void onGenerate(
                            template,
                            dateFrom,
                            dateTo
                          )
                        }
                        disabled={
                          isSaving ||
                          !dateFrom ||
                          !dateTo ||
                          dateTo < dateFrom
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarDays className="h-4 w-4" />
                        )}
                        Создать
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
