import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  Loader2,
  Settings,
} from 'lucide-react';

import {
  getActiveUserGroups,
  getGroup,
  type AcademicGroup,
} from '../../../api/academicApi';

import {
  createHomework,
  getTeacherHomeworks,
  setHomeworkPublished,
  updateHomework,
  type CreateHomeworkData,
  type Homework,
} from '../../../api/homeworkApi';

import {
  cancelLesson,
  completeLesson,
  createLesson,
  createScheduleTemplate,
  formatLocalDate,
  generateTemplateLessons,
  getRooms,
  getTeacherLessons,
  getTeacherScheduleTemplates,
  rescheduleLesson,
  setScheduleTemplateActive,
  updateLesson,
  updateScheduleTemplate,
  type LessonCreate,
  type LessonReschedule,
  type LessonSchedule,
  type Room,
  type ScheduleTemplate,
  type ScheduleTemplateCreate,
} from '../../../api/scheduleApi';

import TeacherLessonFormModal from '../../../components/dashboard/teacher/schedule/TeacherLessonFormModal';
import TeacherLessonManagerModal from '../../../components/dashboard/teacher/schedule/TeacherLessonManagerModal';
import TeacherRescheduleModal from '../../../components/dashboard/teacher/schedule/TeacherRescheduleModal';
import TeacherTemplateManagerModal from '../../../components/dashboard/teacher/schedule/TeacherTemplateManagerModal';
import TeacherLessonDetailsModal from '../../../components/dashboard/teacher/schedule/TeacherLessonDetailsModal';
import TeacherHomeworkFormModal from '../../../components/dashboard/teacher/homework/TeacherHomeworkFormModal';

import {
  useAuth,
} from '../../../context/AuthContext';

import Schedule from '../shared/Schedule';

function addDays(
  date: Date,
  days: number
): Date {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result;
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить операцию с расписанием';
}

function getValidBranchId(
  group: AcademicGroup | null | undefined
): number | null {
  const branchId = Number(
    group?.branch_id
  );

  return (
    Number.isInteger(branchId) &&
    branchId > 0
  )
    ? branchId
    : null;
}

export default function TeacherSchedule() {
  const {
    user,
  } = useAuth();

  const navigate = useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const teacherId = Number(user?.id);

  const [
    groups,
    setGroups,
  ] = useState<AcademicGroup[]>([]);

  /*
   * Здесь хранятся кабинеты только тех филиалов,
   * к которым относятся группы текущего преподавателя.
   * Кабинеты остальных филиалов в кабинет преподавателя
   * больше не загружаются.
   */
  const [
    rooms,
    setRooms,
  ] = useState<Room[]>([]);

  const [
    lessons,
    setLessons,
  ] = useState<LessonSchedule[]>([]);

  const [
    templates,
    setTemplates,
  ] = useState<ScheduleTemplate[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    actionLessonId,
    setActionLessonId,
  ] = useState<number | null>(null);

  const [
    formError,
    setFormError,
  ] = useState<string | null>(null);

  const [
    pageError,
    setPageError,
  ] = useState<string | null>(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [
    lessonFormOpen,
    setLessonFormOpen,
  ] = useState(false);

  const [
    managerOpen,
    setManagerOpen,
  ] = useState(false);

  const [
    templatesOpen,
    setTemplatesOpen,
  ] = useState(false);

  const [
    editingLesson,
    setEditingLesson,
  ] = useState<LessonSchedule | null>(
    null
  );

  const [
    reschedulingLesson,
    setReschedulingLesson,
  ] = useState<LessonSchedule | null>(
    null
  );

  const [
    selectedLesson,
    setSelectedLesson,
  ] = useState<LessonSchedule | null>(null);

  const [
    selectedLessonJustCreated,
    setSelectedLessonJustCreated,
  ] = useState(false);


  const [
    homeworkFormOpen,
    setHomeworkFormOpen,
  ] = useState(false);

  const [
    homeworkLesson,
    setHomeworkLesson,
  ] = useState<LessonSchedule | null>(null);

  const [
    editingHomework,
    setEditingHomework,
  ] = useState<Homework | null>(null);

  const [
    isSavingHomework,
    setIsSavingHomework,
  ] = useState(false);

  const [
    homeworkError,
    setHomeworkError,
  ] = useState<string | null>(null);

  const initialGroupId = useMemo(() => {
    const value = Number(
      searchParams.get('groupId')
    );

    return (
      Number.isInteger(value) &&
      value > 0
    )
      ? value
      : null;
  }, [
    searchParams,
  ]);

  const groupsById = useMemo(
    () =>
      new Map(
        groups.map(
          (group) => [
            group.id,
            group,
          ]
        )
      ),
    [
      groups,
    ]
  );

  const homeworkLessons = useMemo(
    () =>
      homeworkLesson
        ? [homeworkLesson]
        : [],
    [homeworkLesson]
  );

  const roomsForReschedulingLesson =
    useMemo(() => {
      if (!reschedulingLesson) {
        return [];
      }

      const group = groupsById.get(
        reschedulingLesson.group_id
      );

      const branchId =
        getValidBranchId(group);

      if (!branchId) {
        return [];
      }

      return rooms.filter(
        (room) =>
          room.is_active &&
          room.branch_id === branchId
      );
    }, [
      groupsById,
      reschedulingLesson,
      rooms,
    ]);

  const loadManagementData =
    useCallback(async () => {
      if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
      ) {
        setPageError(
          'Не удалось определить текущего преподавателя'
        );

        setIsLoading(false);

        return;
      }

      setIsLoading(true);
      setPageError(null);

      try {
        const memberships =
          await getActiveUserGroups(
            teacherId
          );

        const groupIds = Array.from(
          new Set(
            memberships
              .filter(
                (membership) =>
                  membership.role ===
                    'teacher' ||
                  membership.role ===
                    'assistant'
              )
              .map(
                (membership) =>
                  membership.group_id
              )
          )
        );

        const loadedGroups =
          await Promise.all(
            groupIds.map(
              (groupId) =>
                getGroup(groupId)
            )
          );

        loadedGroups.sort(
          (
            first,
            second
          ) =>
            first.name.localeCompare(
              second.name,
              'ru'
            )
        );

        const branchIds = Array.from(
          new Set(
            loadedGroups
              .map(
                (group) =>
                  getValidBranchId(group)
              )
              .filter(
                (
                  branchId
                ): branchId is number =>
                  branchId !== null
              )
          )
        );

        const [
          roomLists,
          loadedLessons,
          loadedTemplates,
        ] = await Promise.all([
          Promise.all(
            branchIds.map(
              (branchId) =>
                getRooms(
                  branchId,
                  true
                )
            )
          ),

          getTeacherLessons(
            teacherId,
            formatLocalDate(
              addDays(
                new Date(),
                -30
              )
            ),
            formatLocalDate(
              addDays(
                new Date(),
                180
              )
            )
          ),

          getTeacherScheduleTemplates(
            teacherId
          ),
        ]);

        /*
         * Один и тот же кабинет не должен повторяться,
         * даже если API когда-либо вернёт дубликаты.
         */
        const loadedRooms =
          Array.from(
            new Map(
              roomLists
                .flat()
                .filter(
                  (room) =>
                    room.is_active
                )
                .map(
                  (room) => [
                    room.id,
                    room,
                  ]
                )
            ).values()
          );

        loadedRooms.sort(
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

        loadedLessons.sort(
          (
            first,
            second
          ) => {
            const date =
              first.lesson_date.localeCompare(
                second.lesson_date
              );

            return (
              date ||
              first.start_time.localeCompare(
                second.start_time
              )
            );
          }
        );

        loadedTemplates.sort(
          (
            first,
            second
          ) =>
            first.weekday -
              second.weekday ||
            first.start_time.localeCompare(
              second.start_time
            )
        );

        setGroups(loadedGroups);
        setRooms(loadedRooms);
        setLessons(loadedLessons);
        setTemplates(
          loadedTemplates
        );
      } catch (error) {
        setPageError(
          getErrorMessage(error)
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      teacherId,
    ]);

  useEffect(() => {
    void loadManagementData();
  }, [
    loadManagementData,
  ]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId =
      window.setTimeout(
        () =>
          setSuccessMessage(
            null
          ),
        4000
      );

    return () =>
      window.clearTimeout(
        timeoutId
      );
  }, [
    successMessage,
  ]);

  const finishMutation =
    async (
      message: string
    ) => {
      setSuccessMessage(message);

      setRefreshKey(
        (value) => value + 1
      );

      await loadManagementData();
    };

  const saveLesson =
    async (
      values: LessonCreate,
      reason: string
    ) => {
      setIsSaving(true);
      setFormError(null);

      try {
        if (editingLesson) {
          await updateLesson(
            editingLesson.id,
            {
              group_id:
                values.group_id,
              teacher_id:
                values.teacher_id,
              room_id:
                values.room_id,
              template_id:
                values.template_id,
              lesson_date:
                values.lesson_date,
              start_time:
                values.start_time,
              end_time:
                values.end_time,
              lesson_type:
                values.lesson_type,
              topic:
                values.topic,
              description:
                values.description,
              is_extra:
                values.is_extra,
              changed_by:
                teacherId,
              reason:
                reason || null,
            }
          );

          await finishMutation(
            'Изменения занятия сохранены'
          );
        } else {
          const createdLesson =
            await createLesson(
              values
            );

          setSelectedLesson(createdLesson);
          setSelectedLessonJustCreated(true);

          await finishMutation(
            'Занятие добавлено в расписание'
          );
        }

        setLessonFormOpen(false);
        setEditingLesson(null);
      } catch (error) {
        setFormError(
          getErrorMessage(error)
        );
      } finally {
        setIsSaving(false);
      }
    };

  const cancelSelectedLesson =
    async (
      lesson: LessonSchedule
    ) => {
      const reason =
        window.prompt(
          'Укажите причину отмены занятия'
        );

      if (!reason?.trim()) {
        return;
      }

      setActionLessonId(
        lesson.id
      );

      try {
        await cancelLesson(
          lesson.id,
          teacherId,
          reason.trim()
        );

        await finishMutation(
          'Занятие отменено и сохранено в истории'
        );
      } catch (error) {
        setPageError(
          getErrorMessage(error)
        );
      } finally {
        setActionLessonId(
          null
        );
      }
    };

  const completeSelectedLesson =
    async (
      lesson: LessonSchedule
    ) => {
      if (
        !window.confirm(
          'Отметить это занятие завершённым?'
        )
      ) {
        return;
      }

      setActionLessonId(
        lesson.id
      );

      try {
        await completeLesson(
          lesson.id,
          teacherId
        );

        await finishMutation(
          'Занятие отмечено завершённым'
        );
      } catch (error) {
        setPageError(
          getErrorMessage(error)
        );
      } finally {
        setActionLessonId(
          null
        );
      }
    };

  const submitReschedule =
    async (
      payload: LessonReschedule
    ) => {
      if (!reschedulingLesson) {
        return;
      }

      setIsSaving(true);
      setFormError(null);

      try {
        await rescheduleLesson(
          reschedulingLesson.id,
          payload
        );

        setReschedulingLesson(
          null
        );

        await finishMutation(
          'Занятие перенесено'
        );
      } catch (error) {
        setFormError(
          getErrorMessage(error)
        );
      } finally {
        setIsSaving(false);
      }
    };

  const saveTemplate =
    async (
      values:
        ScheduleTemplateCreate,
      templateId: number | null
    ) => {
      setIsSaving(true);
      setFormError(null);

      try {
        if (templateId) {
          await updateScheduleTemplate(
            templateId,
            values
          );

          await finishMutation(
            'Шаблон расписания изменён'
          );
        } else {
          await createScheduleTemplate(
            values
          );

          await finishMutation(
            'Шаблон расписания создан'
          );
        }
      } catch (error) {
        setFormError(
          getErrorMessage(error)
        );
      } finally {
        setIsSaving(false);
      }
    };

  const toggleTemplate =
    async (
      template: ScheduleTemplate
    ) => {
      setIsSaving(true);
      setFormError(null);

      try {
        await setScheduleTemplateActive(
          template.id,
          !template.is_active
        );

        await finishMutation(
          template.is_active
            ? 'Шаблон деактивирован'
            : 'Шаблон активирован'
        );
      } catch (error) {
        setFormError(
          getErrorMessage(error)
        );
      } finally {
        setIsSaving(false);
      }
    };

  const generateLessons =
    async (
      template:
        ScheduleTemplate,
      dateFrom: string,
      dateTo: string
    ) => {
      setIsSaving(true);
      setFormError(null);

      try {
        const result =
          await generateTemplateLessons(
            template.id,
            {
              date_from:
                dateFrom,
              date_to:
                dateTo,
              created_by:
                teacherId,
              skip_conflicts:
                true,
            }
          );

        await finishMutation(
          `Создано занятий: ${result.created_count}. Пропущено конфликтов: ${result.skipped_count}.`
        );
      } catch (error) {
        setFormError(
          getErrorMessage(error)
        );
      } finally {
        setIsSaving(false);
      }
    };

  const openHomeworkForLesson =
    async (
      lesson: LessonSchedule
    ) => {
      const teacherHomeworks =
        await getTeacherHomeworks(
          teacherId
        );

      const lessonHomework =
        teacherHomeworks.find(
          (homework) =>
            homework.lesson_id ===
              lesson.id &&
            homework.is_active
        ) ??
        teacherHomeworks.find(
          (homework) =>
            homework.lesson_id ===
            lesson.id
        ) ??
        null;

      setHomeworkLesson(
        lesson
      );

      setEditingHomework(
        lessonHomework
      );

      setHomeworkError(
        null
      );

      setSelectedLesson(
        null
      );

      setSelectedLessonJustCreated(
        false
      );

      setHomeworkFormOpen(
        true
      );
    };

  const saveHomeworkFromSchedule =
    async (
      values: CreateHomeworkData
    ) => {
      setIsSavingHomework(
        true
      );

      setHomeworkError(
        null
      );

      try {
        if (editingHomework) {
          await updateHomework(
            editingHomework.id,
            {
              title:
                values.title,
              description:
                values.description,
              instructions:
                values.instructions,
              max_score:
                values.max_score,
              due_at:
                values.due_at,
              allow_late_submission:
                values.allow_late_submission,
              updated_by:
                teacherId,
            }
          );

          if (
            values.is_published !==
            editingHomework.is_published
          ) {
            await setHomeworkPublished(
              editingHomework.id,
              teacherId,
              values.is_published
            );
          }

          setSuccessMessage(
            values.is_published
              ? 'Домашнее задание сохранено и опубликовано'
              : 'Домашнее задание сохранено как черновик'
          );
        } else {
          await createHomework(
            values
          );

          setSuccessMessage(
            values.is_published
              ? 'Домашнее задание создано и опубликовано'
              : 'Черновик домашнего задания создан'
          );
        }

        setHomeworkFormOpen(
          false
        );

        setHomeworkLesson(
          null
        );

        setEditingHomework(
          null
        );
      } catch (error) {
        setHomeworkError(
          getErrorMessage(error)
        );
      } finally {
        setIsSavingHomework(
          false
        );
      }
    };

  const managementPanel = (
    <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-bold text-gray-900">
            Управление расписанием
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Создавайте занятия, переносите их и управляйте
            недельными шаблонами.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingLesson(
                null
              );

              setFormError(
                null
              );

              setLessonFormOpen(
                true
              );
            }}
            disabled={
              isLoading ||
              groups.length === 0
            }
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-gray-300"
          >
            <CalendarPlus className="h-4 w-4" />
            Добавить занятие
          </button>

          <button
            type="button"
            onClick={() =>
              setManagerOpen(
                true
              )
            }
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Управление занятиями
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError(
                null
              );

              setTemplatesOpen(
                true
              );
            }}
            disabled={
              isLoading ||
              groups.length === 0
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <CalendarRange className="h-4 w-4" />
            Недельные шаблоны
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаем инструменты управления…
        </p>
      )}

      {pageError && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </p>
      )}

      {successMessage && (
        <p
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </p>
      )}
    </section>
  );

  return (
    <>
      <Schedule
        managementPanel={
          managementPanel
        }
        refreshKey={
          refreshKey
        }
        onLessonClick={(lesson) => {
          setSelectedLesson(lesson);
          setSelectedLessonJustCreated(false);
        }}
      />

      {selectedLesson && (
        <TeacherLessonDetailsModal
          lesson={selectedLesson}
          groupName={
            groupsById.get(
              selectedLesson.group_id
            )?.name ??
            `Группа №${selectedLesson.group_id}`
          }
          teacherId={teacherId}
          justCreated={
            selectedLessonJustCreated
          }
          onClose={() => {
            setSelectedLesson(null);
            setSelectedLessonJustCreated(false);
          }}
          onEditLesson={() => {
            const lessonToEdit = selectedLesson;

            setSelectedLesson(null);
            setSelectedLessonJustCreated(false);
            setEditingLesson(lessonToEdit);
            setFormError(null);
            setLessonFormOpen(true);
          }}
          onOpenAttendance={() => {
            navigate(
              `/dashboard/attendance?groupId=${selectedLesson.group_id}&lessonId=${selectedLesson.id}`
            );
          }}
          onOpenHomework={() =>
            openHomeworkForLesson(
              selectedLesson
            )
          }
          onMaterialChanged={() => {
            setRefreshKey(
              (value) => value + 1
            );
          }}
        />
      )}

      <TeacherHomeworkFormModal
        isOpen={
          homeworkFormOpen
        }
        homework={
          editingHomework
        }
        teacherId={
          teacherId
        }
        lessons={
          homeworkLessons
        }
        groups={
          groups
        }
        isSaving={
          isSavingHomework
        }
        error={
          homeworkError
        }
        onClose={() => {
          if (
            !isSavingHomework
          ) {
            setHomeworkFormOpen(
              false
            );

            setHomeworkLesson(
              null
            );

            setEditingHomework(
              null
            );

            setHomeworkError(
              null
            );
          }
        }}
        onSubmit={
          saveHomeworkFromSchedule
        }
      />

      <TeacherLessonFormModal
        isOpen={
          lessonFormOpen
        }
        isSaving={
          isSaving
        }
        teacherId={
          teacherId
        }
        groups={
          groups
        }
        rooms={
          rooms
        }
        templates={
          templates
        }
        lesson={
          editingLesson
        }
        initialGroupId={
          initialGroupId
        }
        error={
          formError
        }
        onClose={() => {
          if (!isSaving) {
            setLessonFormOpen(
              false
            );

            setEditingLesson(
              null
            );
          }
        }}
        onSubmit={
          saveLesson
        }
      />

      <TeacherLessonManagerModal
        isOpen={
          managerOpen
        }
        lessons={
          lessons
        }
        groups={
          groups
        }
        rooms={
          rooms
        }
        isLoading={
          isLoading
        }
        actionLessonId={
          actionLessonId
        }
        onClose={() =>
          setManagerOpen(
            false
          )
        }
        onEdit={(
          lesson
        ) => {
          setEditingLesson(
            lesson
          );

          setFormError(
            null
          );

          setLessonFormOpen(
            true
          );
        }}
        onReschedule={(
          lesson
        ) => {
          setReschedulingLesson(
            lesson
          );

          setFormError(
            null
          );
        }}
        onCancel={(
          lesson
        ) =>
          void cancelSelectedLesson(
            lesson
          )
        }
        onComplete={(
          lesson
        ) =>
          void completeSelectedLesson(
            lesson
          )
        }
      />

      <TeacherRescheduleModal
        lesson={
          reschedulingLesson
        }
        rooms={
          roomsForReschedulingLesson
        }
        teacherId={
          teacherId
        }
        isSaving={
          isSaving
        }
        error={
          formError
        }
        onClose={() => {
          if (!isSaving) {
            setReschedulingLesson(
              null
            );
          }
        }}
        onSubmit={
          submitReschedule
        }
      />

      <TeacherTemplateManagerModal
        isOpen={
          templatesOpen
        }
        teacherId={
          teacherId
        }
        groups={
          groups
        }
        rooms={
          rooms
        }
        templates={
          templates
        }
        isSaving={
          isSaving
        }
        error={
          formError
        }
        onClose={() => {
          if (!isSaving) {
            setTemplatesOpen(
              false
            );
          }
        }}
        onSave={
          saveTemplate
        }
        onToggle={
          toggleTemplate
        }
        onGenerate={
          generateLessons
        }
      />
    </>
  );
}
