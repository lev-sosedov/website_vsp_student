import { Mail, Phone } from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';

function getRoleLabel(role: string): string {
  switch (role) {
    case 'student':
      return 'Студент';

    case 'parent':
      return 'Родитель';

    case 'teacher':
      return 'Преподаватель';

    case 'admin':
      return 'Администратор';

    default:
      return role;
  }
}

function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  userName: string
): string {
  const fullName = [firstName, lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || userName;
}

function getInitials(
  firstName: string | null,
  lastName: string | null,
  userName: string
): string {
  const firstInitial = firstName?.trim()[0] ?? '';
  const lastInitial = lastName?.trim()[0] ?? '';

  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  if (initials) {
    return initials;
  }

  return userName.trim()[0]?.toUpperCase() ?? '?';
}

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = getDisplayName(
    user.first_name,
    user.last_name,
    user.user_name
  );

  const initials = getInitials(
    user.first_name,
    user.last_name,
    user.user_name
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Профиль
        </h1>

        <p className="mt-1 text-gray-500">
          Ваши личные данные
        </p>
      </div>

      <div className="card p-6">
        <div className="flex flex-col items-start gap-6 border-b border-gray-100 pb-6 sm:flex-row">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {displayName}
            </h2>

            <p className="text-sm text-gray-500">
              {getRoleLabel(user.role)}
            </p>

            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-gray-400" />

                <span>{user.email || 'Email не указан'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-4 w-4 text-gray-400" />

                <span>{user.phone_number || 'Телефон не указан'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary text-sm"
          >
            Редактировать
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
          <div>
            <label className="text-xs text-gray-400">
              Имя
            </label>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {user.first_name || '—'}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400">
              Фамилия
            </label>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {user.last_name || '—'}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400">
              Имя пользователя
            </label>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {user.user_name || '—'}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400">
              Email
            </label>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {user.email || '—'}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400">
              Телефон
            </label>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {user.phone_number || '—'}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400">
              Дата рождения
            </label>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {user.birthday || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}