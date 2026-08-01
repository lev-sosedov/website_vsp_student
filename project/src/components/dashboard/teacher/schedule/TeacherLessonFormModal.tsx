import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import {
  AlertCircle,
  Calendar,
  Loader2,
  X,
} from 'lucide-react';

import type {
  AcademicGroup,
} from '../../../../api/academicApi';

import type {
  LessonCreate,
  LessonSchedule,
  LessonType,
  Room,
  ScheduleTemplate,
} from '../../../../api/scheduleApi';

interface TeacherLessonFormModalProps {
  isOpen: boolean;
  isSaving: boolean;
  teacherId: number;
  groups: AcademicGroup[];
  rooms: Room[];
  templates: ScheduleTemplate[];
  lesson: LessonSchedule | null;
  initialGroupId?: number | null;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: LessonCreate,
    reason: string
  ) => Promise<void>;
}

const LESSON_TYPES: Array<{
  value: LessonType;
  label: string;
}> = [
  {
    value: 'regular',
    label: 'Основное занятие',
  },
  {
    value: 'extra',
    label: 'Дополнительное',
  },
  {
    value: 'consultation',
    label: 'Консультация',
  },
  {
    value: 'replacement',
    label: 'Замена',
  },
  {
    value: 'exam',
    label: 'Экзамен',
  },
];

function toTimeInput(
  value?: string
): string {
  return value?.slice(
    0,
    5
  ) ?? '';
}

function getBackendWeekday(
  dateValue: string
): number | null {
  if (!dateValue) {
    return null;
  }

  const date = new Date(
    `${dateValue}T12:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  /*
   * JavaScript:
   * воскресенье = 0,
   * понедельник = 1.
   *
   * Backend:
   * понедельник = 0,
   * воскресенье = 6.
   */
  return (
    date.getDay() + 6
  ) % 7;
}

function getValidGroupId(
  groups: AcademicGroup[],
  candidates: Array<
    number | null | undefined
  >
): number | null {
  for (
    const candidate of candidates
  ) {
    if (
      candidate &&
      groups.some(
        (group) =>
          group.id === candidate
      )
    ) {
      return candidate;
    }
  }

  return groups[0]?.id ?? null;
}

function getRoomsForGroup(
  groupId: number | null,
  groups: AcademicGroup[],
  rooms: Room[]
): Room[] {
  if (!groupId) {
    return [];
  }

  const group = groups.find(
    (item) =>
      item.id === groupId
  );

  const branchId = Number(
    group?.branch_id
  );

  if (
    !Number.isInteger(
      branchId
    ) ||
    branchId <= 0
  ) {
    return [];
  }

  return rooms
    .filter(
      (room) =>
        room.is_active &&
        room.branch_id ===
          branchId
    )
    .sort(
      (
        first,
        second
      ) =>
        first.name.localeCompare(
          second.name,
          'ru'
        ) ||
        first.id - second.id
    );
}

function getPreferredRoomId(
  groupId: number | null,
  dateValue: string,
  startTime: string,
  availableRooms: Room[],
  templates: ScheduleTemplate[]
): string {
  if (
    !groupId ||
    availableRooms.length === 0
  ) {
    return '';
  }

  const availableRoomIds =
    new Set(
      availableRooms.map(
        (room) => room.id
      )
    );

  const weekday =
    getBackendWeekday(
      dateValue
    );

  const groupTemplates =
    templates.filter(
      (template) =>
        template.is_active &&
        template.group_id ===
          groupId &&
        availableRoomIds.has(
          template.room_id
        )
    );

  const exactTemplate =
    groupTemplates.find(
      (template) =>
        template.weekday ===
          weekday &&
        toTimeInput(
          template.start_time
        ) === startTime
    );

  if (exactTemplate) {
    return String(
      exactTemplate.room_id
    );
  }

  const sameDayTemplate =
    groupTemplates.find(
      (template) =>
        template.weekday ===
          weekday
    );

  if (sameDayTemplate) {
    return String(
      sameDayTemplate.room_id
    );
  }

  /*
   * Если у группы несколько недельных шаблонов,
   * считаем закреплённым тот кабинет,
   * который встречается чаще всего.
   */
  const roomUsage =
    new Map<
      number,
      number
    >();

  groupTemplates.forEach(
    (template) => {
      roomUsage.set(
        template.room_id,
        (
          roomUsage.get(
            template.room_id
          ) ?? 0
        ) + 1
      );
    }
  );

  const mostUsedRoom =
    [...roomUsage.entries()]
      .sort(
        (
          first,
          second
        ) =>
          second[1] -
            first[1] ||
          first[0] -
            second[0]
      )[0]?.[0];

  return String(
    mostUsedRoom ??
      availableRooms[0].id
  );
}

export default function TeacherLessonFormModal({
  isOpen,
  isSaving,
  teacherId,
  groups,
  rooms,
  templates,
  lesson,
  initialGroupId,
  error,
  onClose,
  onSubmit,
}: TeacherLessonFormModalProps) {
  const [
    groupId,
    setGroupId,
  ] = useState('');

  const [
    roomId,
    setRoomId,
  ] = useState('');

  const [
    lessonDate,
    setLessonDate,
  ] = useState('');

  const [
    startTime,
    setStartTime,
  ] = useState('18:00');

  const [
    endTime,
    setEndTime,
  ] = useState('19:30');

  const [
    lessonType,
    setLessonType,
  ] = useState<LessonType>(
    'regular'
  );

  const [
    topic,
    setTopic,
  ] = useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    reason,
    setReason,
  ] = useState('');

  const [
    roomWasChosenManually,
    setRoomWasChosenManually,
  ] = useState(false);

  const numericGroupId =
    Number(groupId);

  const availableRooms =
    useMemo(
      () =>
        getRoomsForGroup(
          Number.isInteger(
            numericGroupId
          ) &&
          numericGroupId > 0
            ? numericGroupId
            : null,
          groups,
          rooms
        ),
      [
        groups,
        numericGroupId,
        rooms,
      ]
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const nextGroupId =
      getValidGroupId(
        groups,
        [
          lesson?.group_id,
          initialGroupId,
        ]
      );

    const nextDate =
      lesson?.lesson_date ??
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    const nextStartTime =
      toTimeInput(
        lesson?.start_time
      ) ||
      '18:00';

    const nextEndTime =
      toTimeInput(
        lesson?.end_time
      ) ||
      '19:30';

    const nextRooms =
      getRoomsForGroup(
        nextGroupId,
        groups,
        rooms
      );

    const lessonRoomIsAvailable =
      Boolean(
        lesson &&
        nextRooms.some(
          (room) =>
            room.id ===
              lesson.room_id
        )
      );

    const nextRoomId =
      lessonRoomIsAvailable
        ? String(
            lesson?.room_id
          )
        : getPreferredRoomId(
            nextGroupId,
            nextDate,
            nextStartTime,
            nextRooms,
            templates
          );

    setGroupId(
      String(
        nextGroupId ?? ''
      )
    );

    setRoomId(
      nextRoomId
    );

    setLessonDate(
      nextDate
    );

    setStartTime(
      nextStartTime
    );

    setEndTime(
      nextEndTime
    );

    setLessonType(
      lesson?.lesson_type ??
      'regular'
    );

    setTopic(
      lesson?.topic ?? ''
    );

    setDescription(
      lesson?.description ??
      ''
    );

    setReason('');

    /*
     * При редактировании существующего занятия
     * сохраняем его текущий кабинет и не заменяем
     * автоматически при изменении даты или времени.
     */
    setRoomWasChosenManually(
      Boolean(lesson)
    );
  }, [
    groups,
    initialGroupId,
    isOpen,
    lesson,
    rooms,
    templates,
  ]);

  if (!isOpen) {
    return null;
  }

  const updateRoomAutomatically = (
    nextGroupId: number,
    nextDate: string,
    nextStartTime: string
  ) => {
    const nextRooms =
      getRoomsForGroup(
        nextGroupId,
        groups,
        rooms
      );

    setRoomId(
      getPreferredRoomId(
        nextGroupId,
        nextDate,
        nextStartTime,
        nextRooms,
        templates
      )
    );
  };

  const handleGroupChange = (
    value: string
  ) => {
    const nextGroupId =
      Number(value);

    setGroupId(value);
    setRoomWasChosenManually(
      false
    );

    updateRoomAutomatically(
      nextGroupId,
      lessonDate,
      startTime
    );
  };

  const handleDateChange = (
    value: string
  ) => {
    setLessonDate(value);

    if (
      !lesson &&
      !roomWasChosenManually
    ) {
      updateRoomAutomatically(
        numericGroupId,
        value,
        startTime
      );
    }
  };

  const handleStartTimeChange = (
    value: string
  ) => {
    setStartTime(value);

    if (
      !lesson &&
      !roomWasChosenManually
    ) {
      updateRoomAutomatically(
        numericGroupId,
        lessonDate,
        value
      );
    }
  };

  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await onSubmit(
      {
        group_id:
          Number(groupId),
        teacher_id:
          teacherId,
        room_id:
          Number(roomId),
        template_id:
          lesson?.template_id ??
          null,
        lesson_date:
          lessonDate,
        start_time:
          `${startTime}:00`,
        end_time:
          `${endTime}:00`,
        lesson_type:
          lessonType,
        topic:
          topic.trim() ||
          null,
        description:
          description.trim() ||
          null,
        is_extra:
          lessonType ===
          'extra',
        created_by:
          teacherId,
      },
      reason.trim()
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-lesson-form-title"
    >
      <form
        onSubmit={(
          event
        ) =>
          void handleSubmit(
            event
          )
        }
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
              <Calendar className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="teacher-lesson-form-title"
                className="text-lg font-bold text-gray-900"
              >
                {lesson
                  ? 'Изменить занятие'
                  : 'Добавить занятие'}
              </h2>

              <p className="text-sm text-gray-500">
                Кабинеты показываются только для филиала выбранной группы.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isSaving
            }
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-6 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Группа
            </span>

            <select
              required
              value={
                groupId
              }
              onChange={(
                event
              ) =>
                handleGroupChange(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            >
              {groups.map(
                (group) => (
                  <option
                    key={
                      group.id
                    }
                    value={
                      group.id
                    }
                  >
                    {group.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Кабинет
            </span>

            <select
              required
              value={
                roomId
              }
              onChange={(
                event
              ) => {
                setRoomId(
                  event.target.value
                );

                setRoomWasChosenManually(
                  true
                );
              }}
              disabled={
                availableRooms.length ===
                0
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option
                value=""
                disabled
              >
                {availableRooms.length ===
                0
                  ? 'В филиале нет доступных кабинетов'
                  : 'Выберите кабинет'}
              </option>

              {availableRooms.map(
                (room) => (
                  <option
                    key={
                      room.id
                    }
                    value={
                      room.id
                    }
                  >
                    {room.name}
                  </option>
                )
              )}
            </select>

            {availableRooms.length >
              0 && (
              <span className="block text-xs leading-5 text-gray-400">
                По умолчанию используется кабинет из недельного шаблона группы. Для этого занятия его можно изменить.
              </span>
            )}
          </label>

          {availableRooms.length ===
            0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:col-span-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <p>
                У выбранной группы не указан филиал или в её филиале нет активных кабинетов.
              </p>
            </div>
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Дата
            </span>

            <input
              required
              type="date"
              value={
                lessonDate
              }
              onChange={(
                event
              ) =>
                handleDateChange(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Тип занятия
            </span>

            <select
              value={
                lessonType
              }
              onChange={(
                event
              ) =>
                setLessonType(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            >
              {LESSON_TYPES.map(
                (type) => (
                  <option
                    key={
                      type.value
                    }
                    value={
                      type.value
                    }
                  >
                    {type.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Начало
            </span>

            <input
              required
              type="time"
              value={
                startTime
              }
              onChange={(
                event
              ) =>
                handleStartTimeChange(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Окончание
            </span>

            <input
              required
              type="time"
              value={
                endTime
              }
              onChange={(
                event
              ) =>
                setEndTime(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Тема занятия
            </span>

            <input
              value={
                topic
              }
              onChange={(
                event
              ) =>
                setTopic(
                  event.target.value
                )
              }
              placeholder="Например: Основы Python"
              maxLength={
                255
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Описание
            </span>

            <textarea
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target.value
                )
              }
              rows={
                3
              }
              maxLength={
                5000
              }
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>

          {lesson && (
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Причина изменения
              </span>

              <input
                value={
                  reason
                }
                onChange={(
                  event
                ) =>
                  setReason(
                    event.target.value
                  )
                }
                placeholder="Необязательно"
                maxLength={
                  1000
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </label>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isSaving
            }
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Отмена
          </button>

          <button
            type="submit"
            disabled={
              isSaving ||
              !groupId ||
              !roomId ||
              availableRooms.length ===
                0 ||
              endTime <=
                startTime
            }
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSaving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {lesson
              ? 'Сохранить'
              : 'Создать занятие'}
          </button>
        </div>
      </form>
    </div>
  );
}
