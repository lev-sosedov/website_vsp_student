import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  BookOpen,
  Calendar,
  Download,
  ExternalLink,
  File,
  FileImage,
  FileText,
  FolderOpen,
  Link as LinkIcon,
  Loader2,
  Presentation,
  RefreshCw,
  Search,
  UserRound,
  Users,
  Video,
} from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';
import {
  getGroup,
  getStudentGroupMemberships,
} from '../../../api/academicApi';
import {
  getAttachmentTypeLabel,
  getPublishedLessonContents,
  getVisibleContentAttachments,
  getVisibleContentLinks,
  formatFileSize,
  type LessonAttachment,
  type LessonContent,
  type LessonLink,
} from '../../../api/contentApi';
import {
  getGroupLessons,
  type LessonSchedule,
} from '../../../api/scheduleApi';

import {
  getUsersByIds,
  type UserProfile,
} from '../../../api/userApi';

interface MaterialItem {
  content: LessonContent;
  lesson: LessonSchedule;
  attachments: LessonAttachment[];
  links: LessonLink[];
  groupId: number;
  groupName: string;
  teacherName: string;
}

interface StudentMaterialGroup {
  id: number;
  name: string;
}

type MaterialFilter =
  | 'all'
  | 'files'
  | 'links'
  | 'text';

const MONTH_NAMES = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

function getLocalDateKey(
  date = new Date()
): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');
  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isMaterialAvailableForLesson(
  lesson: LessonSchedule,
  todayDateKey: string
): boolean {
  return (
    lesson.status !== 'cancelled' &&
    lesson.lesson_date <= todayDateKey
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить материалы';
}

function formatLessonDate(dateString: string): string {
  const [year, month, day] = dateString
    .split('-')
    .map(Number);

  const date = new Date(year, month - 1, day);

  return `${date.getDate()} ${
    MONTH_NAMES[date.getMonth()]
  } ${date.getFullYear()}`;
}

function getLessonTitle(
  lesson: LessonSchedule
): string {
  return lesson.topic?.trim() || 'Занятие';
}

function getTeacherName(
  teacher: UserProfile | undefined,
  teacherId: number
): string {
  if (!teacher) {
    return `Преподаватель №${teacherId}`;
  }

  const name = [
    teacher.user_name,
    teacher.last_name,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    name ||
    `Преподаватель №${teacherId}`
  );
}

function getFileIcon(
  attachment: LessonAttachment
) {
  const type = getAttachmentTypeLabel(
    attachment
  ).toLowerCase();

  if (type === 'pdf') {
    return FileText;
  }

  if (type === 'видео') {
    return Video;
  }

  if (type === 'презентация') {
    return Presentation;
  }

  if (type === 'изображение') {
    return FileImage;
  }

  if (type === 'архив') {
    return Archive;
  }

  return File;
}

function isSafeExternalUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === 'http:' ||
      parsedUrl.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

function openExternalUrl(url: string): void {
  if (!isSafeExternalUrl(url)) {
    return;
  }

  window.open(
    url,
    '_blank',
    'noopener,noreferrer'
  );
}

export default function Materials() {
  const { user } = useAuth();

  const [materials, setMaterials] = useState<
    MaterialItem[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [groups, setGroups] = useState<
    StudentMaterialGroup[]
  >([]);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedFilter, setSelectedFilter] =
    useState<MaterialFilter>('all');

  const loadMaterials = useCallback(
    async () => {
      if (!user?.id) {
        setMaterials([]);
        setGroups([]);
        setError(
          'Не удалось определить текущего пользователя'
        );
        setIsLoading(false);

        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const memberships =
          await getStudentGroupMemberships(
            user.id
          );

        const groupIds = [
          ...new Set(
            memberships.map(
              (membership) =>
                membership.group_id
            )
          ),
        ];

        if (groupIds.length === 0) {
          setMaterials([]);
          setGroups([]);
          setError(
            'Пользователь пока не добавлен в учебную группу'
          );

          return;
        }

        const studentGroups = (
          await Promise.all(
            groupIds.map(async (groupId) => {
              const group =
                await getGroup(groupId);

              return {
                id: group.id,
                name:
                  group.name ||
                  `Группа №${group.id}`,
              };
            })
          )
        ).sort((first, second) =>
          first.name.localeCompare(
            second.name,
            'ru'
          )
        );

        setGroups(studentGroups);

        const selectedGroupExists =
          selectedGroupId === null ||
          studentGroups.some(
            (group) =>
              group.id === selectedGroupId
          );

        const normalizedGroupId =
          selectedGroupExists
            ? selectedGroupId
            : null;

        if (!selectedGroupExists) {
          setSelectedGroupId(null);
        }

        const groupsToLoad =
          normalizedGroupId === null
            ? studentGroups
            : studentGroups.filter(
                (group) =>
                  group.id ===
                  normalizedGroupId
              );

        const [
          groupLessonLists,
          publishedContents,
        ] = await Promise.all([
          Promise.all(
            groupsToLoad.map((group) =>
              getGroupLessons(group.id)
            )
          ),
            getPublishedLessonContents(),
        ]);

        const groupLessons =
          groupLessonLists.flat();

        /*
         * Расписание студент видит заранее, но материалы
         * становятся доступны только в день занятия.
         *
         * Сравниваем строки формата YYYY-MM-DD в локальной
         * дате браузера, поэтому материалы завтрашнего дня
         * и более поздних занятий в список не попадут.
         */
        const todayDateKey =
          getLocalDateKey();

        const availableGroupLessons =
          groupLessons.filter((lesson) =>
            isMaterialAvailableForLesson(
              lesson,
              todayDateKey
            )
          );

        const teacherProfiles =
          await getUsersByIds(
            [
              ...new Set(
                availableGroupLessons.map(
                  (lesson) =>
                    lesson.teacher_id
                )
              ),
            ]
          );

        const lessonsById = new Map(
          availableGroupLessons.map(
            (lesson) => [
              lesson.id,
              lesson,
            ]
          )
        );

        const groupNamesById = new Map(
          studentGroups.map((group) => [
            group.id,
            group.name,
          ])
        );

        const groupContents =
          publishedContents.filter(
            (content) =>
              lessonsById.has(content.lesson_id)
          );

        const preparedMaterials =
          await Promise.all(
            groupContents.map(
              async (
                content
              ): Promise<MaterialItem> => {
                const [
                  attachmentsResult,
                  linksResult,
                ] = await Promise.allSettled([
                  getVisibleContentAttachments(
                    content.id
                  ),
                  getVisibleContentLinks(
                    content.id
                  ),
                ]);

                const attachments =
                  attachmentsResult.status ===
                  'fulfilled'
                    ? attachmentsResult.value
                    : [];

                const links =
                  linksResult.status ===
                  'fulfilled'
                    ? linksResult.value
                    : [];

                const lesson = lessonsById.get(
                  content.lesson_id
                );

                if (!lesson) {
                  throw new Error(
                    `Занятие №${content.lesson_id} не найдено`
                  );
                }

                return {
                  content,
                  lesson,
                  attachments,
                  links,
                  groupId: lesson.group_id,
                  groupName:
                    groupNamesById.get(
                      lesson.group_id
                    ) ??
                    `Группа №${lesson.group_id}`,
                  teacherName: getTeacherName(
                    teacherProfiles[
                      lesson.teacher_id
                    ],
                    lesson.teacher_id
                  ),
                };
              }
            )
          );

        preparedMaterials.sort(
          (firstMaterial, secondMaterial) => {
            /*
             * При выборе «Все группы» материалы идут
             * по названию группы, а внутри группы —
             * от новых занятий к старым.
             */
            const groupComparison =
              firstMaterial.groupName.localeCompare(
                secondMaterial.groupName,
                'ru'
              );

            if (groupComparison !== 0) {
              return groupComparison;
            }

            const dateComparison =
              secondMaterial.lesson.lesson_date.localeCompare(
                firstMaterial.lesson.lesson_date
              );

            if (dateComparison !== 0) {
              return dateComparison;
            }

            return secondMaterial.lesson.start_time.localeCompare(
              firstMaterial.lesson.start_time
            );
          }
        );

        setMaterials(preparedMaterials);
      } catch (loadError) {
        setMaterials([]);
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [selectedGroupId, user?.id]
  );

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    return materials.filter((material) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        material.content.title
          .toLowerCase()
          .includes(normalizedQuery) ||
        material.content.summary
          ?.toLowerCase()
          .includes(normalizedQuery) ||
        material.content.content
          ?.toLowerCase()
          .includes(normalizedQuery) ||
        getLessonTitle(material.lesson)
          .toLowerCase()
          .includes(normalizedQuery) ||
        material.groupName
          .toLowerCase()
          .includes(normalizedQuery) ||
        material.attachments.some(
          (attachment) =>
            attachment.title
              .toLowerCase()
              .includes(normalizedQuery) ||
            attachment.file_name
              ?.toLowerCase()
              .includes(normalizedQuery)
        ) ||
        material.links.some(
          (link) =>
            link.title
              .toLowerCase()
              .includes(normalizedQuery) ||
            link.description
              ?.toLowerCase()
              .includes(normalizedQuery)
        );

      if (!matchesSearch) {
        return false;
      }

      switch (selectedFilter) {
        case 'files':
          return (
            material.attachments.length > 0
          );

        case 'links':
          return material.links.length > 0;

        case 'text':
          return Boolean(
            material.content.content?.trim()
          );

        default:
          return true;
      }
    });
  }, [
    materials,
    searchQuery,
    selectedFilter,
  ]);

  const totalFiles = useMemo(
    () =>
      materials.reduce(
        (total, material) =>
          total +
          material.attachments.length,
        0
      ),
    [materials]
  );

  const totalLinks = useMemo(
    () =>
      materials.reduce(
        (total, material) =>
          total + material.links.length,
        0
      ),
    [materials]
  );

  const filters: Array<{
    value: MaterialFilter;
    label: string;
    count: number;
  }> = [
    {
      value: 'all',
      label: 'Все',
      count: materials.length,
    },
    {
      value: 'files',
      label: 'Файлы',
      count: totalFiles,
    },
    {
      value: 'links',
      label: 'Ссылки',
      count: totalLinks,
    },
    {
      value: 'text',
      label: 'Конспекты',
      count: materials.filter(
        (material) =>
          Boolean(
            material.content.content?.trim()
          )
      ).length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Материалы занятий
          </h1>

          <p className="mt-1 text-gray-500">
            Материалы текущих и прошедших занятий
          </p>
        </div>
      </div>

      {!isLoading &&
        !error &&
        groups.length > 1 && (
          <div className="card p-4 sm:p-5">
            <label
              htmlFor="materials-group"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Группа
            </label>

            <select
              id="materials-group"
              value={
                selectedGroupId ?? ''
              }
              onChange={(event) => {
                const value =
                  event.target.value;

                setSelectedGroupId(
                  value
                    ? Number(value)
                    : null
                );
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 sm:max-w-md"
            >
              <option value="">
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
          </div>
        )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                <BookOpen className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {materials.length}
                </p>
                <p className="text-sm text-gray-500">
                  Материалов
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                <FileText className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalFiles}
                </p>
                <p className="text-sm text-gray-500">
                  Файлов
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                <LinkIcon className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalLinks}
                </p>
                <p className="text-sm text-gray-500">
                  Полезных ссылок
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="card p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Поиск по материалам..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    setSelectedFilter(
                      filter.value
                    )
                  }
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    selectedFilter ===
                    filter.value
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      selectedFilter ===
                      filter.value
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-gray-500'
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="card flex min-h-72 items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />

            <p className="mt-3 text-sm text-gray-500">
              Загружаем материалы…
            </p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="card border border-red-100 bg-red-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <p className="font-semibold text-red-800">
                  Не удалось загрузить материалы
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadMaterials()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </button>
          </div>
        </div>
      )}

      {!isLoading &&
        !error &&
        materials.length === 0 && (
          <div className="card flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <FolderOpen className="h-7 w-7 text-gray-400" />
            </div>

            <h2 className="mt-4 font-semibold text-gray-900">
              Материалов пока нет
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Когда преподаватель опубликует материалы занятий,
              они появятся на этой странице.
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        materials.length > 0 &&
        filteredMaterials.length === 0 && (
          <div className="card flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <Search className="h-8 w-8 text-gray-300" />

            <h2 className="mt-3 font-semibold text-gray-900">
              Ничего не найдено
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Измени запрос или выбери другой фильтр.
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredMaterials.length > 0 && (
          <div className="space-y-5">
            {filteredMaterials.map(
              (material) => (
                <article
                  key={material.content.id}
                  className="card overflow-hidden"
                >
                  <div className="border-b border-gray-100 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50">
                          <BookOpen className="h-5 w-5 text-red-600" />
                        </div>

                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-gray-900">
                            {
                              material.content
                                .title
                            }
                          </h2>

                          {groups.length > 1 &&
                            selectedGroupId ===
                              null && (
                              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                <Users className="h-3.5 w-3.5" />
                                {
                                  material.groupName
                                }
                              </span>
                            )}

                          {material.content
                            .summary && (
                            <p className="mt-1 text-sm leading-6 text-gray-500">
                              {
                                material.content
                                  .summary
                              }
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />

                              {formatLessonDate(
                                material.lesson
                                  .lesson_date
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5" />

                              {getLessonTitle(
                                material.lesson
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5" />

                              {
                                material.teacherName
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        {material.attachments
                          .length > 0 && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            {
                              material
                                .attachments
                                .length
                            }{' '}
                            файл(а)
                          </span>
                        )}

                        {material.links.length >
                          0 && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            {
                              material.links
                                .length
                            }{' '}
                            ссылок
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-5 sm:p-6">
                    {material.content.content && (
                      <section>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">
                          Конспект
                        </h3>

                        <div className="whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-700">
                          {
                            material.content
                              .content
                          }
                        </div>
                      </section>
                    )}

                    {material.attachments
                      .length > 0 && (
                      <section>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">
                          Файлы
                        </h3>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {material.attachments.map(
                            (attachment) => {
                              const Icon =
                                getFileIcon(
                                  attachment
                                );

                              return (
                                <div
                                  key={
                                    attachment.id
                                  }
                                  className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-red-100 hover:bg-red-50/30"
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                                    <Icon className="h-5 w-5 text-red-600" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {
                                        attachment.title
                                      }
                                    </p>

                                    <p className="mt-1 truncate text-xs text-gray-400">
                                      {getAttachmentTypeLabel(
                                        attachment
                                      )}
                                      {' · '}
                                      {formatFileSize(
                                        attachment.file_size
                                      )}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openExternalUrl(
                                        attachment.file_url
                                      )
                                    }
                                    disabled={
                                      !isSafeExternalUrl(
                                        attachment.file_url
                                      )
                                    }
                                    aria-label={`Открыть файл ${attachment.title}`}
                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </section>
                    )}

                    {material.links.length >
                      0 && (
                      <section>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">
                          Полезные ссылки
                        </h3>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {material.links.map(
                            (link) => (
                              <button
                                key={link.id}
                                type="button"
                                onClick={() =>
                                  openExternalUrl(
                                    link.url
                                  )
                                }
                                disabled={
                                  !isSafeExternalUrl(
                                    link.url
                                  )
                                }
                                className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 text-left transition hover:border-red-100 hover:bg-red-50/30 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                                  <LinkIcon className="h-5 w-5 text-red-600" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {link.title}
                                    </p>

                                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                  </div>

                                  {link.description && (
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                                      {
                                        link.description
                                      }
                                    </p>
                                  )}
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      </section>
                    )}

                    {!material.content.content &&
                      material.attachments
                        .length === 0 &&
                      material.links.length ===
                        0 && (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center">
                          <FolderOpen className="mx-auto h-6 w-6 text-gray-300" />

                          <p className="mt-2 text-sm text-gray-500">
                            В этом материале пока нет
                            содержимого
                          </p>
                        </div>
                      )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
    </div>
  );
}
