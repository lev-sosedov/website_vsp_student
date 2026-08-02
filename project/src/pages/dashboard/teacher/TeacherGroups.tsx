import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  Building2,
  CalendarDays,
  Eye,
  Info,
  Loader2,
  MessageSquare,
  UserRound,
  Users,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import UserAvatar from '../../../components/common/UserAvatar';
import TeacherGroupInfoModal from '../../../components/dashboard/teacher/TeacherGroupInfoModal';
import TeacherStudentProfileModal from '../../../components/dashboard/teacher/TeacherStudentProfileModal';
import { useAuth } from '../../../context/AuthContext';
import { authorizedFetch } from '../../../api/authorizedClient';

import {
  getChats,
} from '../../../api/chatApi';

import {
  getUserById,
  type UserProfile,
} from '../../../api/userApi';

import {
  getRoom,
  getScheduleTemplates,
} from '../../../api/scheduleApi';

import {
  openOrCreatePrivateChat,
  type MessageDirectoryPerson,
} from '../../../services/messageDirectoryService';

import {
  getActiveUserGroups,
  getDirection,
  getGroup,
  getGroupStudents,
  type AcademicDirection,
  type AcademicGroup,
  type GroupStudent,
} from '../../../api/academicApi';

interface TeacherGroupItem {
  membershipId: number;
  group: AcademicGroup;
  students: GroupStudent[];
  direction: AcademicDirection | null;
  educationPlan: AcademicEducationPlanResponse | null;
  branchName: string;
  roomName: string;
}

interface AcademicEducationPlanResponse {
  id: number;
  direction_id?: number;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  duration_months?: number | null;
  lessons_per_week?: number | null;
  is_active?: boolean;
}

interface AcademicBranchResponse {
  id: number;
  name?: string | null;
  title?: string | null;
  short_name?: string | null;
  address?: string | null;
  address_id?: number | null;
  branch_address_id?: number | null;
  auditorium?: string | number | null;
  auditorium_number?: string | number | null;
  room?: string | number | null;
  room_number?: string | number | null;
}

interface BranchAddressResponse {
  id: number;
  branch_id?: number | null;
  address?: string | null;
  full_address?: string | null;
  street?: string | null;
  street_name?: string | null;
  city?: string | null;
  house?: string | number | null;
  building?: string | number | null;
}

interface UserProfileResponse {
  id: number;
  user_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  '';

async function academicRequest<T>(
  endpoint: string
): Promise<T> {
    const response = await authorizedFetch(
    `${API_URL}${endpoint}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Ошибка Academic API: ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

async function getBranch(
  branchId: number
): Promise<AcademicBranchResponse> {
  return academicRequest<AcademicBranchResponse>(
    `/api/v1/branches/${branchId}`
  );
}

async function getBranchAddresses():
Promise<BranchAddressResponse[]> {
  const response = await academicRequest<
    BranchAddressResponse[] |
    {
      items?: BranchAddressResponse[];
    }
  >('/api/v1/branch-address');

  return Array.isArray(response)
    ? response
    : response.items ?? [];
}

async function getEducationPlan(
  educationPlanId: number
): Promise<AcademicEducationPlanResponse | null> {
  const candidateEndpoints = [
    `/api/v1/education-plans/${educationPlanId}`,
    `/api/v1/education-plan/${educationPlanId}`,
  ];

  for (const endpoint of candidateEndpoints) {
    try {
      return await academicRequest<
        AcademicEducationPlanResponse
      >(endpoint);
    } catch {
      // Gateway может использовать один из двух путей.
    }
  }

  return null;
}

async function getUserProfile(
  userId: number
): Promise<UserProfileResponse | null> {
  const candidateEndpoints = [
    `/api/v1/users/${userId}`,
    `/api/v1/users/id/${userId}`,
  ];

  for (const endpoint of candidateEndpoints) {
    try {
      return await academicRequest<
        UserProfileResponse
      >(endpoint);
    } catch {
      // Пробуем следующий поддерживаемый маршрут.
    }
  }

  return null;
}

async function enrichGroupStudents(
  students: GroupStudent[]
): Promise<GroupStudent[]> {
  return Promise.all(
    students.map(async (student) => {
      const hasProfileData = Boolean(
        student.user_name?.trim() ||
        student.first_name?.trim() ||
        student.last_name?.trim() ||
        student.avatar_url?.trim()
      );

      if (hasProfileData) {
        return student;
      }

      const profile =
        await getUserProfile(student.user_id);

      if (!profile) {
        return student;
      }

      return {
        ...student,
        user_name:
          profile.user_name ??
          student.user_name,
        first_name:
          profile.first_name ??
          student.first_name,
        last_name:
          profile.last_name ??
          student.last_name,
        avatar_url:
          profile.avatar_url ??
          student.avatar_url,
      };
    })
  );
}

function normalizeStreetName(
  value: string
): string {
  return value
    .replace(
      /^(ул\.?|улица|проспект|пр-т|переулок|пер\.?|шоссе|бульвар|наб\.?|набережная)\s+/i,
      ''
    )
    .replace(
      /\s+(д\.?|дом)\s*\d+[А-Яа-яA-Za-z\d/-]*.*$/i,
      ''
    )
    .replace(
      /,?\s*\d+[А-Яа-яA-Za-z\d/-]*\s*$/,
      ''
    )
    .trim();
}

function extractStreetName(
  value: string | null | undefined,
  city: string | null | undefined
): string | null {
  const address = value?.trim();

  if (!address) {
    return null;
  }

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const explicitStreet = parts.find((part) =>
    /^(ул\.?|улица|проспект|пр-т|переулок|пер\.?|шоссе|бульвар|наб\.?|набережная)\s+/i.test(
      part
    )
  );

  if (explicitStreet) {
    return normalizeStreetName(
      explicitStreet
    );
  }

  const normalizedCity =
    city?.trim().toLocaleLowerCase('ru-RU');

  const candidates = parts.filter((part) => {
    const normalized =
      part.toLocaleLowerCase('ru-RU');

    if (
      normalizedCity &&
      normalized === normalizedCity
    ) {
      return false;
    }

    if (
      /^(россия|рф|краснодарский край|край|область|республика)$/i.test(
        part
      )
    ) {
      return false;
    }

    if (
      /^(г\.?|город)\s/i.test(part) ||
      /^(д\.?|дом)\s*\d/i.test(part) ||
      /^(стр\.?|строение|корпус)\s/i.test(part) ||
      /^\d{5,6}$/.test(part)
    ) {
      return false;
    }

    return /[А-Яа-яЁёA-Za-z]/.test(part);
  });

  const candidate =
    candidates.length > 1
      ? candidates[candidates.length - 1]
      : candidates[0];

  return candidate
    ? normalizeStreetName(candidate)
    : null;
}

function getBranchStreet(
  branch: AcademicBranchResponse | null,
  address: BranchAddressResponse | null
): string {
  const directStreet =
    address?.street?.trim() ||
    address?.street_name?.trim();

  if (directStreet) {
    return normalizeStreetName(
      directStreet
    );
  }

  return (
    extractStreetName(
      address?.full_address ??
      address?.address ??
      branch?.address,
      address?.city
    ) ??
    branch?.name?.trim() ??
    branch?.title?.trim() ??
    branch?.short_name?.trim() ??
    'Не указан'
  );
}

function getBranchRoomFallback(
  branch: AcademicBranchResponse | null
): string | null {
  const branchValue =
    branch?.auditorium ??
    branch?.auditorium_number ??
    branch?.room ??
    branch?.room_number;

  if (
    typeof branchValue === 'string' &&
    branchValue.trim()
  ) {
    return branchValue.trim();
  }

  if (
    typeof branchValue === 'number' &&
    Number.isFinite(branchValue)
  ) {
    return String(branchValue);
  }

  return null;
}

async function getPrimaryGroupRoomName(
  groupId: number,
  branch: AcademicBranchResponse | null
): Promise<string> {
  try {
    const templates =
      await getScheduleTemplates({
        groupId,
        isActive: true,
        limit: 500,
      });

    const roomCounts =
      new Map<number, number>();

    templates.forEach((template) => {
      roomCounts.set(
        template.room_id,
        (roomCounts.get(template.room_id) ?? 0) + 1
      );
    });

    const primaryRoomId =
      Array.from(roomCounts.entries())
        .sort(
          (first, second) =>
            second[1] - first[1]
        )[0]?.[0];

    if (primaryRoomId) {
      const room =
        await getRoom(primaryRoomId);

      if (room.name?.trim()) {
        return room.name.trim();
      }

      return `Кабинет №${primaryRoomId}`;
    }
  } catch (roomError) {
    console.error(
      `Не удалось определить кабинет группы ${groupId}:`,
      roomError
    );
  }

  return (
    getBranchRoomFallback(branch) ??
    'Не указан'
  );
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}

function getStudentName(
  student: GroupStudent
): string {
  const fullName = [
    student.first_name,
    student.user_name,
    student.last_name,
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .map((value) => value.trim())
    .join(' ')
    .trim();

  return (
    fullName ||
    `Студент №${student.user_id}`
  );
}

function getEducationPlanName(
  educationPlan:
    AcademicEducationPlanResponse | null,
  educationPlanId:
    number | null | undefined
): string {
  return (
    educationPlan?.name?.trim() ||
    educationPlan?.title?.trim() ||
    (educationPlanId
      ? `Учебный план №${educationPlanId}`
      : 'Не указан')
  );
}

function formatEducationPlanDuration(
  durationMonths:
    number | null | undefined
): string {
  if (
    !durationMonths ||
    !Number.isFinite(durationMonths)
  ) {
    return 'Не указана';
  }

  const lastTwoDigits =
    durationMonths % 100;

  const lastDigit =
    durationMonths % 10;

  let monthWord = 'месяцев';

  if (
    lastDigit === 1 &&
    lastTwoDigits !== 11
  ) {
    monthWord = 'месяц';
  } else if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (
      lastTwoDigits < 12 ||
      lastTwoDigits > 14
    )
  ) {
    monthWord = 'месяца';
  }

  return `${durationMonths} ${monthWord}`;
}

function formatGroupDate(
  dateValue: string | null | undefined
): string {
  if (!dateValue) {
    return 'Не указана';
  }

  const [year, month, day] =
    dateValue
      .slice(0, 10)
      .split('-')
      .map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  ).format(
    new Date(
      year,
      month - 1,
      day
    )
  );
}

export default function TeacherGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [
    groups,
    setGroups,
  ] = useState<TeacherGroupItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(null);

  const [
    expandedStudentKey,
    setExpandedStudentKey,
  ] = useState<string | null>(null);

  const [
    selectedGroupInfo,
    setSelectedGroupInfo,
  ] = useState<TeacherGroupItem | null>(null);

  const [
    selectedProfileStudent,
    setSelectedProfileStudent,
  ] = useState<{
    student: GroupStudent;
    groupName: string;
  } | null>(null);

  const [
    selectedStudentProfile,
    setSelectedStudentProfile,
  ] = useState<UserProfile | null>(null);

  const [
    isStudentProfileLoading,
    setIsStudentProfileLoading,
  ] = useState(false);

  const [
    studentProfileError,
    setStudentProfileError,
  ] = useState<string | null>(null);

  const [
    openingMessageStudentId,
    setOpeningMessageStudentId,
  ] = useState<number | null>(null);

  const loadGroups =
    useCallback(async () => {
      if (!user?.id) {
        setGroups([]);
        setLoading(false);
        setError(
          'Не удалось определить текущего преподавателя'
        );
        return;
      }

      const userId =
        Number(user.id);

      if (!Number.isFinite(userId)) {
        setGroups([]);
        setLoading(false);
        setError(
          'Некорректный ID текущего преподавателя'
        );
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const memberships =
          await getActiveUserGroups(userId);

        const teacherMemberships =
          memberships.filter(
            (membership) =>
              membership.role === 'teacher' ||
              membership.role === 'assistant'
          );

        const branchAddresses =
          await getBranchAddresses().catch(
            (addressError) => {
              console.error(
                'Не удалось загрузить адреса филиалов:',
                addressError
              );

              return [];
            }
          );

        const loadedGroups =
          await Promise.all(
            teacherMemberships.map(
              async (membership) => {
                const [
                  group,
                  studentResponse,
                ] = await Promise.all([
                  getGroup(
                    membership.group_id
                  ),
                  getGroupStudents(
                    membership.group_id
                  ),
                ]);

                const [
                  direction,
                  branch,
                  educationPlan,
                ] = await Promise.all([
                  group.direction_id
                    ? getDirection(
                        group.direction_id
                      ).catch(
                        (
                          directionError
                        ) => {
                          console.error(
                            `Не удалось загрузить направление группы ${group.id}:`,
                            directionError
                          );

                          return null;
                        }
                      )
                    : Promise.resolve(
                        null
                      ),

                  group.branch_id
                    ? getBranch(
                        group.branch_id
                      ).catch(
                        (branchError) => {
                          console.error(
                            `Не удалось загрузить филиал группы ${group.id}:`,
                            branchError
                          );

                          return null;
                        }
                      )
                    : Promise.resolve(
                        null
                      ),

                  group.education_plan_id
                    ? getEducationPlan(
                        group.education_plan_id
                      )
                    : Promise.resolve(
                        null
                      ),
                ]);

                const branchAddressId =
                  branch
                    ?.branch_address_id ??
                  branch?.address_id ??
                  null;

                const branchAddress =
                  branchAddresses.find(
                    (address) =>
                      (
                        branchAddressId !==
                          null &&
                        address.id ===
                          branchAddressId
                      ) ||
                      address.branch_id ===
                        group.branch_id
                  ) ?? null;

                const activeStudents =
                  studentResponse.items.filter(
                    (student) =>
                      student.is_active
                  );

                const [
                  enrichedStudents,
                  roomName,
                ] = await Promise.all([
                  enrichGroupStudents(
                    activeStudents
                  ),
                  getPrimaryGroupRoomName(
                    group.id,
                    branch
                  ),
                ]);

                return {
                  membershipId:
                    membership.id,
                  group,
                  students:
                    enrichedStudents,
                  direction,
                  educationPlan,
                  branchName:
                    getBranchStreet(
                      branch,
                      branchAddress
                    ),
                  roomName,
                };
              }
            )
          );

        loadedGroups.sort(
          (
            firstGroup,
            secondGroup
          ) =>
            firstGroup.group.name
              .localeCompare(
                secondGroup.group.name,
                'ru'
              )
        );

        setGroups(
          loadedGroups
        );
      } catch (loadError) {
        console.error(
          'Не удалось загрузить группы преподавателя:',
          loadError
        );

        setGroups([]);
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setLoading(false);
      }
    }, [user?.id]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (
      !selectedGroupInfo &&
      !selectedProfileStudent
    ) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (
        openingMessageStudentId !==
        null
      ) {
        return;
      }

      setSelectedGroupInfo(null);
      setSelectedProfileStudent(null);
      setSelectedStudentProfile(null);
      setStudentProfileError(null);
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
    selectedGroupInfo,
    selectedProfileStudent,
  ]);

  const openStudentProfile =
    useCallback(
      async (
        student: GroupStudent,
        groupName: string
      ) => {
        setSelectedProfileStudent({
          student,
          groupName,
        });

        setSelectedStudentProfile(
          null
        );

        setStudentProfileError(
          null
        );

        setIsStudentProfileLoading(
          true
        );

        try {
          const profile =
            await getUserById(
              student.user_id
            );

          setSelectedStudentProfile(
            profile
          );
        } catch (profileError) {
          setStudentProfileError(
            profileError instanceof Error
              ? profileError.message
              : 'Не удалось загрузить профиль студента'
          );
        } finally {
          setIsStudentProfileLoading(
            false
          );
        }
      },
      []
    );

  const openStudentMessage =
    useCallback(
      async (
        student: GroupStudent
      ) => {
        if (
          !user?.id ||
          openingMessageStudentId !==
            null
        ) {
          return;
        }

        setOpeningMessageStudentId(
          student.user_id
        );

        setActionError(null);

        const target:
          MessageDirectoryPerson = {
          userId: student.user_id,
          displayName:
            getStudentName(student),
          avatarUrl:
            student.avatar_url,
          role: 'student',
        };

        try {
          const chatsResponse =
            await getChats(user.id);

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
          setOpeningMessageStudentId(
            null
          );
        }
      },
      [
        navigate,
        openingMessageStudentId,
        user?.id,
      ]
    );

  const closeStudentProfile =
    () => {
      if (
        openingMessageStudentId !==
        null
      ) {
        return;
      }

      setSelectedProfileStudent(
        null
      );

      setSelectedStudentProfile(
        null
      );

      setStudentProfileError(
        null
      );
    };

  const totalStudentsCount =
    useMemo(
      () =>
        groups.reduce(
          (
            total,
            groupItem
          ) =>
            total +
            groupItem.students.length,
          0
        ),
      [groups]
    );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />

          <p className="text-sm text-gray-500">
            Загружаем группы преподавателя...
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
            Мои группы
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Учебные группы, в которых вы назначены преподавателем.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">
              Не удалось загрузить группы
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
              Не удалось выполнить действие
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
                {groups.length}
              </p>

              <p className="text-sm text-gray-500">
                Групп преподавателя
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
                {totalStudentsCount}
              </p>

              <p className="text-sm text-gray-500">
                Всего студентов
              </p>
            </div>
          </div>
        </div>
      </div>

      {!error &&
        groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Группы не найдены
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Текущий преподаватель пока не назначен ни в одну активную учебную группу.
            </p>
          </div>
        )}

      {groups.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          {groups.map(
            (groupItem) => {
              const {
                group,
                students,
                direction,
                branchName,
                roomName,
              } = groupItem;

              return (
                <article
                  key={group.id}
                  className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="border-b border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-gray-900">
                            {group.name}
                          </h2>

                          {group.is_active !==
                            false && (
                            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              Активна
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-medium uppercase tracking-wide text-gray-500">
                          Направление{' '}
                          {direction?.name ??
                            'не указано'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedGroupInfo(
                            groupItem
                          )
                        }
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100"
                      >
                        <Info className="h-4 w-4" />

                        <span className="hidden sm:inline">
                          О группе
                        </span>
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        <UserRound className="h-4 w-4" />

                        <span>
                          Студентов:{' '}
                          {students.length}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />

                        <span>
                          Филиал:{' '}
                          {branchName},
                          {' '}аудитория{' '}
                          {roomName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Студенты группы
                    </p>

                    {students.length ===
                    0 ? (
                      <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                        <p className="text-sm text-gray-500">
                          В группе пока нет активных студентов
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pb-3 pr-2">
                        {students.map(
                          (student) => {
                            const studentKey =
                              `${group.id}:${student.user_id}`;

                            const isExpanded =
                              expandedStudentKey ===
                              studentKey;

                            const isOpeningMessage =
                              openingMessageStudentId ===
                              student.user_id;

                            return (
                              <div
                                key={
                                  student.membership_id
                                }
                                className={`overflow-hidden rounded-xl border transition ${
                                  isExpanded
                                    ? 'border-red-100 bg-red-50/40'
                                    : 'border-transparent bg-gray-50 hover:border-gray-200'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedStudentKey(
                                      isExpanded
                                        ? null
                                        : studentKey
                                    );

                                    setActionError(
                                      null
                                    );
                                  }}
                                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                                  aria-expanded={
                                    isExpanded
                                  }
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <UserAvatar
                                      avatarUrl={
                                        student.avatar_url
                                      }
                                      alt={getStudentName(
                                        student
                                      )}
                                      className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm"
                                    />

                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {getStudentName(
                                        student
                                      )}
                                    </p>
                                  </div>

                                  <span className="shrink-0 text-xs font-medium text-gray-400">
                                    {isExpanded
                                      ? 'Скрыть'
                                      : 'Действия'}
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className="grid gap-2 border-t border-red-100 px-3 py-3 sm:grid-cols-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void openStudentProfile(
                                          student,
                                          group.name
                                        )
                                      }
                                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                                    >
                                      <Eye className="h-4 w-4" />
                                      Открыть профиль
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void openStudentMessage(
                                          student
                                        )
                                      }
                                      disabled={
                                        openingMessageStudentId !==
                                        null
                                      }
                                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                                    >
                                      {isOpeningMessage ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <MessageSquare className="h-4 w-4" />
                                      )}

                                      Написать сообщение
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 p-5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/dashboard/attendance?groupId=${group.id}`
                        )
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      <Users className="h-4 w-4" />
                      Посещаемость
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/dashboard/schedule?groupId=${group.id}`
                        )
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Расписание
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {selectedGroupInfo && (
        <TeacherGroupInfoModal
          isOpen
          groupName={
            selectedGroupInfo.group.name
          }
          isActive={
            selectedGroupInfo.group
              .is_active !== false
          }
          description={
            selectedGroupInfo.group
              .description ?? null
          }
          directionName={
            selectedGroupInfo.direction
              ?.name ?? 'Не указано'
          }
          directionDescription={
            selectedGroupInfo.direction
              ?.description ?? null
          }
          educationPlanName={
            getEducationPlanName(
              selectedGroupInfo.educationPlan,
              selectedGroupInfo.group
                .education_plan_id
            )
          }
          educationPlanDescription={
            selectedGroupInfo.educationPlan
              ?.description ?? null
          }
          educationPlanDuration={
            formatEducationPlanDuration(
              selectedGroupInfo.educationPlan
                ?.duration_months
            )
          }
          lessonsPerWeek={
            selectedGroupInfo.educationPlan
              ?.lessons_per_week
              ? String(
                  selectedGroupInfo
                    .educationPlan
                    .lessons_per_week
                )
              : 'Не указано'
          }
          startDate={formatGroupDate(
            selectedGroupInfo.group
              .start_date
          )}
          endDate={formatGroupDate(
            selectedGroupInfo.group
              .end_date
          )}
          branchName={
            selectedGroupInfo.branchName
          }
          roomName={
            selectedGroupInfo.roomName
          }
          onClose={() =>
            setSelectedGroupInfo(null)
          }
        />
      )}

      {selectedProfileStudent && (
        <TeacherStudentProfileModal
          isOpen
          isLoading={
            isStudentProfileLoading
          }
          isOpeningMessage={
            openingMessageStudentId ===
            selectedProfileStudent.student
              .user_id
          }
          error={
            studentProfileError
          }
          studentName={getStudentName(
            selectedProfileStudent.student
          )}
          studentAvatarUrl={
            selectedProfileStudent.student
              .avatar_url
          }
          groupName={
            selectedProfileStudent
              .groupName
          }
          profile={
            selectedStudentProfile
          }
          onClose={
            closeStudentProfile
          }
          onMessage={() =>
            void openStudentMessage(
              selectedProfileStudent.student
            )
          }
        />
      )}
    </div>
  );
}
