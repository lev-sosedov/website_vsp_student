import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import UserAvatar from '../../../components/common/UserAvatar';
import TeacherStudentProfileModal from '../../../components/dashboard/teacher/TeacherStudentProfileModal';
import { useAuth } from '../../../context/AuthContext';

import {
  getChats,
} from '../../../api/chatApi';

import {
  getActiveUserGroups,
  getGroup,
  getGroupStudents,
  type AcademicGroup,
  type GroupStudent,
} from '../../../api/academicApi';

import {
  getUserById,
  getUsersByIds,
  type UserProfile,
} from '../../../api/userApi';

import {
  openOrCreatePrivateChat,
  type MessageDirectoryPerson,
} from '../../../services/messageDirectoryService';

interface TeacherGroupOption {
  membershipId: number;
  group: AcademicGroup;
  students: GroupStudent[];
}

interface TeacherStudentItem {
  student: GroupStudent;
  groups: AcademicGroup[];
  profile: UserProfile | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}

function getStudentName(
  student: GroupStudent,
  profile?: UserProfile | null
): string {
  const surname =
    profile?.first_name ??
    student.first_name;

  const firstName =
    profile?.user_name ??
    student.user_name;

  const fullName = [
    surname,
    firstName,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  if (fullName) {
    return fullName;
  }

  const legacyName = [
    profile?.last_name ??
      student.last_name,
    surname,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  if (legacyName) {
    return legacyName;
  }

  return `Студент №${student.user_id}`;
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export default function TeacherStudents() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const teacherId = Number(user?.id);

  const [
    groups,
    setGroups,
  ] = useState<TeacherGroupOption[]>([]);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(null);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    studentProfiles,
    setStudentProfiles,
  ] = useState<Record<number, UserProfile>>(
    {}
  );

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(null);

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState<TeacherStudentItem | null>(
    null
  );

  const [
    selectedStudentProfile,
    setSelectedStudentProfile,
  ] = useState<UserProfile | null>(null);

  const [
    isProfileLoading,
    setIsProfileLoading,
  ] = useState(false);

  const [
    profileError,
    setProfileError,
  ] = useState<string | null>(null);

  const [
    openingMessageStudentId,
    setOpeningMessageStudentId,
  ] = useState<number | null>(null);

  const loadStudents = useCallback(async () => {
    if (
      !Number.isInteger(teacherId) ||
      teacherId <= 0
    ) {
      setGroups([]);
      setStudentProfiles({});
      setLoading(false);
      setError(
        'Не удалось определить ID преподавателя'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const memberships =
        await getActiveUserGroups(teacherId);

      const teacherMemberships =
        memberships.filter(
          (membership) =>
            membership.role === 'teacher' ||
            membership.role === 'assistant'
        );

      const uniqueMemberships = Array.from(
        new Map(
          teacherMemberships.map(
            (membership) => [
              membership.group_id,
              membership,
            ]
          )
        ).values()
      );

      const loadedGroups = await Promise.all(
        uniqueMemberships.map(
          async (membership) => {
            const [
              group,
              studentsResponse,
            ] = await Promise.all([
              getGroup(membership.group_id),
              getGroupStudents(
                membership.group_id
              ),
            ]);

            return {
              membershipId: membership.id,
              group,
              students:
                studentsResponse.items.filter(
                  (student) =>
                    student.is_active
                ),
            };
          }
        )
      );

      loadedGroups.sort((first, second) =>
        first.group.name.localeCompare(
          second.group.name,
          'ru'
        )
      );

      const profiles = await getUsersByIds(
        loadedGroups.flatMap((groupItem) =>
          groupItem.students.map(
            (student) => student.user_id
          )
        )
      );

      setGroups(loadedGroups);
      setStudentProfiles(profiles);

      if (
        selectedGroupId !== null &&
        !loadedGroups.some(
          (item) =>
            item.group.id === selectedGroupId
        )
      ) {
        setSelectedGroupId(null);
      }
    } catch (loadError) {
      console.error(
        'Не удалось загрузить студентов преподавателя:',
        loadError
      );

      setGroups([]);
      setStudentProfiles({});
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [
    teacherId,
    selectedGroupId,
  ]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const allStudents = useMemo<
    TeacherStudentItem[]
  >(() => {
    const studentMap =
      new Map<number, TeacherStudentItem>();

    groups.forEach((groupItem) => {
      groupItem.students.forEach((student) => {
        const existing =
          studentMap.get(student.user_id);

        if (existing) {
          if (
            !existing.groups.some(
              (group) =>
                group.id === groupItem.group.id
            )
          ) {
            existing.groups.push(groupItem.group);
          }

          return;
        }

        studentMap.set(student.user_id, {
          student,
          groups: [groupItem.group],
          profile:
            studentProfiles[
              student.user_id
            ] ?? null,
        });
      });
    });

    return Array.from(
      studentMap.values()
    ).sort((first, second) =>
      getStudentName(
        first.student,
        first.profile
      )
        .localeCompare(
          getStudentName(
            second.student,
            second.profile
          ),
          'ru'
        )
    );
  }, [
    groups,
    studentProfiles,
  ]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    return allStudents.filter((item) => {
      const matchesGroup =
        selectedGroupId === null ||
        item.groups.some(
          (group) =>
            group.id === selectedGroupId
        );

      if (!matchesGroup) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const surname =
        item.profile?.first_name ??
        item.student.first_name ??
        '';

      const firstName =
        item.profile?.user_name ??
        item.student.user_name ??
        '';

      const additionalName =
        item.profile?.last_name ??
        item.student.last_name ??
        '';

      const searchableName = [
        surname,
        firstName,
        additionalName,
        `${surname} ${firstName}`,
        `${firstName} ${surname}`,
      ]
        .map((value) =>
          value.trim().toLowerCase()
        )
        .filter(Boolean)
        .join(' ');

      const phone =
        item.profile?.phone_number ?? '';

      const normalizedPhoneQuery =
        normalizePhone(searchQuery);

      return (
        searchableName.includes(
          normalizedSearch
        ) ||
        (normalizedPhoneQuery.length > 0 &&
          normalizePhone(phone).includes(
            normalizedPhoneQuery
          ))
      );
    });
  }, [
    allStudents,
    searchQuery,
    selectedGroupId,
  ]);

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (item) =>
          item.group.id === selectedGroupId
      )?.group ?? null,
    [
      groups,
      selectedGroupId,
    ]
  );

  useEffect(() => {
    if (!selectedStudent) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === 'Escape' &&
        openingMessageStudentId === null
      ) {
        setSelectedStudent(null);
        setSelectedStudentProfile(null);
        setProfileError(null);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    openingMessageStudentId,
    selectedStudent,
  ]);

  const openStudentProfile = useCallback(
    async (studentItem: TeacherStudentItem) => {
      setSelectedStudent(studentItem);
      setSelectedStudentProfile(
        studentItem.profile
      );
      setProfileError(null);

      if (studentItem.profile) {
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);

      try {
        const profile = await getUserById(
          studentItem.student.user_id
        );

        setSelectedStudentProfile(profile);
      } catch (loadProfileError) {
        setProfileError(
          loadProfileError instanceof Error
            ? loadProfileError.message
            : 'Не удалось загрузить профиль студента'
        );
      } finally {
        setIsProfileLoading(false);
      }
    },
    []
  );

  const openStudentMessage = useCallback(
    async (studentItem: TeacherStudentItem) => {
      if (
        !user?.id ||
        openingMessageStudentId !== null
      ) {
        return;
      }

      const studentId =
        studentItem.student.user_id;

      setOpeningMessageStudentId(studentId);
      setActionError(null);

      const target: MessageDirectoryPerson = {
        userId: studentId,
        displayName: getStudentName(
          studentItem.student,
          studentItem.profile
        ),
        avatarUrl:
          studentItem.profile?.avatar_url ??
          studentItem.student.avatar_url,
        role: 'student',
      };

      try {
        const chatsResponse = await getChats(
          user.id
        );

        const privateChat =
          await openOrCreatePrivateChat(
            chatsResponse.items,
            user.id,
            target
          );

        navigate(
          `/dashboard/messages?chatId=${privateChat.id}`
        );
      } catch (messageError) {
        setActionError(
          messageError instanceof Error
            ? messageError.message
            : 'Не удалось открыть чат со студентом'
        );
      } finally {
        setOpeningMessageStudentId(null);
      }
    },
    [
      navigate,
      openingMessageStudentId,
      user?.id,
    ]
  );

  const closeStudentProfile = () => {
    if (openingMessageStudentId !== null) {
      return;
    }

    setSelectedStudent(null);
    setSelectedStudentProfile(null);
    setProfileError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />

          <p className="text-sm text-gray-500">
            Загружаем студентов...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Студенты
          </h1>

          <p className="mt-1 text-gray-500">
            Все студенты из ваших учебных групп
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">
              Не удалось загрузить студентов
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">
              Не удалось открыть сообщение
            </p>

            <p className="mt-1 text-sm">
              {actionError}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Users className="h-6 w-6" />
            </div>

            <div>
              <p className="text-3xl font-bold text-gray-900">
                {allStudents.length}
              </p>

              <p className="text-sm text-gray-500">
                Мои студенты
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound className="h-6 w-6" />
            </div>

            <div>
              <p className="text-3xl font-bold text-gray-900">
                {filteredStudents.length}
              </p>

              <p className="text-sm text-gray-500">
                Найдено по фильтру
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_320px]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Поиск
          </span>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Фамилия, имя или телефон"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Группа
          </span>

          <div className="relative">
            <select
              value={selectedGroupId ?? ''}
              onChange={(event) => {
                const value = Number(
                  event.target.value
                );

                setSelectedGroupId(
                  Number.isInteger(value) &&
                    value > 0
                    ? value
                    : null
                );
              }}
              disabled={groups.length === 0}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                Все группы
              </option>

              {groups.map((item) => (
                <option
                  key={item.group.id}
                  value={item.group.id}
                >
                  {item.group.name}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </label>
      </div>

      {!error && groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Группы преподавателя не найдены
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Сначала назначьте преподавателя участником
            активной учебной группы.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-300" />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Студенты не найдены
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Измените строку поиска или выберите другую группу.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {selectedGroup?.name ??
                  'Все студенты'}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Показано: {filteredStudents.length}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div style={{ minWidth: '1080px' }}>
              <div
                className="border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'minmax(250px, 1.15fr) minmax(220px, 0.9fr) minmax(260px, 1.1fr) minmax(245px, auto)',
                  alignItems: 'center',
                  columnGap: '24px',
                }}
              >
                <span>Студент</span>
                <span>Информация</span>
                <span>Группы</span>
                <span className="text-right">
                  Действия
                </span>
              </div>

              <div className="max-h-[720px] divide-y divide-gray-100 overflow-y-auto">
                {filteredStudents.map(
                  (studentItem) => {
                const studentName =
                  getStudentName(
                    studentItem.student,
                    studentItem.profile
                  );

                const phone =
                  studentItem.profile
                    ?.phone_number ||
                  'Телефон не указан';

                const email =
                  studentItem.profile?.email ||
                  'Почта не указана';

                const isOpeningMessage =
                  openingMessageStudentId ===
                  studentItem.student.user_id;

                return (
                    <div
                      key={
                        studentItem.student
                          .user_id
                      }
                      className="min-h-[72px] px-5 py-3 transition hover:bg-gray-50"
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'minmax(250px, 1.15fr) minmax(220px, 0.9fr) minmax(260px, 1.1fr) minmax(245px, auto)',
                        alignItems: 'center',
                        columnGap: '24px',
                      }}
                    >
                    <button
                      type="button"
                      onClick={() =>
                        void openStudentProfile(
                          studentItem
                        )
                      }
                      className="flex min-w-0 items-center gap-3 rounded-lg text-left outline-none transition hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-200"
                      title="Открыть профиль студента"
                    >
                      <UserAvatar
                        avatarUrl={
                          studentItem.profile
                            ?.avatar_url ??
                          studentItem.student
                            .avatar_url
                        }
                        alt={studentName}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {studentName}
                        </p>

                        <p className="mt-0.5 text-xs text-red-500">
                          Открыть профиль
                        </p>
                      </div>
                    </button>

                    <div className="min-w-0 space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">
                          {phone}
                        </span>
                      </p>

                      <p className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">
                          {email}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {studentItem.groups.map(
                        (group) => (
                          <span
                            key={group.id}
                            className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                          >
                            {group.name}
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/attendance?groupId=${studentItem.groups[0]?.id ?? ''}`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Журнал
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void openStudentMessage(
                            studentItem
                          )
                        }
                        disabled={
                          openingMessageStudentId !==
                          null
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isOpeningMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                        Сообщение
                      </button>
                    </div>
                    </div>
                  );
                }
              )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (
        <TeacherStudentProfileModal
          isOpen
          isLoading={isProfileLoading}
          isOpeningMessage={
            openingMessageStudentId ===
            selectedStudent.student.user_id
          }
          error={profileError}
          studentName={getStudentName(
            selectedStudent.student,
            selectedStudentProfile ??
              selectedStudent.profile
          )}
          studentAvatarUrl={
            selectedStudent.profile
              ?.avatar_url ??
            selectedStudent.student
              .avatar_url
          }
          groupName={selectedStudent.groups
            .map((group) => group.name)
            .join(', ')}
          profile={selectedStudentProfile}
          onClose={closeStudentProfile}
          onMessage={() =>
            void openStudentMessage(
              selectedStudent
            )
          }
        />
      )}
    </div>
  );
}