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
  Loader2,
  UserRound,
  Users,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../../context/AuthContext';

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
  branchName: string;
  auditoriumName: string;
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


const API_URL = import.meta.env.VITE_API_URL;

function getAccessToken(): string | null {
  return (
    localStorage.getItem('vshp_access_token') ??
    localStorage.getItem('access_token') ??
    localStorage.getItem('accessToken')
  );
}

async function academicRequest<T>(
  endpoint: string
): Promise<T> {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
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


async function getUserProfile(
  userId: number
): Promise<UserProfileResponse | null> {
  const candidateEndpoints = [
    `/api/v1/users/${userId}`,
    `/api/v1/users/id/${userId}`,
  ];

  for (const endpoint of candidateEndpoints) {
    try {
      return await academicRequest<UserProfileResponse>(
        endpoint
      );
    } catch {
      // Пробуем следующий поддерживаемый маршрут Gateway.
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

function extractStreetName(
  value: string | null | undefined
): string | null {
  const address = value?.trim();

  if (!address) {
    return null;
  }

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const streetPart =
    parts.find((part) =>
      /(^|\s)(ул\.?|улица|проспект|пр-т|переулок|пер\.?|шоссе|бульвар|наб\.?|набережная)\s/i.test(
        part
      )
    ) ??
    parts.find((part) =>
      /[А-Яа-яЁёA-Za-z]/.test(part) &&
      !/^\d{5,6}$/.test(part) &&
      !/^(Россия|РФ|край|область|республика|город|г\.)\b/i.test(
        part
      )
    );

  if (!streetPart) {
    return null;
  }

  return streetPart
    .replace(
      /\s+(д\.?|дом)\s*\d+[А-Яа-яA-Za-z\d\/-]*.*$/i,
      ''
    )
    .replace(
      /,?\s*\d+[А-Яа-яA-Za-z\d\/-]*\s*$/,
      ''
    )
    .trim();
}

function getBranchStreet(
  branch: AcademicBranchResponse | null,
  address: BranchAddressResponse | null
): string {
  const directStreet =
    address?.street?.trim() ||
    address?.street_name?.trim();

  if (directStreet) {
    return directStreet;
  }

  return (
    extractStreetName(
      address?.full_address ??
      address?.address ??
      branch?.address
    ) ??
    branch?.name?.trim() ??
    branch?.title?.trim() ??
    branch?.short_name?.trim() ??
    'не указан'
  );
}

function getAuditoriumName(
  branch: AcademicBranchResponse | null,
  fallbackId: number | null | undefined
): string {
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

  return fallbackId
    ? String(fallbackId)
    : 'не указана';
}
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}

function getStudentName(student: GroupStudent): string {
  const studentName = [
    student.first_name,
    student.user_name,
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .map((value) => value.trim())
    .join(' ');

  if (studentName) {
    return studentName;
  }

  const legacyName = [
    student.last_name,
    student.first_name,
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .map((value) => value.trim())
    .join(' ');

  return legacyName || `Студент №${student.user_id}`;
}

function getStudentInitials(
  student: GroupStudent
): string {
  const displayName = getStudentName(student);

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  return initials || 'С';
}

export default function TeacherGroups() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  const [groups, setGroups] = useState<TeacherGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!user?.id) {
      setGroups([]);
      setLoading(false);
      setError('Не удалось определить текущего преподавателя');
      return;
    }

    const userId = Number(user.id);

    if (!Number.isFinite(userId)) {
      setGroups([]);
      setLoading(false);
      setError('Некорректный ID текущего преподавателя');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const memberships = await getActiveUserGroups(userId);

      const teacherMemberships = memberships.filter(
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

      const loadedGroups = await Promise.all(
        teacherMemberships.map(async (membership) => {
          const [
            group,
            studentResponse,
          ] = await Promise.all([
            getGroup(membership.group_id),
            getGroupStudents(membership.group_id),
          ]);

          const [direction, branch] =
            await Promise.all([
              group.direction_id
                ? getDirection(group.direction_id).catch(
                    (directionError) => {
                      console.error(
                        `Не удалось загрузить направление группы ${group.id}:`,
                        directionError
                      );

                      return null;
                    }
                  )
                : Promise.resolve(null),

              group.branch_id
                ? getBranch(group.branch_id).catch(
                    (branchError) => {
                      console.error(
                        `Не удалось загрузить филиал группы ${group.id}:`,
                        branchError
                      );

                      return null;
                    }
                  )
                : Promise.resolve(null),
            ]);

          const branchAddressId =
            branch?.branch_address_id ??
            branch?.address_id ??
            null;

          const branchAddress =
            branchAddresses.find(
              (address) =>
                (
                  branchAddressId !== null &&
                  address.id === branchAddressId
                ) ||
                address.branch_id === group.branch_id
            ) ?? null;

          const branchName =
            getBranchStreet(
              branch,
              branchAddress
            );

          const activeStudents =
            studentResponse.items.filter(
              (student) => student.is_active
            );

          const enrichedStudents =
            await enrichGroupStudents(
              activeStudents
            );

          return {
            membershipId: membership.id,
            group,
            students: enrichedStudents,
            direction,
            branchName,
            auditoriumName:
              getAuditoriumName(
                branch,
                group.branch_id
              ),
          };
        })
      );

      loadedGroups.sort((firstGroup, secondGroup) =>
        firstGroup.group.name.localeCompare(
          secondGroup.group.name,
          'ru'
        )
      );

      setGroups(loadedGroups);
    } catch (loadError) {
      console.error(
        'Не удалось загрузить группы преподавателя:',
        loadError
      );

      setGroups([]);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const totalStudentsCount = useMemo(
    () =>
      groups.reduce(
        (total, groupItem) =>
          total + groupItem.students.length,
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

      {!error && groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Группы не найдены
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Текущий преподаватель пока не назначен ни в одну
            активную учебную группу.
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          {groups.map((groupItem) => {
            const {
              group,
              students,
              direction,
              branchName,
              auditoriumName,
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

                        {group.is_active !== false && (
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

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      <UserRound className="h-4 w-4" />

                      <span>
                        Студентов: {students.length}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />

                      <span>
                        Филиал: {branchName},
                        {' '}аудитория {auditoriumName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Студенты группы
                  </p>

                  {students.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">
                        В группе пока нет активных студентов
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">
                      {students.map((student) => (
                        <div
                          key={student.membership_id}
                          className="flex items-center rounded-xl bg-gray-50 px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-semibold text-red-600 shadow-sm">
                              {student.avatar_url ? (
                                <img
                                  src={student.avatar_url}
                                  alt={getStudentName(student)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getStudentInitials(student)
                              )}
                            </div>

                            <p className="truncate text-sm font-medium text-gray-900">
                              {getStudentName(student)}
                            </p>
                          </div>
                        </div>
                      ))}
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
          })}
        </div>
      )}
    </div>
  );
}