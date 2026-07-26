import {
  CalendarDays,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  UserRound,
  X,
} from 'lucide-react';

import type {
  UserProfile,
} from '../../../api/userApi';

import UserAvatar from '../../common/UserAvatar';

interface TeacherStudentProfileModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isOpeningMessage: boolean;
  error: string | null;
  studentName: string;
  studentAvatarUrl: string | null;
  groupName: string;
  profile: UserProfile | null;
  onClose: () => void;
  onMessage: () => void;
}

function formatBirthday(value: string | null): string {
  if (!value) {
    return 'Не указана';
  }

  const dateParts = value.split('-').map(Number);

  if (
    dateParts.length !== 3 ||
    dateParts.some((part) => !Number.isFinite(part))
  ) {
    return value;
  }

  const [year, month, day] = dateParts;

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export default function TeacherStudentProfileModal({
  isOpen,
  isLoading,
  isOpeningMessage,
  error,
  studentName,
  studentAvatarUrl,
  groupName,
  profile,
  onClose,
  onMessage,
}: TeacherStudentProfileModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-student-profile-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <UserAvatar
              avatarUrl={
                profile?.avatar_url ??
                studentAvatarUrl
              }
              alt={studentName}
              className="h-16 w-16 shrink-0 rounded-full object-cover shadow-sm"
            />

            <div className="min-w-0">
              <h2
                id="teacher-student-profile-title"
                className="truncate text-xl font-bold text-gray-900"
              >
                {studentName}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {groupName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isOpeningMessage}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Закрыть профиль студента"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-48 flex-col items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-red-600" />

              <p className="mt-3 text-sm text-gray-500">
                Загружаем профиль студента…
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <UserRound className="h-5 w-5 shrink-0 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">
                    Имя пользователя
                  </p>

                  <p className="text-sm font-medium text-gray-900">
                    {profile?.user_name || 'Не указано'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <Phone className="h-5 w-5 shrink-0 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">
                    Телефон
                  </p>

                  <p className="text-sm font-medium text-gray-900">
                    {profile?.phone_number || 'Не указан'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <Mail className="h-5 w-5 shrink-0 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">
                    Электронная почта
                  </p>

                  <p className="break-all text-sm font-medium text-gray-900">
                    {profile?.email || 'Не указана'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <CalendarDays className="h-5 w-5 shrink-0 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">
                    Дата рождения
                  </p>

                  <p className="text-sm font-medium text-gray-900">
                    {formatBirthday(
                      profile?.birthday ?? null
                    )}
                  </p>
                </div>
              </div>

              {profile?.about?.trim() && (
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400">
                    О студенте
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {profile.about}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 p-5 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isOpeningMessage}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Закрыть
          </button>

          <button
            type="button"
            onClick={onMessage}
            disabled={isOpeningMessage}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isOpeningMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}

            Написать сообщение
          </button>
        </div>
      </div>
    </div>
  );
}
