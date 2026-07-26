import {
  AlertCircle,
  Loader2,
  Search,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  assignGroupStudent,
  removeGroupMember,
} from '../../../api/academicApi';

import UserAvatar from '../../common/UserAvatar';

import {
  getAdminGroupStudentName,
  loadAdminGroupMembers,
  type AdminGroupItem,
  type AdminGroupMembersData,
  type AdminGroupStudentItem,
} from '../../../services/adminGroupsService';

interface AdminGroupMembersModalProps {
  item: AdminGroupItem | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

const EMPTY_DATA: AdminGroupMembersData = {
  members: [],
  availableStudents: [],
};

function getErrorMessage(
  error: unknown
): string {
  if (!(error instanceof Error)) {
    return 'Не удалось выполнить операцию';
  }

  try {
    const parsed = JSON.parse(
      error.message
    ) as {
      detail?: string;
      message?: string;
    };

    return (
      parsed.detail ??
      parsed.message ??
      error.message
    );
  } catch {
    return error.message;
  }
}

function matchesSearch(
  item: AdminGroupStudentItem,
  searchValue: string
): boolean {
  const normalizedSearch =
    searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const profile = item.profile;

  return [
    getAdminGroupStudentName(profile),
    profile.phone_number,
    profile.email,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch);
}

export default function AdminGroupMembersModal({
  item,
  onClose,
  onChanged,
}: AdminGroupMembersModalProps) {
  const [data, setData] =
    useState<AdminGroupMembersData>(
      EMPTY_DATA
    );
  const [isLoading, setIsLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [searchValue, setSearchValue] =
    useState('');
  const [activeUserId, setActiveUserId] =
    useState<number | null>(null);
  const [activeTab, setActiveTab] =
    useState<'members' | 'available'>(
      'members'
    );

  const loadMembers = useCallback(
    async () => {
      if (!item) {
        setData(EMPTY_DATA);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        setData(
          await loadAdminGroupMembers(
            item.group.id
          )
        );
      } catch (loadError) {
        setData(EMPTY_DATA);
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [item]
  );

  useEffect(() => {
    if (!item) {
      return;
    }

    setSearchValue('');
    setActiveTab('members');
    void loadMembers();
  }, [item, loadMembers]);

  const visibleMembers = useMemo(
    () =>
      data.members.filter((member) =>
        matchesSearch(member, searchValue)
      ),
    [data.members, searchValue]
  );

  const visibleAvailableStudents =
    useMemo(
      () =>
        data.availableStudents.filter(
          (student) =>
            matchesSearch(
              student,
              searchValue
            )
        ),
      [
        data.availableStudents,
        searchValue,
      ]
    );

  if (!item) {
    return null;
  }

  const isGroupActive =
    item.group.is_active !== false;

  const handleAdd = async (
    student: AdminGroupStudentItem
  ) => {
    setActiveUserId(student.profile.id);
    setError(null);

    try {
      await assignGroupStudent(
        item.group.id,
        student.profile.id
      );
      await loadMembers();
      await onChanged();
    } catch (actionError) {
      setError(
        getErrorMessage(actionError)
      );
    } finally {
      setActiveUserId(null);
    }
  };

  const handleRemove = async (
    student: AdminGroupStudentItem
  ) => {
    if (!student.membership) {
      return;
    }

    const confirmed = window.confirm(
      `Исключить студента «${getAdminGroupStudentName(
        student.profile
      )}» из группы «${item.group.name}»?`
    );

    if (!confirmed) {
      return;
    }

    setActiveUserId(student.profile.id);
    setError(null);

    try {
      await removeGroupMember(
        student.membership.membership_id
      );
      await loadMembers();
      await onChanged();
    } catch (actionError) {
      setError(
        getErrorMessage(actionError)
      );
    } finally {
      setActiveUserId(null);
    }
  };

  const displayedItems =
    activeTab === 'members'
      ? visibleMembers
      : visibleAvailableStudents;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-3 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-group-members-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          activeUserId === null
        ) {
          onClose();
        }
      }}
    >
      <div className="flex h-[min(760px,92vh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="admin-group-members-title"
              className="text-lg font-bold text-gray-900"
            >
              Студенты группы
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {item.group.name} · в группе:{' '}
              {data.members.length}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={activeUserId !== null}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Закрыть окно"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-100 p-4 sm:px-6">
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() =>
                setActiveTab('members')
              }
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === 'members'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              В группе ({data.members.length})
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveTab('available')
              }
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === 'available'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Добавить (
              {data.availableStudents.length})
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchValue}
              onChange={(event) =>
                setSearchValue(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              placeholder="Фамилия, имя, телефон или email"
            />
          </div>

          {!isGroupActive &&
            activeTab === 'available' && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Сначала восстановите группу, чтобы
                добавлять студентов.
              </p>
            )}

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2 sm:px-6">
          {isLoading ? (
            <div className="flex h-full min-h-52 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-red-600" />
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="flex h-full min-h-52 flex-col items-center justify-center text-center">
              <Users className="h-9 w-9 text-gray-300" />
              <p className="mt-3 font-medium text-gray-700">
                {searchValue.trim()
                  ? 'Ничего не найдено'
                  : activeTab === 'members'
                    ? 'В группе пока нет студентов'
                    : 'Все студенты уже добавлены'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayedItems.map((student) => {
                const profile =
                  student.profile;
                const isActive =
                  activeUserId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        avatarUrl={
                          profile.avatar_url
                        }
                        alt={getAdminGroupStudentName(
                          profile
                        )}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                          {getAdminGroupStudentName(
                            profile
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {[
                            profile.phone_number,
                            profile.email,
                          ]
                            .filter(Boolean)
                            .join(' · ') ||
                            'Контакты не указаны'}
                        </p>
                        {!profile.is_active && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            Аккаунт заблокирован
                          </p>
                        )}
                      </div>
                    </div>

                    {activeTab === 'members' ? (
                      <button
                        type="button"
                        onClick={() =>
                          void handleRemove(
                            student
                          )
                        }
                        disabled={
                          activeUserId !== null
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                        Исключить
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void handleAdd(student)
                        }
                        disabled={
                          activeUserId !== null ||
                          !isGroupActive ||
                          !profile.is_active
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        Добавить
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
