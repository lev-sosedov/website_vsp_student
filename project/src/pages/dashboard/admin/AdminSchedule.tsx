import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react';

import {
  cancelLesson,
  completeLesson,
  createLesson,
  createScheduleTemplate,
  formatLocalDate,
  generateTemplateLessons,
  setScheduleTemplateActive,
  updateLesson,
  updateScheduleTemplate,
  type LessonCreate,
  type LessonSchedule,
  type ScheduleTemplate,
  type ScheduleTemplateCreate,
} from '../../../api/scheduleApi';
import AdminLessonModal from '../../../components/dashboard/admin/schedule/AdminLessonModal';
import AdminTemplateModal from '../../../components/dashboard/admin/schedule/AdminTemplateModal';
import { useAuth } from '../../../context/AuthContext';
import {
  getAdminGroupTeacherName,
} from '../../../services/adminGroupsService';
import {
  getScheduleGroupName,
  getScheduleRoomName,
  loadAdminSchedule,
  type AdminScheduleData,
} from '../../../services/adminScheduleService';

const EMPTY_DATA: AdminScheduleData = {
  groups: [],
  branches: [],
  directions: [],
  educationPlans: [],
  teachers: [],
  rooms: [],
  lessons: [],
  templates: [],
  changes: [],
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  regular: 'Основное',
  extra: 'Дополнительное',
  consultation: 'Консультация',
  replacement: 'Замена',
  exam: 'Экзамен',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Запланировано',
  completed: 'Завершено',
  cancelled: 'Отменено',
  rescheduled: 'Перенесено',
};

const CHANGE_LABELS: Record<string, string> = {
  created: 'Занятие создано',
  updated: 'Занятие изменено',
  cancelled: 'Занятие отменено',
  completed: 'Занятие завершено',
  rescheduled: 'Занятие перенесено',
};

type PageTab = 'calendar' | 'templates' | 'history';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as {
        detail?: string;
      };
      return parsed.detail ?? error.message;
    } catch {
      return error.message;
    }
  }

  return 'Не удалось выполнить операцию с расписанием';
}

export default function AdminSchedule() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const adminId = Number(user?.id);

  const [dateFrom, setDateFrom] = useState(
    formatLocalDate(addDays(new Date(), -7))
  );
  const [dateTo, setDateTo] = useState(
    formatLocalDate(addDays(new Date(), 60))
  );
  const [data, setData] =
    useState<AdminScheduleData>(EMPTY_DATA);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [pageError, setPageError] =
    useState<string | null>(null);
  const [modalError, setModalError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<PageTab>('calendar');
  const [searchValue, setSearchValue] =
    useState('');
  const [branchFilter, setBranchFilter] =
    useState('all');
  const [directionFilter, setDirectionFilter] =
    useState('all');
  const [planFilter, setPlanFilter] =
    useState('all');
  const [groupFilter, setGroupFilter] =
    useState('all');
  const [teacherFilter, setTeacherFilter] =
    useState('all');
  const [roomFilter, setRoomFilter] =
    useState('all');
  const [typeFilter, setTypeFilter] =
    useState('all');
  const [statusFilter, setStatusFilter] =
    useState('all');

  const [lessonModalOpen, setLessonModalOpen] =
    useState(false);
  const [templateModalOpen, setTemplateModalOpen] =
    useState(false);
  const [editingLesson, setEditingLesson] =
    useState<LessonSchedule | null>(null);

  const initialGroupId = useMemo(() => {
    const value = Number(searchParams.get('groupId'));
    return Number.isInteger(value) && value > 0
      ? value
      : null;
  }, [searchParams]);

  useEffect(() => {
    if (initialGroupId) {
      setGroupFilter(String(initialGroupId));
    }
  }, [initialGroupId]);

  const loadData = useCallback(async () => {
    if (dateTo < dateFrom) {
      setPageError(
        'Конечная дата не может быть раньше начальной'
      );
      return;
    }

    setIsLoading(true);
    setPageError(null);

    try {
      setData(
        await loadAdminSchedule(
          dateFrom,
          dateTo
        )
      );
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setSuccessMessage(null),
      4_000
    );
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const groupById = useMemo(
    () =>
      new Map(
        data.groups.map((item) => [
          item.group.id,
          item,
        ])
      ),
    [data.groups]
  );
  const teacherById = useMemo(
    () =>
      new Map(
        data.teachers.map((teacher) => [
          teacher.id,
          teacher,
        ])
      ),
    [data.teachers]
  );

  const filteredLessons = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return data.lessons.filter((lesson) => {
      const group = groupById.get(lesson.group_id);
      const teacher = teacherById.get(
        lesson.teacher_id
      );
      const searchable = [
        lesson.topic,
        lesson.description,
        group?.group.name,
        group?.branchName,
        group?.direction?.name,
        group?.educationPlan?.name,
        teacher
          ? getAdminGroupTeacherName(teacher)
          : '',
        getScheduleRoomName(
          lesson.room_id,
          data.rooms
        ),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        (!normalizedSearch ||
          searchable.includes(normalizedSearch)) &&
        (branchFilter === 'all' ||
          String(group?.group.branch_id) ===
            branchFilter) &&
        (directionFilter === 'all' ||
          String(group?.group.direction_id) ===
            directionFilter) &&
        (planFilter === 'all' ||
          String(
            group?.group.education_plan_id
          ) === planFilter) &&
        (groupFilter === 'all' ||
          String(lesson.group_id) ===
            groupFilter) &&
        (teacherFilter === 'all' ||
          String(lesson.teacher_id) ===
            teacherFilter) &&
        (roomFilter === 'all' ||
          String(lesson.room_id) ===
            roomFilter) &&
        (typeFilter === 'all' ||
          lesson.lesson_type === typeFilter) &&
        (statusFilter === 'all' ||
          lesson.status === statusFilter)
      );
    });
  }, [
    branchFilter,
    data.lessons,
    data.rooms,
    directionFilter,
    groupById,
    groupFilter,
    planFilter,
    roomFilter,
    searchValue,
    statusFilter,
    teacherById,
    teacherFilter,
    typeFilter,
  ]);

  const filteredTemplates = useMemo(
    () =>
      data.templates.filter((template) => {
        const group = groupById.get(
          template.group_id
        );

        return (
          (branchFilter === 'all' ||
            String(group?.group.branch_id) ===
              branchFilter) &&
          (directionFilter === 'all' ||
            String(
              group?.group.direction_id
            ) === directionFilter) &&
          (planFilter === 'all' ||
            String(
              group?.group.education_plan_id
            ) === planFilter) &&
          (groupFilter === 'all' ||
            String(template.group_id) ===
              groupFilter) &&
          (teacherFilter === 'all' ||
            String(template.teacher_id) ===
              teacherFilter) &&
          (roomFilter === 'all' ||
            String(template.room_id) ===
              roomFilter)
        );
      }),
    [
      branchFilter,
      data.templates,
      directionFilter,
      groupById,
      groupFilter,
      planFilter,
      roomFilter,
      teacherFilter,
    ]
  );

  const filteredChanges = useMemo(() => {
    const visibleLessonIds = new Set(
      filteredLessons.map((lesson) => lesson.id)
    );

    if (
      searchValue.trim() ||
      branchFilter !== 'all' ||
      directionFilter !== 'all' ||
      planFilter !== 'all' ||
      groupFilter !== 'all' ||
      teacherFilter !== 'all' ||
      roomFilter !== 'all' ||
      typeFilter !== 'all' ||
      statusFilter !== 'all'
    ) {
      return data.changes.filter((change) =>
        visibleLessonIds.has(change.lesson_id)
      );
    }

    return data.changes;
  }, [
    branchFilter,
    data.changes,
    directionFilter,
    filteredLessons,
    groupFilter,
    planFilter,
    roomFilter,
    searchValue,
    statusFilter,
    teacherFilter,
    typeFilter,
  ]);

  const groupedLessons = useMemo(() => {
    const groups = new Map<
      string,
      LessonSchedule[]
    >();

    filteredLessons.forEach((lesson) => {
      const current =
        groups.get(lesson.lesson_date) ?? [];
      current.push(lesson);
      groups.set(lesson.lesson_date, current);
    });

    return Array.from(groups.entries());
  }, [filteredLessons]);

  const finishMutation = async (
    message: string
  ) => {
    setSuccessMessage(message);
    await loadData();
  };

  const saveLessons = async (
    values: LessonCreate[],
    reason: string
  ) => {
    if (!adminId) {
      setModalError(
        'Не удалось определить администратора'
      );
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      if (editingLesson) {
        const value = values[0];
        await updateLesson(editingLesson.id, {
          group_id: value.group_id,
          teacher_id: value.teacher_id,
          room_id: value.room_id,
          template_id: value.template_id,
          lesson_date: value.lesson_date,
          start_time: value.start_time,
          end_time: value.end_time,
          lesson_type: value.lesson_type,
          topic: value.topic,
          description: value.description,
          is_extra: value.is_extra,
          changed_by: adminId,
          reason: reason || null,
        });
        setLessonModalOpen(false);
        setEditingLesson(null);
        await finishMutation(
          'Изменения занятия сохранены'
        );
        return;
      }

      const results = await Promise.allSettled(
        values.map((value) =>
          createLesson(value)
        )
      );
      const createdCount = results.filter(
        (result) =>
          result.status === 'fulfilled'
      ).length;
      const failed = results.filter(
        (result) =>
          result.status === 'rejected'
      );

      if (failed.length > 0) {
        const firstFailure = failed[0];
        const detail =
          firstFailure.status === 'rejected'
            ? getErrorMessage(firstFailure.reason)
            : '';
        setModalError(
          `Создано: ${createdCount}. Не создано: ${failed.length}. ${detail}`
        );
        await loadData();
        return;
      }

      setLessonModalOpen(false);
      await finishMutation(
        values.length > 1
          ? `Создано занятий для групп: ${values.length}`
          : 'Занятие добавлено в расписание'
      );
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const cancelSelectedLesson = async (
    lesson: LessonSchedule
  ) => {
    const reason = window.prompt(
      'Укажите причину отмены занятия'
    );

    if (!reason?.trim() || !adminId) {
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      await cancelLesson(
        lesson.id,
        adminId,
        reason.trim()
      );
      setLessonModalOpen(false);
      setEditingLesson(null);
      await finishMutation('Занятие отменено');
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const completeSelectedLesson = async (
    lesson: LessonSchedule
  ) => {
    if (
      !adminId ||
      !window.confirm(
        'Отметить занятие завершённым?'
      )
    ) {
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      await completeLesson(lesson.id, adminId);
      setLessonModalOpen(false);
      setEditingLesson(null);
      await finishMutation(
        'Занятие отмечено завершённым'
      );
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const saveTemplate = async (
    values: ScheduleTemplateCreate,
    templateId: number | null
  ) => {
    setIsSaving(true);
    setModalError(null);
    try {
      if (templateId) {
        await updateScheduleTemplate(
          templateId,
          values
        );
        await finishMutation(
          'Недельный шаблон изменён'
        );
      } else {
        await createScheduleTemplate(values);
        await finishMutation(
          'Недельный шаблон создан'
        );
      }
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTemplate = async (
    template: ScheduleTemplate
  ) => {
    setIsSaving(true);
    setModalError(null);
    try {
      await setScheduleTemplateActive(
        template.id,
        !template.is_active
      );
      await finishMutation(
        template.is_active
          ? 'Шаблон отключён'
          : 'Шаблон включён'
      );
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const generateLessons = async (
    template: ScheduleTemplate,
    from: string,
    to: string
  ) => {
    if (!adminId) {
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      const result =
        await generateTemplateLessons(
          template.id,
          {
            date_from: from,
            date_to: to,
            created_by: adminId,
            skip_conflicts: true,
          }
        );
      await finishMutation(
        `Создано занятий: ${result.created_count}. Пропущено конфликтов: ${result.skipped_count}.`
      );
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    setSearchValue('');
    setBranchFilter('all');
    setDirectionFilter('all');
    setPlanFilter('all');
    setGroupFilter('all');
    setTeacherFilter('all');
    setRoomFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const today = formatLocalDate(new Date());
  const todayCount = data.lessons.filter(
    (lesson) =>
      lesson.lesson_date === today &&
      lesson.status !== 'cancelled'
  ).length;
  const extraCount = data.lessons.filter(
    (lesson) =>
      lesson.is_extra &&
      lesson.status !== 'cancelled'
  ).length;
  const cancelledCount = data.lessons.filter(
    (lesson) => lesson.status === 'cancelled'
  ).length;

  const selectClassName =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Расписание
          </h1>
          <p className="mt-1 text-gray-500">
            Занятия всех филиалов, регулярные шаблоны и история изменений
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setTemplateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <CalendarRange className="h-4 w-4" />
            Регулярное расписание
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingLesson(null);
              setModalError(null);
              setLessonModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            <CalendarPlus className="h-4 w-4" />
            Добавить занятие
          </button>
        </div>
      </div>

      {successMessage && (
        <div
          className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {pageError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {pageError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Занятий в периоде',
            value: data.lessons.length,
            icon: CalendarDays,
            color: 'text-red-600 bg-red-50',
          },
          {
            label: 'Сегодня занятий',
            value: todayCount,
            icon: Clock3,
            color: 'text-green-600 bg-green-50',
          },
          {
            label: 'Дополнительных',
            value: extraCount,
            icon: CalendarPlus,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'Отменено',
            value: cancelledCount,
            icon: X,
            color: 'text-amber-600 bg-amber-50',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="stat-card"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-2.5 ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="card p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1.5 xl:col-span-2">
            <span className="text-xs font-medium text-gray-500">
              Поиск
            </span>
            <span className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(event.target.value)
                }
                placeholder="Группа, тема, преподаватель или кабинет"
                className={`${selectClassName} pl-9`}
              />
            </span>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">
              Период с
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(event.target.value)
              }
              className={selectClassName}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">
              Период по
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) =>
                setDateTo(event.target.value)
              }
              className={selectClassName}
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Сбросить фильтры
            </button>
          </div>

          <select
            value={branchFilter}
            onChange={(event) =>
              setBranchFilter(event.target.value)
            }
            className={selectClassName}
            aria-label="Филиал"
          >
            <option value="all">Все филиалы</option>
            {data.branches.map((branch) => (
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
          <select
            value={directionFilter}
            onChange={(event) =>
              setDirectionFilter(event.target.value)
            }
            className={selectClassName}
            aria-label="Направление"
          >
            <option value="all">
              Все направления
            </option>
            {data.directions.map((direction) => (
              <option
                key={direction.id}
                value={direction.id}
              >
                {direction.name}
              </option>
            ))}
          </select>
          <select
            value={planFilter}
            onChange={(event) =>
              setPlanFilter(event.target.value)
            }
            className={selectClassName}
            aria-label="Учебный план"
          >
            <option value="all">
              Все учебные планы
            </option>
            {data.educationPlans.map((plan) => (
              <option
                key={plan.id}
                value={plan.id}
              >
                {plan.name}
              </option>
            ))}
          </select>
          <select
            value={groupFilter}
            onChange={(event) =>
              setGroupFilter(event.target.value)
            }
            className={selectClassName}
            aria-label="Группа"
          >
            <option value="all">Все группы</option>
            {data.groups.map((item) => (
              <option
                key={item.group.id}
                value={item.group.id}
              >
                {item.group.name}
              </option>
            ))}
          </select>
          <select
            value={teacherFilter}
            onChange={(event) =>
              setTeacherFilter(event.target.value)
            }
            className={selectClassName}
            aria-label="Преподаватель"
          >
            <option value="all">
              Все преподаватели
            </option>
            {data.teachers.map((teacher) => (
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
          <select
            value={roomFilter}
            onChange={(event) =>
              setRoomFilter(event.target.value)
            }
            className={selectClassName}
            aria-label="Кабинет"
          >
            <option value="all">Все кабинеты</option>
            {data.rooms.map((room) => (
              <option
                key={room.id}
                value={room.id}
              >
                {room.name}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
            className={selectClassName}
            aria-label="Тип занятия"
          >
            <option value="all">
              Все типы занятий
            </option>
            {Object.entries(
              LESSON_TYPE_LABELS
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className={selectClassName}
            aria-label="Статус занятия"
          >
            <option value="all">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-4">
          {[
            {
              id: 'calendar' as const,
              label: 'Календарь занятий',
              icon: CalendarDays,
              count: filteredLessons.length,
            },
            {
              id: 'templates' as const,
              label: 'Недельные шаблоны',
              icon: CalendarRange,
              count: filteredTemplates.length,
            },
            {
              id: 'history' as const,
              label: 'История изменений',
              icon: History,
              count: filteredChanges.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeTab === tab.id
                      ? 'bg-white/20'
                      : 'bg-white'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : activeTab === 'calendar' ? (
          <div className="max-h-[680px] overflow-y-auto p-4 sm:p-5">
            {groupedLessons.length === 0 ? (
              <div className="py-24 text-center text-sm text-gray-500">
                По выбранным фильтрам занятий нет.
              </div>
            ) : (
              <div className="space-y-5">
                {groupedLessons.map(
                  ([date, lessons]) => (
                    <div key={date}>
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="font-bold capitalize text-gray-900">
                          {formatDate(date)}
                        </h2>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          {lessons.length}
                        </span>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                        {lessons.map((lesson) => {
                          const teacher =
                            teacherById.get(
                              lesson.teacher_id
                            );
                          const cancelled =
                            lesson.status ===
                            'cancelled';

                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => {
                                setEditingLesson(
                                  lesson
                                );
                                setModalError(null);
                                setLessonModalOpen(
                                  true
                                );
                              }}
                              className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                                cancelled
                                  ? 'border-red-100 bg-red-50/60'
                                  : 'border-gray-100 bg-white hover:border-red-100'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                                      {LESSON_TYPE_LABELS[
                                        lesson.lesson_type
                                      ] ??
                                        lesson.lesson_type}
                                    </span>
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                      {getScheduleGroupName(
                                        lesson.group_id,
                                        data.groups
                                      )}
                                    </span>
                                  </div>
                                  <p className="mt-2 truncate font-semibold text-gray-900">
                                    {lesson.topic ??
                                      'Тема не указана'}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    cancelled
                                      ? 'bg-red-100 text-red-700'
                                      : lesson.status ===
                                          'completed'
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {STATUS_LABELS[
                                    lesson.status
                                  ] ?? lesson.status}
                                </span>
                              </div>
                              <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                                <p className="flex items-center gap-2">
                                  <Clock3 className="h-4 w-4" />
                                  {lesson.start_time.slice(
                                    0,
                                    5
                                  )}
                                  –
                                  {lesson.end_time.slice(
                                    0,
                                    5
                                  )}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {teacher
                                    ? getAdminGroupTeacherName(
                                        teacher
                                      )
                                    : 'Преподаватель не найден'}
                                </p>
                                <p className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {getScheduleRoomName(
                                    lesson.room_id,
                                    data.rooms
                                  )}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'templates' ? (
          <div className="max-h-[680px] overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="py-24 text-center text-sm text-gray-500">
                Шаблонов по выбранным фильтрам нет.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTemplates.map(
                  (template) => {
                    const teacher =
                      teacherById.get(
                        template.teacher_id
                      );
                    return (
                      <div
                        key={template.id}
                        className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {
                              [
                                'Понедельник',
                                'Вторник',
                                'Среда',
                                'Четверг',
                                'Пятница',
                                'Суббота',
                                'Воскресенье',
                              ][template.weekday]
                            }
                            {' · '}
                            {template.start_time.slice(
                              0,
                              5
                            )}
                            –
                            {template.end_time.slice(
                              0,
                              5
                            )}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {getScheduleGroupName(
                              template.group_id,
                              data.groups
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {teacher
                            ? getAdminGroupTeacherName(
                                teacher
                              )
                            : 'Преподаватель не найден'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getScheduleRoomName(
                            template.room_id,
                            data.rooms
                          )}
                        </p>
                        <span
                          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                            template.is_active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {template.is_active
                            ? 'Активен'
                            : 'Отключён'}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-[680px] overflow-y-auto">
            {filteredChanges.length === 0 ? (
              <div className="py-24 text-center text-sm text-gray-500">
                История изменений пока пуста.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredChanges.map((change) => {
                  const lesson =
                    data.lessons.find(
                      (item) =>
                        item.id ===
                        change.lesson_id
                    );
                  const editor =
                    teacherById.get(
                      change.changed_by
                    );
                  return (
                    <div
                      key={change.id}
                      className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {CHANGE_LABELS[
                            change.change_type
                          ] ??
                            change.change_type}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {lesson
                            ? getScheduleGroupName(
                                lesson.group_id,
                                data.groups
                              )
                            : `Занятие №${change.lesson_id}`}
                          {change.reason
                            ? ` · ${change.reason}`
                            : ''}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Изменил:{' '}
                          {change.changed_by === adminId
                            ? 'текущий администратор'
                            : editor
                              ? getAdminGroupTeacherName(
                                  editor
                                )
                              : `пользователь №${change.changed_by}`}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs text-gray-400">
                        {formatDateTime(
                          change.created_at
                        )}
                      </time>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <AdminLessonModal
        isOpen={lessonModalOpen}
        lesson={editingLesson}
        groups={data.groups}
        rooms={data.rooms}
        teachers={data.teachers}
        adminId={adminId}
        initialGroupId={
          groupFilter !== 'all'
            ? Number(groupFilter)
            : initialGroupId
        }
        isSaving={isSaving}
        error={modalError}
        onClose={() => {
          if (!isSaving) {
            setLessonModalOpen(false);
            setEditingLesson(null);
          }
        }}
        onSubmit={saveLessons}
        onCancel={cancelSelectedLesson}
        onComplete={completeSelectedLesson}
      />

      <AdminTemplateModal
        isOpen={templateModalOpen}
        groups={data.groups}
        teachers={data.teachers}
        rooms={data.rooms}
        templates={filteredTemplates}
        isSaving={isSaving}
        error={modalError}
        onClose={() => {
          if (!isSaving) {
            setTemplateModalOpen(false);
          }
        }}
        onSave={saveTemplate}
        onToggle={toggleTemplate}
        onGenerate={generateLessons}
      />
    </div>
  );
}
