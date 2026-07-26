import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';

import type {
  LessonCreate,
  LessonSchedule,
  LessonType,
  Room,
} from '../../../../api/scheduleApi';
import type { UserProfile } from '../../../../api/userApi';
import type { AdminGroupItem } from '../../../../services/adminGroupsService';
import {
  getAdminGroupTeacherName,
} from '../../../../services/adminGroupsService';

interface AdminLessonModalProps {
  isOpen: boolean;
  lesson: LessonSchedule | null;
  groups: AdminGroupItem[];
  rooms: Room[];
  teachers: UserProfile[];
  adminId: number;
  initialGroupId?: number | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    lessons: LessonCreate[],
    reason: string
  ) => Promise<void>;
  onCancel: (lesson: LessonSchedule) => Promise<void>;
  onComplete: (lesson: LessonSchedule) => Promise<void>;
}

const LESSON_TYPES: Array<{
  value: LessonType;
  label: string;
}> = [
  { value: 'regular', label: 'Основное занятие' },
  { value: 'extra', label: 'Дополнительное занятие' },
  { value: 'consultation', label: 'Консультация' },
  { value: 'replacement', label: 'Замена' },
  { value: 'exam', label: 'Экзамен' },
];

function userName(user: UserProfile): string {
  return getAdminGroupTeacherName(user);
}

function timeInput(value?: string): string {
  return value?.slice(0, 5) ?? '';
}

export default function AdminLessonModal({
  isOpen,
  lesson,
  groups,
  rooms,
  teachers,
  adminId,
  initialGroupId,
  isSaving,
  error,
  onClose,
  onSubmit,
  onCancel,
  onComplete,
}: AdminLessonModalProps) {
  const [audienceType, setAudienceType] =
    useState<'group' | 'direction'>('group');
  const [groupId, setGroupId] = useState('');
  const [directionId, setDirectionId] =
    useState('');
  const [branchId, setBranchId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [lessonDate, setLessonDate] =
    useState('');
  const [startTime, setStartTime] =
    useState('18:00');
  const [endTime, setEndTime] =
    useState('19:30');
  const [lessonType, setLessonType] =
    useState<LessonType>('extra');
  const [topic, setTopic] = useState('');
  const [description, setDescription] =
    useState('');
  const [reason, setReason] = useState('');

  const activeGroups = useMemo(
    () =>
      groups.filter(
        (item) =>
          item.group.is_active !== false &&
          !item.group.is_closed
      ),
    [groups]
  );

  const directions = useMemo(
    () =>
      Array.from(
        new Map(
          activeGroups.flatMap((item) =>
            item.direction
              ? [[item.direction.id, item.direction] as const]
              : []
          )
        ).values()
      ).sort((first, second) =>
        first.name.localeCompare(second.name, 'ru')
      ),
    [activeGroups]
  );

  const branches = useMemo(
    () =>
      Array.from(
        new Map(
          activeGroups.flatMap((item) =>
            item.branch
              ? [[item.branch.id, item.branch] as const]
              : []
          )
        ).values()
      ),
    [activeGroups]
  );

  const groupOptions = lesson
    ? groups
    : activeGroups;

  const selectedGroup = groupOptions.find(
    (item) => String(item.group.id) === groupId
  );

  const directionGroups = useMemo(
    () =>
      activeGroups.filter(
        (item) =>
          String(item.group.direction_id) ===
            directionId &&
          String(item.group.branch_id) === branchId
      ),
    [
      activeGroups,
      branchId,
      directionId,
    ]
  );

  const targetGroups = useMemo(() => {
    if (
      audienceType === 'direction' &&
      !directionGroups.some(
        (item) => item.group.id === selectedGroup?.group.id
      )
    ) {
      return [];
    }

    return selectedGroup ? [selectedGroup] : [];
  }, [
    audienceType,
    directionGroups,
    selectedGroup,
  ]);

  useEffect(() => {
    if (
      audienceType !== 'direction' ||
      lesson ||
      directionGroups.some(
        (item) => String(item.group.id) === groupId
      )
    ) {
      return;
    }

    setGroupId(
      String(directionGroups[0]?.group.id ?? '')
    );
  }, [
    audienceType,
    directionGroups,
    groupId,
    lesson,
  ]);

  const effectiveBranchId =
    audienceType === 'group'
      ? selectedGroup?.group.branch_id
      : Number(branchId);

  const availableRooms = rooms.filter(
    (room) =>
      room.is_active !== false &&
      (!effectiveBranchId ||
        room.branch_id === effectiveBranchId)
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const defaultGroup =
      groups.find(
        (item) =>
          item.group.id ===
          (lesson?.group_id ?? initialGroupId)
      ) ??
      activeGroups[0] ??
      groups[0];

    setAudienceType('group');
    setGroupId(
      String(
        lesson?.group_id ??
          defaultGroup?.group.id ??
          ''
      )
    );
    setDirectionId(
      String(defaultGroup?.group.direction_id ?? '')
    );
    setBranchId(
      String(defaultGroup?.group.branch_id ?? '')
    );
    setTeacherId(
      String(
        lesson?.teacher_id ??
          defaultGroup?.teacher?.id ??
          teachers[0]?.id ??
          ''
      )
    );
    setRoomId(String(lesson?.room_id ?? ''));
    setLessonDate(
      lesson?.lesson_date ??
        new Date().toISOString().slice(0, 10)
    );
    setStartTime(
      timeInput(lesson?.start_time) || '18:00'
    );
    setEndTime(
      timeInput(lesson?.end_time) || '19:30'
    );
    setLessonType(
      lesson?.lesson_type ?? 'extra'
    );
    setTopic(lesson?.topic ?? '');
    setDescription(lesson?.description ?? '');
    setReason('');
  }, [
    activeGroups,
    groups,
    initialGroupId,
    isOpen,
    lesson,
    teachers,
  ]);

  useEffect(() => {
    if (!isOpen || lesson) {
      return;
    }

    if (
      audienceType === 'group' &&
      selectedGroup?.teacher?.id
    ) {
      setTeacherId(
        String(selectedGroup.teacher.id)
      );
    }
  }, [
    audienceType,
    isOpen,
    lesson,
    selectedGroup,
  ]);

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

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const groupIds = lesson
      ? [lesson.group_id]
      : targetGroups.map(
          (item) => item.group.id
        );

    const values = groupIds.map(
      (targetGroupId): LessonCreate => ({
        group_id: targetGroupId,
        teacher_id: Number(teacherId),
        room_id: Number(roomId),
        template_id: lesson?.template_id ?? null,
        lesson_date: lessonDate,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        lesson_type: lessonType,
        topic: topic.trim() || null,
        description:
          description.trim() || null,
        is_extra: lessonType === 'extra',
        created_by: adminId,
      })
    );

    await onSubmit(values, reason.trim());
  };

  const isFinal =
    lesson?.status === 'cancelled' ||
    lesson?.status === 'completed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-lesson-title"
    >
      <form
        onSubmit={(event) =>
          void handleSubmit(event)
        }
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="admin-lesson-title"
                className="text-lg font-bold text-gray-900"
              >
                {lesson
                  ? 'Управление занятием'
                  : 'Добавить занятие'}
              </h2>
              <p className="text-sm text-gray-500">
                {lesson
                  ? 'Изменение, завершение или отмена занятия.'
                  : 'Можно создать занятие для группы или всех групп направления в выбранном филиале.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-6 sm:grid-cols-2">
          {!lesson && (
            <div className="sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Кому показать занятие
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setAudienceType('group')
                  }
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    audienceType === 'group'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  Одной группе
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAudienceType('direction')
                  }
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    audienceType === 'direction'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  Найти по направлению
                </button>
              </div>
            </div>
          )}

          {audienceType === 'group' || lesson ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Группа
              </span>
              <select
                required
                value={groupId}
                disabled={Boolean(lesson)}
                onChange={(event) =>
                  setGroupId(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              >
                {groupOptions.map((item) => (
                  <option
                    key={item.group.id}
                    value={item.group.id}
                  >
                    {item.group.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Направление
                </span>
                <select
                  required
                  value={directionId}
                  onChange={(event) =>
                    setDirectionId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
                >
                  <option value="">
                    Выберите направление
                  </option>
                  {directions.map((direction) => (
                    <option
                      key={direction.id}
                      value={direction.id}
                    >
                      {direction.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Филиал
                </span>
                <select
                  required
                  value={branchId}
                  onChange={(event) =>
                    setBranchId(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
                >
                  <option value="">
                    Выберите филиал
                  </option>
                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name ??
                        branch.title ??
                        `Филиал №${branch.id}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">
                  Группа выбранного направления
                </span>
                <select
                  required
                  value={groupId}
                  onChange={(event) =>
                    setGroupId(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
                >
                  <option value="">
                    Выберите группу
                  </option>
                  {directionGroups.map((item) => (
                    <option
                      key={item.group.id}
                      value={item.group.id}
                    >
                      {item.group.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 sm:col-span-2">
                Сейчас Schedule Service связывает одно
                занятие с одной группой. Направление и
                филиал помогают быстро найти нужную
                группу без риска создать конфликт
                преподавателя или кабинета.
              </p>
            </>
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Преподаватель
            </span>
            <select
              required
              value={teacherId}
              onChange={(event) =>
                setTeacherId(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            >
              <option value="">
                Выберите преподавателя
              </option>
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
                    {userName(teacher)}
                  </option>
                ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Кабинет
            </span>
            <select
              required
              value={roomId}
              onChange={(event) =>
                setRoomId(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            >
              <option value="">
                Выберите кабинет
              </option>
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

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Дата
            </span>
            <input
              required
              type="date"
              value={lessonDate}
              onChange={(event) =>
                setLessonDate(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Тип занятия
            </span>
            <select
              value={lessonType}
              onChange={(event) =>
                setLessonType(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            >
              {LESSON_TYPES.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Начало
            </span>
            <input
              required
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Окончание
            </span>
            <input
              required
              type="time"
              value={endTime}
              onChange={(event) =>
                setEndTime(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Тема
            </span>
            <input
              value={topic}
              onChange={(event) =>
                setTopic(event.target.value)
              }
              maxLength={255}
              placeholder="Например: Дополнительная практика по Blender"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Описание
            </span>
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={3}
              maxLength={5000}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
            />
          </label>

          {lesson && (
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Причина изменения
              </span>
              <input
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                maxLength={1000}
                placeholder="Например: изменён кабинет"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400"
              />
            </label>
          )}

          {error && (
            <p
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {lesson && !isFinal && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    void onCancel(lesson)
                  }
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Отменить занятие
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void onComplete(lesson)
                  }
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Завершить
                </button>
              </>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700"
            >
              Закрыть
            </button>
            {!isFinal && (
              <button
                type="submit"
                disabled={
                  isSaving ||
                  targetGroups.length === 0 ||
                  !teacherId ||
                  !roomId ||
                  endTime <= startTime
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-gray-300"
              >
                {isSaving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {lesson
                  ? 'Сохранить изменения'
                  : 'Создать занятие'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
