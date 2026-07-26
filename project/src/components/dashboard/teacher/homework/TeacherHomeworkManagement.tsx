import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  FolderCog,
  Plus,
} from 'lucide-react';

import {
  getActiveUserGroups,
  getGroup,
  type AcademicGroup,
} from '../../../../api/academicApi';
import {
  createHomework,
  createHomeworkAttachment,
  deleteHomeworkAttachment,
  getHomeworkAttachments,
  getTeacherHomeworks,
  setHomeworkActive,
  setHomeworkAttachmentVisible,
  setHomeworkPublished,
  updateHomework,
  updateHomeworkAttachment,
  type CreateHomeworkAttachmentData,
  type CreateHomeworkData,
  type Homework,
  type HomeworkAttachment,
} from '../../../../api/homeworkApi';
import {
  getTeacherLessons,
  type LessonSchedule,
} from '../../../../api/scheduleApi';
import TeacherHomeworkAttachmentModal from './TeacherHomeworkAttachmentModal';
import TeacherHomeworkFormModal from './TeacherHomeworkFormModal';
import TeacherHomeworkManagerModal from './TeacherHomeworkManagerModal';

interface TeacherHomeworkManagementProps {
  teacherId: number;
  onChanged: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить операцию с домашним заданием';
}

export default function TeacherHomeworkManagement({
  teacherId,
  onChanged,
}: TeacherHomeworkManagementProps) {
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [lessons, setLessons] = useState<LessonSchedule[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [attachments, setAttachments] = useState<
    Map<number, HomeworkAttachment[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionKey, setActionKey] =
    useState<string | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHomework, setEditingHomework] =
    useState<Homework | null>(null);
  const [attachmentHomework, setAttachmentHomework] =
    useState<Homework | null>(null);
  const [editingAttachment, setEditingAttachment] =
    useState<HomeworkAttachment | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const memberships = await getActiveUserGroups(
        teacherId
      );
      const groupIds = Array.from(
        new Set(
          memberships
            .filter(
              (membership) =>
                membership.role === 'teacher' ||
                membership.role === 'assistant'
            )
            .map((membership) => membership.group_id)
        )
      );

      const [loadedGroups, loadedLessons, loadedHomeworks] =
        await Promise.all([
          Promise.all(groupIds.map((id) => getGroup(id))),
          getTeacherLessons(teacherId),
          getTeacherHomeworks(teacherId),
        ]);

      const attachmentEntries = await Promise.all(
        loadedHomeworks.map(async (homework) => [
          homework.id,
          await getHomeworkAttachments(homework.id),
        ] as const)
      );

      loadedGroups.sort((first, second) =>
        first.name.localeCompare(second.name, 'ru')
      );
      loadedLessons.sort((first, second) => {
        const date = first.lesson_date.localeCompare(
          second.lesson_date
        );
        return date || first.start_time.localeCompare(second.start_time);
      });
      loadedHomeworks.sort((first, second) =>
        second.created_at.localeCompare(first.created_at)
      );

      setGroups(loadedGroups);
      setLessons(loadedLessons);
      setHomeworks(loadedHomeworks);
      setAttachments(new Map(attachmentEntries));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setSuccess(null),
      4000
    );
    return () => window.clearTimeout(timeoutId);
  }, [success]);

  const availableLessons = useMemo(() => {
    if (editingHomework) {
      return lessons;
    }

    const usedLessonIds = new Set(
      homeworks.map((homework) => homework.lesson_id)
    );
    return lessons.filter(
      (lesson) =>
        !usedLessonIds.has(lesson.id) &&
        lesson.status !== 'cancelled'
    );
  }, [editingHomework, homeworks, lessons]);

  const finish = async (message: string) => {
    setSuccess(message);
    await Promise.all([loadData(), onChanged()]);
  };

  const saveHomework = async (
    values: CreateHomeworkData
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      if (editingHomework) {
        await updateHomework(editingHomework.id, {
          title: values.title,
          description: values.description,
          instructions: values.instructions,
          max_score: values.max_score,
          due_at: values.due_at,
          allow_late_submission:
            values.allow_late_submission,
          updated_by: teacherId,
        });
        await finish('Домашнее задание изменено');
      } else {
        await createHomework(values);
        await finish(
          values.is_published
            ? 'Задание создано и опубликовано'
            : 'Черновик задания создан'
        );
      }

      setFormOpen(false);
      setEditingHomework(null);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublication = async (
    homework: Homework
  ) => {
    const key = `homework-${homework.id}-publish`;
    setActionKey(key);
    setError(null);

    try {
      await setHomeworkPublished(
        homework.id,
        teacherId,
        !homework.is_published
      );
      await finish(
        homework.is_published
          ? 'Задание снято с публикации'
          : 'Задание опубликовано'
      );
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setActionKey(null);
    }
  };

  const toggleActive = async (homework: Homework) => {
    if (
      homework.is_active &&
      !window.confirm(
        `Убрать задание «${homework.title}» в архив?`
      )
    ) {
      return;
    }

    const key = `homework-${homework.id}-active`;
    setActionKey(key);
    setError(null);

    try {
      await setHomeworkActive(
        homework.id,
        teacherId,
        !homework.is_active
      );
      await finish(
        homework.is_active
          ? 'Задание убрано в архив'
          : 'Задание восстановлено'
      );
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setActionKey(null);
    }
  };

  const saveAttachment = async (
    values: CreateHomeworkAttachmentData
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      if (editingAttachment) {
        await updateHomeworkAttachment(
          editingAttachment.id,
          {
            title: values.title,
            attachment_type: values.attachment_type,
            file_url: values.file_url,
            file_name: values.file_name,
            mime_type: values.mime_type,
            file_size: values.file_size,
            sort_order: values.sort_order,
            updated_by: teacherId,
          }
        );
        await finish('Вложение изменено');
      } else {
        await createHomeworkAttachment(values);
        await finish('Вложение добавлено');
      }

      setAttachmentHomework(null);
      setEditingAttachment(null);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAttachmentVisibility = async (
    attachment: HomeworkAttachment
  ) => {
    const key = `attachment-${attachment.id}-visibility`;
    setActionKey(key);
    setError(null);

    try {
      await setHomeworkAttachmentVisible(
        attachment.id,
        teacherId,
        !attachment.is_visible
      );
      await finish(
        attachment.is_visible
          ? 'Вложение скрыто от студентов'
          : 'Вложение теперь видно студентам'
      );
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setActionKey(null);
    }
  };

  const removeAttachment = async (
    attachment: HomeworkAttachment
  ) => {
    if (
      !window.confirm(
        `Удалить вложение «${attachment.title}»?`
      )
    ) {
      return;
    }

    const key = `attachment-${attachment.id}-delete`;
    setActionKey(key);
    setError(null);

    try {
      await deleteHomeworkAttachment(
        attachment.id,
        teacherId
      );
      await finish('Вложение удалено');
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setActionKey(null);
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-red-600" />
              <h2 className="font-bold text-gray-900">
                Управление заданиями
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Создание, публикация, архив и вложения.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingHomework(null);
                setError(null);
                setFormOpen(true);
              }}
              disabled={
                isLoading || availableLessons.length === 0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-gray-300"
            >
              <Plus className="h-4 w-4" />
              Создать задание
            </button>
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FolderCog className="h-4 w-4" />
              Мои задания
            </button>
          </div>
        </div>

        {!isLoading &&
          availableLessons.length === 0 &&
          lessons.length > 0 && (
            <p className="mt-4 text-sm text-amber-700">
              Для всех доступных занятий домашние задания уже
              созданы. Новое задание можно добавить после
              создания нового занятия в расписании.
            </p>
          )}

        {success && (
          <p
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <TeacherHomeworkFormModal
        isOpen={formOpen}
        homework={editingHomework}
        teacherId={teacherId}
        lessons={availableLessons}
        groups={groups}
        isSaving={isSaving}
        error={error}
        onClose={() => {
          if (!isSaving) {
            setFormOpen(false);
            setEditingHomework(null);
          }
        }}
        onSubmit={saveHomework}
      />

      <TeacherHomeworkManagerModal
        isOpen={managerOpen}
        homeworks={homeworks}
        attachments={attachments}
        lessons={lessons}
        groups={groups}
        isLoading={isLoading}
        actionKey={actionKey}
        onClose={() => setManagerOpen(false)}
        onEdit={(homework) => {
          setEditingHomework(homework);
          setError(null);
          setFormOpen(true);
        }}
        onPublishToggle={(homework) =>
          void togglePublication(homework)
        }
        onActiveToggle={(homework) =>
          void toggleActive(homework)
        }
        onAddAttachment={(homework) => {
          setAttachmentHomework(homework);
          setEditingAttachment(null);
          setError(null);
        }}
        onEditAttachment={(homework, attachment) => {
          setAttachmentHomework(homework);
          setEditingAttachment(attachment);
          setError(null);
        }}
        onVisibilityToggle={(attachment) =>
          void toggleAttachmentVisibility(attachment)
        }
        onDeleteAttachment={(attachment) =>
          void removeAttachment(attachment)
        }
      />

      <TeacherHomeworkAttachmentModal
        homework={attachmentHomework}
        attachment={editingAttachment}
        teacherId={teacherId}
        isSaving={isSaving}
        error={error}
        onClose={() => {
          if (!isSaving) {
            setAttachmentHomework(null);
            setEditingAttachment(null);
          }
        }}
        onSubmit={saveAttachment}
      />
    </>
  );
}
