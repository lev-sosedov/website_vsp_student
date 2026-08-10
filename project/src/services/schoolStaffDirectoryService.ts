import { getScopedStaff, type ScopedStaffProfile } from '../api/userApi';

import type {
  MessageDirectoryPerson,
} from './messageDirectoryService';

export interface SchoolStaffDirectory {
  administrators: MessageDirectoryPerson[];
  teachers: MessageDirectoryPerson[];
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
  const users = await getScopedStaff();
  const uniqueUsers = new Map<number, ScopedStaffProfile>();
  for (const user of users) {
    const role = user.role.toLowerCase();
    if (user.user_id !== currentUserId && user.is_active && (role === 'admin' || role === 'teacher')) uniqueUsers.set(user.user_id, user);
  }
  const administrators: MessageDirectoryPerson[] = [];
  const teachers: MessageDirectoryPerson[] = [];
  for (const user of uniqueUsers.values()) {
    const person: MessageDirectoryPerson = {
      userId: user.user_id,
      displayName: user.display_name || (user.role.toLowerCase() === 'admin' ? '\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440' : '\u041f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c'),
      avatarUrl: user.avatar_url,
      role: user.role.toLowerCase() === 'admin' ? 'admin' : 'teacher',
    };
    (person.role === 'admin' ? administrators : teachers).push(person);
  }
  return { administrators: sortPeople(administrators), teachers: sortPeople(teachers) };
}
