export interface DisplayNameUser {
  id?: number;
  role?: string | null;
  user_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export function getUserDisplayName(
  user: DisplayNameUser | null | undefined,
  fallback = 'Пользователь'
): string {
  if (!user) {
    return fallback;
  }

  let displayName = '';

  switch (user.role) {
    /*
     * Преподаватель:
     * user_name — имя
     * last_name — отчество
     *
     * Например: Антон Викторович
     */
    case 'teacher':
      displayName = [
        user.user_name,
        user.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      break;

    /*
     * Родитель:
     * user_name — имя
     * last_name — отчество
     *
     * Например: Татьяна Александровна
     */
    case 'parent':
      displayName = [
        user.user_name,
        user.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      break;

    /*
     * Студент:
     * first_name — фамилия
     * user_name — имя
     *
     * Например: Соседов Лев
     */
    case 'student':
      displayName = [
        user.first_name,
        user.user_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      break;

    /*
     * Для администратора пока используем
     * имя + отчество.
     */
    case 'admin':
      displayName = [
        user.user_name,
        user.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      break;

    default:
      displayName = [
        user.user_name,
        user.last_name,
        user.first_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
  }

  return (
    displayName ||
    user.user_name ||
    (user.id
      ? `Пользователь №${user.id}`
      : fallback)
  );
}

export function getUserInitials(
  user: DisplayNameUser | null | undefined
): string {
  const displayName = getUserDisplayName(user, '');

  const words = displayName
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}