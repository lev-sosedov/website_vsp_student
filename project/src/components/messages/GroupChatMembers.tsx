import {
  ChevronDown,
  Loader2,
  UserRound,
} from 'lucide-react';

import type {
  MessageDirectoryPerson,
  MessageGroupDirectory,
} from '../../services/messageDirectoryService';

import UserAvatar from '../common/UserAvatar';

interface GroupChatMembersProps {
  directory: MessageGroupDirectory | null;
  isExpanded: boolean;
  isLoading: boolean;
  currentUserId: number | null;
  openingPersonId: number | null;
  onToggle: () => void;
  onPersonClick: (
    person: MessageDirectoryPerson
  ) => void;
}

function PersonAvatar({
  person,
}: {
  person: MessageDirectoryPerson;
}) {
  return (
    <UserAvatar
      avatarUrl={person.avatarUrl}
      alt={person.displayName}
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  );
}

export default function GroupChatMembers({
  directory,
  isExpanded,
  isLoading,
  currentUserId,
  openingPersonId,
  onToggle,
  onPersonClick,
}: GroupChatMembersProps) {
  const studentsCount =
    directory?.students.length ?? 0;

  return (
    <div className="border-t border-gray-100 bg-gray-50/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
      >
        <span>
          Участники
          {directory
            ? ` (${studentsCount + (directory.teacher ? 1 : 0)})`
            : ''}
        </span>

        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="space-y-1 border-t border-gray-100 px-3 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-red-600" />
            </div>
          ) : !directory ? (
            <p className="px-2 py-3 text-center text-xs text-gray-400">
              Не удалось загрузить участников
            </p>
          ) : (
            <>
              {directory.teacher && (
                <button
                  type="button"
                  disabled={
                    directory.teacher.userId ===
                      currentUserId ||
                    openingPersonId ===
                      directory.teacher.userId
                  }
                  onClick={() =>
                    onPersonClick(
                      directory.teacher!
                    )
                  }
                  className="flex w-full items-center gap-2 rounded-lg bg-white px-2 py-2 text-left transition hover:bg-red-50 disabled:cursor-default disabled:opacity-60"
                >
                  <PersonAvatar
                    person={directory.teacher}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-800">
                      {
                        directory.teacher
                          .displayName
                      }
                    </p>

                    <p className="text-[10px] font-medium text-red-600">
                      {openingPersonId ===
                      directory.teacher.userId
                        ? 'Открываем чат…'
                        : 'Преподаватель · нажмите, чтобы написать'}
                    </p>
                  </div>

                  {openingPersonId ===
                  directory.teacher.userId ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  ) : (
                    <UserRound className="h-4 w-4 text-red-300" />
                  )}
                </button>
              )}

              {directory.students.map(
                (student) => {
                  const isCurrentUser =
                    student.userId ===
                    currentUserId;

                  const isOpening =
                    openingPersonId ===
                    student.userId;

                  return (
                    <button
                      key={student.userId}
                      type="button"
                      disabled={
                        isCurrentUser ||
                        isOpening
                      }
                      onClick={() =>
                        onPersonClick(student)
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-white disabled:cursor-default disabled:opacity-60"
                    >
                      <PersonAvatar
                        person={student}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-700">
                          {student.displayName}
                          {isCurrentUser
                            ? ' (Вы)'
                            : ''}
                        </p>

                        <p className="text-[10px] text-gray-400">
                          {isOpening
                            ? 'Открываем чат…'
                            : isCurrentUser
                              ? 'Текущий пользователь'
                              : 'Нажмите, чтобы написать'}
                        </p>
                      </div>

                      {isOpening ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <UserRound className="h-4 w-4 text-gray-300" />
                      )}
                    </button>
                  );
                }
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
