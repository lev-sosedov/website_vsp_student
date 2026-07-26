import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  CalendarRange,
  Loader2,
  Pencil,
  Play,
  Power,
  X,
} from 'lucide-react';

import type {
  LessonType,
  Room,
  ScheduleTemplate,
  ScheduleTemplateCreate,
} from '../../../../api/scheduleApi';
import type { UserProfile } from '../../../../api/userApi';
import {
  getAdminGroupTeacherName,
  type AdminGroupItem,
} from '../../../../services/adminGroupsService';

interface AdminTemplateModalProps {
  isOpen: boolean;
  groups: AdminGroupItem[];
  teachers: UserProfile[];
  rooms: Room[];
  templates: ScheduleTemplate[];
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (
    values: ScheduleTemplateCreate,
    templateId: number | null
  ) => Promise<void>;
  onToggle: (
    template: ScheduleTemplate
  ) => Promise<void>;
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

function addMonths(date: Date, months: number): string {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result.toISOString().slice(0, 10);
}

export default function AdminTemplateModal({
  isOpen,
  groups,
  teachers,
  rooms,
  templates,
  isSaving,
  error,
  onClose,
  onSave,
  onToggle,
  onGenerate,
}: AdminTemplateModalProps) {
  const [editingId, setEditingId] =
    useState<number | null>(null);
  const [groupId, setGroupId] = useState('');
  const [teacherId, setTeacherId] =
    useState('');
  const [roomId, setRoomId] = useState('');
  const [weekday, setWeekday] = useState('0');
  const [startTime, setStartTime] =
    useState('18:00');
  const [endTime, setEndTime] =
    useState('19:30');
  const [lessonType, setLessonType] =
    useState<LessonType>('regular');
  const [generationId, setGenerationId] =
    useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const activeGroups = useMemo(
    () =>
      groups.filter(
        (item) =>
          item.group.is_active !== false &&
          !item.group.is_closed
      ),
    [groups]
  );

  const selectedGroup = activeGroups.find(
    (item) =>
      String(item.group.id) === groupId
  );

  const availableRooms = rooms.filter(
    (room) =>
      room.is_active !== false &&
      (!selectedGroup?.group.branch_id ||
        room.branch_id ===
          selectedGroup.group.branch_id)
  );

  const resetForm = () => {
    const group = activeGroups[0];
    setEditingId(null);
    setGroupId(String(group?.group.id ?? ''));
    setTeacherId(
      String(
        group?.teacher?.id ??
          teachers[0]?.id ??
          ''
      )
    );
    setRoomId('');
    setWeekday('0');
    setStartTime('18:00');
    setEndTime('19:30');
    setLessonType('regular');
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const group = activeGroups[0];
    setEditingId(null);
    setGroupId(String(group?.group.id ?? ''));
    setTeacherId(
      String(
        group?.teacher?.id ??
          teachers[0]?.id ??
          ''
      )
    );
    setRoomId('');
    setWeekday('0');
    setStartTime('18:00');
    setEndTime('19:30');
    setLessonType('regular');
    setGenerationId(null);
  }, [activeGroups, isOpen, teachers]);

  useEffect(() => {
    if (
      availableRooms.some(
        (room) => String(room.id) === roomId
      )
    ) {
      return;
    }

    setRoomId(
      String(availableRooms[0]?.id ?? '')
    );
  }, [availableRooms, roomId]);

  if (!isOpen) {
    return null;
  }

  const editTemplate = (
    template: ScheduleTemplate
  ) => {
    setEditingId(template.id);
    setGroupId(String(template.group_id));
    setTeacherId(String(template.teacher_id));
    setRoomId(String(template.room_id));
    setWeekday(String(template.weekday));
    setStartTime(
      template.start_time.slice(0, 5)
    );
    setEndTime(template.end_time.slice(0, 5));
    setLessonType(template.lesson_type);
  };

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await onSave(
      {
        group_id: Number(groupId),
        teacher_id: Number(teacherId),
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
    groups.map((item) => [
      item.group.id,
      item.group.name,
    ])
  );
  const teacherNames = new Map(
    teachers.map((teacher) => [
      teacher.id,
      getAdminGroupTeacherName(teacher),
    ])
  );
  const roomNames = new Map(
    rooms.map((room) => [
      room.id,
      room.name,
    ])
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-template-title"
    >
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <CalendarRange className="h-5 w-5 text-red-600" />
            <div>
              <h2
                id="admin-template-title"
                className="text-lg font-bold text-gray-900"
              >
                Регулярное расписание
              </h2>
              <p className="text-sm text-gray-500">
                Недельные шаблоны и генерация конкретных занятий.
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
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[380px_1fr]">
          <form
            onSubmit={(event) => void submit(event)}
            className="space-y-4 border-b border-gray-100 p-5 lg:border-b-0 lg:border-r"
          >
            <h3 className="font-semibold text-gray-900">
              {editingId
                ? 'Изменить шаблон'
                : 'Новый недельный шаблон'}
            </h3>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-500">
                Группа
              </span>
              <select
                required
                value={groupId}
                onChange={(event) =>
                  setGroupId(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5"
              >
                {activeGroups.map((item) => (
                  <option
                    key={item.group.id}
                    value={item.group.id}
                  >
                    {item.group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-500">
                Преподаватель
              </span>
              <select
                required
                value={teacherId}
                onChange={(event) =>
                  setTeacherId(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5"
              >
                {teachers
                  .filter(
                    (teacher) =>
                      teacher.is_active !== false
                  )
                  .map((teacher) => (
                    <option
                      key={teacher.id}
                      value={teacher.id}
                    >
                      {getAdminGroupTeacherName(
                        teacher
                      )}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-500">
                Кабинет
              </span>
              <select
                required
                value={roomId}
                onChange={(event) =>
                  setRoomId(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5"
              >
                {availableRooms.map((room) => (
                  <option
                    key={room.id}
                    value={room.id}
                  >
                    {room.name}
                  </option>
                ))}
              </select>
            </label>

            <select
              value={weekday}
              onChange={(event) =>
                setWeekday(event.target.value)
              }
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
              <option value="regular">
                Основное занятие
              </option>
              <option value="consultation">
                Консультация
              </option>
              <option value="replacement">
                Замена
              </option>
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
                  !teacherId ||
                  !roomId ||
                  endTime <= startTime
                }
                className="flex-1 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white disabled:bg-gray-300"
              >
                {editingId
                  ? 'Сохранить'
                  : 'Добавить'}
              </button>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </form>

          <div className="min-w-0 space-y-3 p-5">
            {templates.length === 0 ? (
              <p className="py-20 text-center text-sm text-gray-500">
                Недельных шаблонов пока нет.
              </p>
            ) : (
              templates.map((template) => (
                <article
                  key={template.id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {DAYS[template.weekday]}
                          {' · '}
                          {template.start_time.slice(0, 5)}
                          –
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
                        {groupNames.get(
                          template.group_id
                        )}
                        {' · '}
                        {teacherNames.get(
                          template.teacher_id
                        )}
                        {' · '}
                        {roomNames.get(template.room_id)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editTemplate(template)
                        }
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void onToggle(template)
                        }
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700"
                      >
                        <Power className="h-3.5 w-3.5" />
                        {template.is_active
                          ? 'Отключить'
                          : 'Включить'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGenerationId(template.id);
                          setDateFrom(
                            new Date()
                              .toISOString()
                              .slice(0, 10)
                          );
                          setDateTo(
                            addMonths(new Date(), 3)
                          );
                        }}
                        disabled={
                          isSaving ||
                          !template.is_active
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-300"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Сформировать занятия
                      </button>
                    </div>
                  </div>

                  {generationId === template.id && (
                    <div className="mt-4 grid gap-3 rounded-xl bg-blue-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-blue-800">
                          С даты
                        </span>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(event) =>
                            setDateFrom(
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-blue-100 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-blue-800">
                          По дату
                        </span>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(event) =>
                            setDateTo(
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-blue-100 px-3 py-2 text-sm"
                        />
                      </label>
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
                        {isSaving && (
                          <Loader2 className="h-4 w-4 animate-spin" />
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
