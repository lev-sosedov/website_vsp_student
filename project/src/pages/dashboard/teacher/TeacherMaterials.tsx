import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertCircle,
  BookOpen,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  Search,
  Send,
} from 'lucide-react';

import {
  getActiveUserGroups,
  getGroup,
} from '../../../api/academicApi';
import {
  createLessonAttachment,
  createLessonContent,
  createLessonLink,
  deleteLessonAttachment,
  deleteLessonContent,
  deleteLessonLink,
  getLessonAttachments,
  getLessonContents,
  getLessonLinks,
  publishLessonContent,
  setLessonAttachmentVisibility,
  setLessonLinkVisibility,
  unpublishLessonContent,
  updateLessonAttachment,
  updateLessonContent,
  updateLessonLink,
  type CreateLessonAttachmentData,
  type LessonAttachment,
  type LessonLink,
} from '../../../api/contentApi';
import {
  detectAttachmentType,
  uploadMaterialFileToCloudinary,
} from '../../../api/cloudinaryApi';
import {
  getGroupLessons,
} from '../../../api/scheduleApi';
import {
  getUserById,
  type UserProfile,
} from '../../../api/userApi';
import TeacherMaterialCard, {
  type TeacherMaterialCardItem,
} from '../../../components/dashboard/teacher/materials/TeacherMaterialCard';
import TeacherMaterialFormModal, {
  type TeacherMaterialFormValues,
  type TeacherMaterialGroupOption,
} from '../../../components/dashboard/teacher/materials/TeacherMaterialFormModal';
import TeacherMaterialResourceModal, {
  type TeacherMaterialResourceValues,
  type TeacherResourceKind,
} from '../../../components/dashboard/teacher/materials/TeacherMaterialResourceModal';
import TeacherMaterialsEmptyState from '../../../components/dashboard/teacher/materials/TeacherMaterialsEmptyState';
import TeacherMaterialsStatCard from '../../../components/dashboard/teacher/materials/TeacherMaterialsStatCard';
import { useAuth } from '../../../context/AuthContext';

type PublicationFilter =
  | 'all'
  | 'published'
  | 'draft';

interface MaterialModalState {
  mode: 'create' | 'edit';
  item: TeacherMaterialCardItem | null;
}

interface ResourceModalState {
  kind: TeacherResourceKind;
  mode: 'create' | 'edit';
  item: TeacherMaterialCardItem;
  attachment: LessonAttachment | null;
  link: LessonLink | null;
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось выполнить действие';
}

function getTeacherName(
  profile: UserProfile | null
): string {
  if (!profile) {
    return 'Преподаватель';
  }

  return (
    [
      profile.user_name,
      profile.last_name,
    ]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ') || 'Преподаватель'
  );
}

function getFileNameFromUrl(
  url: string
): string | null {
  try {
    const pathname = new URL(url).pathname;
    const pathParts = pathname
      .split('/')
      .filter(Boolean);

    const fileName =
      pathParts[pathParts.length - 1];

    return fileName
      ? decodeURIComponent(fileName)
      : null;
  } catch {
    return null;
  }
}

function getResourceInitialValues(
  state: ResourceModalState
): TeacherMaterialResourceValues | undefined {
  if (
    state.kind === 'attachment' &&
    state.attachment
  ) {
    return {
      title: state.attachment.title,
      url: state.attachment.file_url,
      description: '',
      attachmentType:
        state.attachment.attachment_type,
      sortOrder:
        state.attachment.sort_order,
      isVisible:
        state.attachment.is_visible,
      fileName:
        state.attachment.file_name,
      mimeType:
        state.attachment.mime_type,
      fileSize:
        state.attachment.file_size,
    };
  }

  if (state.kind === 'link' && state.link) {
    return {
      title: state.link.title,
      url: state.link.url,
      description:
        state.link.description ?? '',
      attachmentType: 'other',
      sortOrder: state.link.sort_order,
      isVisible: state.link.is_visible,
      fileName: null,
      mimeType: null,
      fileSize: null,
    };
  }

  return undefined;
}

export default function TeacherMaterials() {
  const { user } = useAuth();
  const teacherId = Number(user?.id);

  const [groups, setGroups] = useState<
    TeacherMaterialGroupOption[]
  >([]);

  const [items, setItems] = useState<
    TeacherMaterialCardItem[]
  >([]);

  const [teacherName, setTeacherName] =
    useState('Преподаватель');

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | 'all'>('all');

  const [
    publicationFilter,
    setPublicationFilter,
  ] =
    useState<PublicationFilter>('all');

  const [materialModal, setMaterialModal] =
    useState<MaterialModalState | null>(
      null
    );

  const [resourceModal, setResourceModal] =
    useState<ResourceModalState | null>(
      null
    );

  const [isModalSaving, setIsModalSaving] =
    useState(false);

  const [modalError, setModalError] =
    useState<string | null>(null);

  const [busyAction, setBusyAction] =
    useState<string | null>(null);

  const loadMaterials = useCallback(
    async (showLoader = true) => {
      if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
      ) {
        setGroups([]);
        setItems([]);
        setError(
          'Не удалось определить преподавателя'
        );
        setIsLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setIsLoading(true);
        }

        setError(null);

        const [
          memberships,
          profile,
          contents,
        ] = await Promise.all([
          getActiveUserGroups(teacherId),
          getUserById(teacherId).catch(
            () => null
          ),
          getLessonContents({
            createdBy: teacherId,
            skip: 0,
            limit: 500,
          }),
        ]);

        const teacherMemberships =
          memberships.filter(
            (membership) =>
              membership.role ===
                'teacher' ||
              membership.role ===
                'assistant'
          );

        const uniqueGroupIds = [
          ...new Set(
            teacherMemberships.map(
              (membership) =>
                membership.group_id
            )
          ),
        ];

        const groupResults =
          await Promise.all(
            uniqueGroupIds.map(
              async (groupId) => {
                const [group, lessons] =
                  await Promise.all([
                    getGroup(groupId),
                    getGroupLessons(groupId),
                  ]);

                return {
                  id: group.id,
                  name: group.name,
                  lessons: lessons
                    .filter(
                      (lesson) =>
                        lesson.status !==
                        'cancelled'
                    )
                    .sort(
                      (first, second) =>
                        `${second.lesson_date} ${second.start_time}`.localeCompare(
                          `${first.lesson_date} ${first.start_time}`
                        )
                    ),
                };
              }
            )
          );

        groupResults.sort(
          (first, second) =>
            first.name.localeCompare(
              second.name,
              'ru'
            )
        );

        const lessonDirectory = new Map(
          groupResults.flatMap((group) =>
            group.lessons.map((lesson) => [
              lesson.id,
              {
                lesson,
                groupId: group.id,
                groupName: group.name,
              },
            ])
          )
        );

        const visibleContents =
          contents.filter((content) =>
            lessonDirectory.has(
              content.lesson_id
            )
          );

        const preparedItems =
          await Promise.all(
            visibleContents.map(
              async (content) => {
                const lessonInfo =
                  lessonDirectory.get(
                    content.lesson_id
                  );

                if (!lessonInfo) {
                  return null;
                }

                const [
                  attachments,
                  links,
                ] = await Promise.all([
                  getLessonAttachments({
                    lessonContentId:
                      content.id,
                    skip: 0,
                    limit: 500,
                  }),
                  getLessonLinks({
                    lessonContentId:
                      content.id,
                    skip: 0,
                    limit: 500,
                  }),
                ]);

                return {
                  content,
                  lesson:
                    lessonInfo.lesson,
                  groupId:
                    lessonInfo.groupId,
                  groupName:
                    lessonInfo.groupName,
                  teacherName:
                    getTeacherName(profile),
                  attachments:
                    attachments.sort(
                      (first, second) =>
                        first.sort_order -
                          second.sort_order ||
                        first.id - second.id
                    ),
                  links: links.sort(
                    (first, second) =>
                      first.sort_order -
                        second.sort_order ||
                      first.id - second.id
                  ),
                } satisfies TeacherMaterialCardItem;
              }
            )
          );

        const nextItems =
          preparedItems.filter(
            (
              item
            ): item is TeacherMaterialCardItem =>
              item !== null
          );

        nextItems.sort(
          (first, second) =>
            `${second.lesson.lesson_date} ${second.lesson.start_time}`.localeCompare(
              `${first.lesson.lesson_date} ${first.lesson.start_time}`
            )
        );

        setGroups(groupResults);
        setItems(nextItems);
        setTeacherName(
          getTeacherName(profile)
        );
      } catch (loadError) {
        setGroups([]);
        setItems([]);
        setError(
          `Не удалось загрузить материалы: ${getErrorMessage(
            loadError
          )}`
        );
      } finally {
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [teacherId]
  );

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    return items.filter((item) => {
      if (
        selectedGroupId !== 'all' &&
        item.groupId !== selectedGroupId
      ) {
        return false;
      }

      if (
        publicationFilter ===
          'published' &&
        !item.content.is_published
      ) {
        return false;
      }

      if (
        publicationFilter === 'draft' &&
        item.content.is_published
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        item.content.title,
        item.content.summary,
        item.content.content,
        item.groupName,
        item.lesson.topic,
        item.teacherName,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(normalizedSearch)
        );
    });
  }, [
    items,
    publicationFilter,
    searchQuery,
    selectedGroupId,
  ]);

  const stats = useMemo(
    () => ({
      total: items.length,
      published: items.filter(
        (item) =>
          item.content.is_published
      ).length,
      drafts: items.filter(
        (item) =>
          !item.content.is_published
      ).length,
      resources: items.reduce(
        (sum, item) =>
          sum +
          item.attachments.length +
          item.links.length,
        0
      ),
    }),
    [items]
  );

  const closeModals = () => {
    if (isModalSaving) {
      return;
    }

    setMaterialModal(null);
    setResourceModal(null);
    setModalError(null);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setError(null);
  };

  const handleMaterialSubmit = async (
    values: TeacherMaterialFormValues
  ) => {
    if (!materialModal) {
      return;
    }

    try {
      setIsModalSaving(true);
      setModalError(null);

      if (
        materialModal.mode ===
        'create'
      ) {
        const createdContent = await createLessonContent({
          lesson_id: values.lessonId,
          title: values.title,
          summary:
            values.summary || null,
          content:
            values.content || null,
          created_by: teacherId,
          is_published:
            values.publishImmediately,
        });

        let uploadError: string | null = null;
        if (values.file) {
          try {
            const upload = await uploadMaterialFileToCloudinary(values.file);
            const attachment: CreateLessonAttachmentData = {
              lesson_content_id: createdContent.id,
              title: values.file.name,
              attachment_type: detectAttachmentType(values.file),
              file_url: upload.secure_url,
              file_name: upload.original_filename ?? values.file.name,
              mime_type: values.file.type || 'application/octet-stream',
              file_size: upload.bytes ?? values.file.size,
              sort_order: 0,
              is_visible: true,
              uploaded_by: teacherId,
            };
            await createLessonAttachment(attachment);
          } catch (fileError) {
            uploadError = getErrorMessage(fileError);
          }
        }

        showSuccess(
          uploadError
            ? `Материал создан, но файл не добавлен: ${uploadError}`
            : 'Материал успешно создан'
        );
      } else if (materialModal.item) {
        await updateLessonContent(
          materialModal.item.content.id,
          {
            title: values.title,
            summary:
              values.summary || null,
            content:
              values.content || null,
            updated_by: teacherId,
          }
        );

        showSuccess(
          'Изменения материала сохранены'
        );
      }

      setMaterialModal(null);
      await loadMaterials(false);
    } catch (saveError) {
      setModalError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleTogglePublication = async (
    item: TeacherMaterialCardItem
  ) => {
    const action =
      `publication-${item.content.id}`;

    try {
      setBusyAction(action);
      setError(null);

      if (item.content.is_published) {
        await unpublishLessonContent(
          item.content.id,
          teacherId
        );

        showSuccess(
          'Материал снят с публикации'
        );
      } else {
        await publishLessonContent(
          item.content.id,
          teacherId
        );

        showSuccess(
          'Материал опубликован для студентов'
        );
      }

      await loadMaterials(false);
    } catch (actionError) {
      setError(
        getErrorMessage(actionError)
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleResourceSubmit = async (
    values: TeacherMaterialResourceValues
  ) => {
    if (!resourceModal) {
      return;
    }

    try {
      setIsModalSaving(true);
      setModalError(null);

      if (
        resourceModal.kind ===
        'attachment'
      ) {
        if (
          resourceModal.mode ===
          'create'
        ) {
          await createLessonAttachment({
            lesson_content_id:
              resourceModal.item.content.id,
            title: values.title,
            attachment_type:
              values.attachmentType,
            file_url: values.url,
            file_name:
              values.fileName ??
              getFileNameFromUrl(
                values.url
              ),
            mime_type: values.mimeType,
            file_size: values.fileSize,
            sort_order:
              values.sortOrder,
            is_visible:
              values.isVisible,
            uploaded_by: teacherId,
          });

          showSuccess(
            'Файл добавлен к материалу'
          );
        } else if (
          resourceModal.attachment
        ) {
          const attachment =
            resourceModal.attachment;

          await updateLessonAttachment(
            attachment.id,
            {
              title: values.title,
              attachment_type:
                values.attachmentType,
              file_url: values.url,
              file_name:
                values.fileName ??
                getFileNameFromUrl(
                  values.url
                ),
              mime_type: values.mimeType,
              file_size: values.fileSize,
              sort_order:
                values.sortOrder,
              updated_by: teacherId,
            }
          );

          if (
            values.isVisible !==
            attachment.is_visible
          ) {
            await setLessonAttachmentVisibility(
              attachment.id,
              values.isVisible,
              teacherId
            );
          }

          showSuccess(
            'Вложение изменено'
          );
        }
      } else if (
        resourceModal.mode === 'create'
      ) {
        await createLessonLink({
          lesson_content_id:
            resourceModal.item.content.id,
          title: values.title,
          url: values.url,
          description:
            values.description || null,
          sort_order: values.sortOrder,
          is_visible: values.isVisible,
          added_by: teacherId,
        });

        showSuccess(
          'Ссылка добавлена к материалу'
        );
      } else if (resourceModal.link) {
        const link = resourceModal.link;

        await updateLessonLink(link.id, {
          title: values.title,
          url: values.url,
          description:
            values.description || null,
          sort_order: values.sortOrder,
          updated_by: teacherId,
        });

        if (
          values.isVisible !==
          link.is_visible
        ) {
          await setLessonLinkVisibility(
            link.id,
            values.isVisible,
            teacherId
          );
        }

        showSuccess('Ссылка изменена');
      }

      setResourceModal(null);
      await loadMaterials(false);
    } catch (saveError) {
      setModalError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleDeleteMaterial = async (
    item: TeacherMaterialCardItem
  ) => {
    if (
      !window.confirm(
        `Удалить материал «${item.content.title}»? Он будет откреплён от занятия вместе со ссылками и вложениями.`
      )
    ) {
      return;
    }

    const action =
      `material-${item.content.id}-delete`;

    try {
      setBusyAction(action);
      setError(null);

      await deleteLessonContent(
        item.content.id,
        teacherId
      );

      showSuccess(
        'Материал удалён и откреплён от занятия'
      );

      await loadMaterials(false);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setBusyAction(null);
    }
  };

  const handleAttachmentVisibility =
    async (
      attachment: LessonAttachment
    ) => {
      const action =
        `attachment-${attachment.id}-visibility`;

      try {
        setBusyAction(action);
        setError(null);

        await setLessonAttachmentVisibility(
          attachment.id,
          !attachment.is_visible,
          teacherId
        );

        showSuccess(
          attachment.is_visible
            ? 'Вложение скрыто от студентов'
            : 'Вложение показано студентам'
        );

        await loadMaterials(false);
      } catch (actionError) {
        setError(
          getErrorMessage(actionError)
        );
      } finally {
        setBusyAction(null);
      }

    };

  const handleLinkVisibility = async (
    link: LessonLink
  ) => {
    const action =
      `link-${link.id}-visibility`;

    try {
      setBusyAction(action);
      setError(null);

      await setLessonLinkVisibility(
        link.id,
        !link.is_visible,
        teacherId
      );

      showSuccess(
        link.is_visible
          ? 'Ссылка скрыта от студентов'
          : 'Ссылка показана студентам'
      );

      await loadMaterials(false);
    } catch (actionError) {
      setError(
        getErrorMessage(actionError)
      );
    } finally {
      setBusyAction(null);
    }

  };

  const handleDeleteAttachment = async (
    attachment: LessonAttachment
  ) => {
    if (
      !window.confirm(
        `Удалить файл «${attachment.title}»?`
      )
    ) {
      return;
    }

    const action =
      `attachment-${attachment.id}-delete`;

    try {
      setBusyAction(action);
      setError(null);

      await deleteLessonAttachment(
        attachment.id,
        teacherId
      );

      showSuccess('Вложение удалено');
      await loadMaterials(false);
    } catch (actionError) {
      setError(
        getErrorMessage(actionError)
      );
    } finally {
      setBusyAction(null);
    }

  };

  const handleDeleteLink = async (
    link: LessonLink
  ) => {
    if (
      !window.confirm(
        `Удалить ссылку «${link.title}»?`
      )
    ) {
      return;
    }

    const action =
      `link-${link.id}-delete`;

    try {
      setBusyAction(action);
      setError(null);

      await deleteLessonLink(
        link.id,
        teacherId
      );

      showSuccess('Ссылка удалена');
      await loadMaterials(false);
    } catch (actionError) {
      setError(
        getErrorMessage(actionError)
      );
    } finally {
      setBusyAction(null);
    }

  };

  const hasLessons = groups.some(
    (group) => group.lessons.length > 0
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />

          <p className="mt-3 text-sm text-gray-500">
            Загружаем материалы преподавателя…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Материалы занятий
          </h1>

          <p className="mt-1 text-gray-500">
            Создание, публикация и управление материалами
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setMaterialModal({
              mode: 'create',
              item: null,
            });
          }}
          disabled={!hasLessons}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          <Plus className="h-4 w-4" />
          Добавить материал
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Send className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TeacherMaterialsStatCard
          label="Всего материалов"
          value={stats.total}
          icon={BookOpen}
          iconClassName="bg-red-50 text-red-600"
        />

        <TeacherMaterialsStatCard
          label="Опубликовано"
          value={stats.published}
          icon={Send}
          iconClassName="bg-green-50 text-green-600"
        />

        <TeacherMaterialsStatCard
          label="Черновиков"
          value={stats.drafts}
          icon={FileText}
          iconClassName="bg-amber-50 text-amber-600"
        />

        <TeacherMaterialsStatCard
          label="Файлов и ссылок"
          value={stats.resources}
          icon={LinkIcon}
          iconClassName="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_260px_220px]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Поиск
          </span>

          <span className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Название, группа или занятие"
              className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
            />
          </span>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Группа
          </span>

          <select
            value={selectedGroupId}
            onChange={(event) => {
              const value =
                event.target.value;

              setSelectedGroupId(
                value === 'all'
                  ? 'all'
                  : Number(value)
              );
            }}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
          >
            <option value="all">
              Все группы
            </option>

            {groups.map((group) => (
              <option
                key={group.id}
                value={group.id}
              >
                {group.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Статус
          </span>

          <select
            value={publicationFilter}
            onChange={(event) =>
              setPublicationFilter(
                event.target
                  .value as PublicationFilter
              )
            }
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
          >
            <option value="all">
              Все материалы
            </option>
            <option value="published">
              Опубликованные
            </option>
            <option value="draft">
              Черновики
            </option>
          </select>
        </label>
      </div>

      {groups.length === 0 ? (
        <TeacherMaterialsEmptyState
          title="Нет учебных групп"
          text="Преподаватель пока не назначен ни в одну активную группу."
        />
      ) : !hasLessons ? (
        <TeacherMaterialsEmptyState
          title="В группах нет занятий"
          text="Создайте расписание занятий, после чего к ним можно будет добавить материалы."
        />
      ) : items.length === 0 ? (
        <TeacherMaterialsEmptyState
          title="Материалов пока нет"
          text={`Создайте первый материал. Автор: ${teacherName}.`}
        />
      ) : filteredItems.length === 0 ? (
        <TeacherMaterialsEmptyState
          title="Материалы не найдены"
          text="Измените поиск, группу или статус публикации."
        />
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <TeacherMaterialCard
              key={item.content.id}
              item={item}
              busyAction={busyAction}
              onEditMaterial={(
                selectedItem
              ) => {
                setModalError(null);
                setMaterialModal({
                  mode: 'edit',
                  item: selectedItem,
                });
              }}
              onTogglePublication={
                handleTogglePublication
              }
              onDeleteMaterial={
                handleDeleteMaterial
              }
              onAddAttachment={(
                selectedItem
              ) => {
                setModalError(null);
                setResourceModal({
                  kind: 'attachment',
                  mode: 'create',
                  item: selectedItem,
                  attachment: null,
                  link: null,
                });
              }}
              onEditAttachment={(
                selectedItem,
                attachment
              ) => {
                setModalError(null);
                setResourceModal({
                  kind: 'attachment',
                  mode: 'edit',
                  item: selectedItem,
                  attachment,
                  link: null,
                });
              }}
              onToggleAttachmentVisibility={
                handleAttachmentVisibility
              }
              onDeleteAttachment={
                handleDeleteAttachment
              }
              onAddLink={(selectedItem) => {
                setModalError(null);
                setResourceModal({
                  kind: 'link',
                  mode: 'create',
                  item: selectedItem,
                  attachment: null,
                  link: null,
                });
              }}
              onEditLink={(
                selectedItem,
                link
              ) => {
                setModalError(null);
                setResourceModal({
                  kind: 'link',
                  mode: 'edit',
                  item: selectedItem,
                  attachment: null,
                  link,
                });
              }}
              onToggleLinkVisibility={
                handleLinkVisibility
              }
              onDeleteLink={
                handleDeleteLink
              }
            />
          ))}
        </div>
      )}

      {materialModal && (
        <TeacherMaterialFormModal
          mode={materialModal.mode}
          groups={groups}
          initialGroupId={
            materialModal.item?.groupId
          }
          initialValues={
            materialModal.item
              ? {
                  lessonId:
                    materialModal.item
                      .lesson.id,
                  title:
                    materialModal.item
                      .content.title,
                  summary:
                    materialModal.item
                      .content.summary ?? '',
                  content:
                    materialModal.item
                      .content.content ?? '',
                  publishImmediately:
                    materialModal.item
                      .content.is_published,
                }
              : undefined
          }
          isSaving={isModalSaving}
          error={modalError}
          onClose={closeModals}
          onSubmit={handleMaterialSubmit}
        />
      )}

      {resourceModal && (
        <TeacherMaterialResourceModal
          kind={resourceModal.kind}
          mode={resourceModal.mode}
          initialValues={getResourceInitialValues(
            resourceModal
          )}
          isSaving={isModalSaving}
          error={modalError}
          onClose={closeModals}
          onSubmit={handleResourceSubmit}
        />
      )}
    </div>
  );
}
