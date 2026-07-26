import {
  Building2,
  ChevronDown,
  Loader2,
  MessageCircle,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  MessageDirectoryPerson,
} from '../../services/messageDirectoryService';

import {
  loadSchoolStaffDirectory,
  type SchoolStaffDirectory as SchoolStaffDirectoryData,
} from '../../services/schoolStaffDirectoryService';

import UserAvatar from '../common/UserAvatar';

interface SchoolStaffDirectoryProps {
  currentUserId: number;
  openingPersonId: number | null;
  onPersonClick: (
    person: MessageDirectoryPerson
  ) => void;
}

const EMPTY_DIRECTORY: SchoolStaffDirectoryData = {
  administrators: [],
  teachers: [],
};

function StaffSection({
  title,
  people,
  openingPersonId,
  onPersonClick,
  icon: Icon,
}: {
  title: string;
  people: MessageDirectoryPerson[];
  openingPersonId: number | null;
  onPersonClick: (
    person: MessageDirectoryPerson
  ) => void;
  icon: typeof Users;
}) {
  if (people.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center gap-2 px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        <Icon className="h-3.5 w-3.5" />
        {title} ({people.length})
      </div>

      <div>
        {people.map((person) => {
          const isOpening =
            openingPersonId === person.userId;

          return (
            <button
              key={person.userId}
              type="button"
              disabled={isOpening}
              onClick={() =>
                onPersonClick(person)
              }
              className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-left transition last:border-b-0 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
            >
              <UserAvatar
                avatarUrl={person.avatarUrl}
                alt={person.displayName}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {person.displayName}
                </p>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  {isOpening
                    ? 'Открываем диалог…'
                    : person.role === 'admin'
                      ? 'Администратор'
                      : 'Преподаватель'}
                </p>
              </div>

              {isOpening ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-red-500" />
              ) : (
                <MessageCircle className="h-4 w-4 shrink-0 text-gray-300" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function SchoolStaffDirectory({
  currentUserId,
  openingPersonId,
  onPersonClick,
}: SchoolStaffDirectoryProps) {
  const [isExpanded, setIsExpanded] =
    useState(false);
  const [directory, setDirectory] =
    useState<SchoolStaffDirectoryData>(
      EMPTY_DIRECTORY
    );
  const [searchValue, setSearchValue] =
    useState('');
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const loadDirectory = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setIsLoading(true);
      }

      try {
        const nextDirectory =
          await loadSchoolStaffDirectory(
            currentUserId
          );

        setDirectory(nextDirectory);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Не удалось загрузить контакты школы'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    void loadDirectory(true);

    const refreshTimer = window.setInterval(
      () => {
        void loadDirectory();
      },
      60_000
    );

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [loadDirectory]);

  const normalizedSearch =
    searchValue.trim().toLowerCase();

  const filteredDirectory = useMemo(() => {
    if (!normalizedSearch) {
      return directory;
    }

    const filterPeople = (
      people: MessageDirectoryPerson[]
    ) =>
      people.filter((person) =>
        person.displayName
          .toLowerCase()
          .includes(normalizedSearch)
      );

    return {
      administrators: filterPeople(
        directory.administrators
      ),
      teachers: filterPeople(
        directory.teachers
      ),
    };
  }, [directory, normalizedSearch]);

  const totalCount =
    directory.administrators.length +
    directory.teachers.length;

  const filteredCount =
    filteredDirectory.administrators.length +
    filteredDirectory.teachers.length;

  return (
    <div className="border-b border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => {
          setIsExpanded((current) => !current);

          if (!isExpanded) {
            void loadDirectory();
          }
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Building2 className="h-[18px] w-[18px]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900">
            Контакты школы
          </span>

          <span className="block text-[11px] text-gray-400">
            Все филиалы
            {!isLoading
              ? ` · ${totalCount} сотрудников`
              : ''}
          </span>
        </span>

        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-red-500" />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />

              <input
                type="search"
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Имя сотрудника"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto overscroll-contain bg-white">
            {error ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadDirectory(true)
                  }
                  className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Повторить
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
              </div>
            ) : filteredCount === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">
                Сотрудники не найдены
              </p>
            ) : (
              <>
                <StaffSection
                  title="Администрация"
                  people={
                    filteredDirectory.administrators
                  }
                  openingPersonId={
                    openingPersonId
                  }
                  onPersonClick={onPersonClick}
                  icon={ShieldCheck}
                />

                <StaffSection
                  title="Преподаватели"
                  people={
                    filteredDirectory.teachers
                  }
                  openingPersonId={
                    openingPersonId
                  }
                  onPersonClick={onPersonClick}
                  icon={Users}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
