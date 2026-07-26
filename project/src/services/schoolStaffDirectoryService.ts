import {
  getUsers,
  type UserProfile,
} from '../api/userApi';

import type {
  MessageDirectoryPerson,
} from './messageDirectoryService';

export interface SchoolStaffDirectory {
  administrators: MessageDirectoryPerson[];
  teachers: MessageDirectoryPerson[];
}

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

function joinName(
  values: Array<string | null | undefined>,
  fallback: string
): string {
  const name = values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || fallback;
}

function getStaffName(
  user: UserProfile
): string {
  return joinName(
    [user.user_name, user.last_name],
    user.role.toLowerCase() === 'admin'
      ? 'Администратор'
      : 'Преподаватель'
  );
}

async function loadUsersByRole(
  role: 'admin' | 'teacher'
): Promise<UserProfile[]> {
  const users: UserProfile[] = [];

  for (
    let page = 0;
    page < MAX_PAGES;
    page += 1
  ) {
    const response = await getUsers({
      role,
      isActive: true,
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    });

    users.push(...response.items);

    if (
      response.items.length < PAGE_SIZE ||
      users.length >= response.total
    ) {
      break;
    }
  }

  return users;
}

function toDirectoryPerson(
  user: UserProfile,
  role: 'admin' | 'teacher'
): MessageDirectoryPerson {
  return {
    userId: user.id,
    displayName: getStaffName(user),
    avatarUrl: user.avatar_url,
    role,
  };
}

function sortPeople(
  people: MessageDirectoryPerson[]
): MessageDirectoryPerson[] {
  return people.sort((first, second) =>
    first.displayName.localeCompare(
      second.displayName,
      'ru'
    )
  );
}

export async function loadSchoolStaffDirectory(
  currentUserId: number
): Promise<SchoolStaffDirectory> {
  const [administratorUsers, teacherUsers] =
    await Promise.all([
      loadUsersByRole('admin'),
      loadUsersByRole('teacher'),
    ]);

  /*
   * Если backend пока игнорирует параметр role,
   * клиентская фильтрация всё равно не позволит
   * показать студентов или родителей.
   */
  const uniqueUsers = new Map<
    number,
    UserProfile
  >();

  for (const user of [
    ...administratorUsers,
    ...teacherUsers,
  ]) {
    if (
      user.id !== currentUserId &&
      user.is_active &&
      ['admin', 'teacher'].includes(
        user.role.toLowerCase()
      )
    ) {
      uniqueUsers.set(user.id, user);
    }
  }

  const administrators:
    MessageDirectoryPerson[] = [];
  const teachers: MessageDirectoryPerson[] =
    [];

  for (const user of uniqueUsers.values()) {
    const role = user.role.toLowerCase();

    if (role === 'admin') {
      administrators.push(
        toDirectoryPerson(user, 'admin')
      );
    } else if (role === 'teacher') {
      teachers.push(
        toDirectoryPerson(user, 'teacher')
      );
    }
  }

  return {
    administrators:
      sortPeople(administrators),
    teachers: sortPeople(teachers),
  };
}
