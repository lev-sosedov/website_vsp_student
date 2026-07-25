import {
  getGroup,
  getGroupStudents,
  getGroupTeacher,
} from '../api/academicApi';

import {
  addChatMember,
  createChat,
  getChatMembers,
} from '../api/chatApi';

import {
  getUserById,
  type UserProfile,
} from '../api/userApi';

import type { Chat } from '../types';

export interface MessageDirectoryPerson {
  userId: number;
  displayName: string;
  avatarUrl: string | null;
  role: 'teacher' | 'student';
}

export interface MessageGroupDirectory {
  groupId: number;
  groupName: string;
  teacher: MessageDirectoryPerson | null;
  students: MessageDirectoryPerson[];
}

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

function getStudentName(
  student: {
    user_id: number;
    first_name: string | null;
    user_name: string | null;
  }
): string {
  return joinName(
    [
      student.first_name,
      student.user_name,
    ],
    `Студент №${student.user_id}`
  );
}

function getTeacherName(
  teacher: UserProfile
): string {
  return joinName(
    [
      teacher.user_name,
      teacher.last_name,
    ],
    `Преподаватель №${teacher.id}`
  );
}

export async function loadMessageGroupDirectory(
  groupId: number
): Promise<MessageGroupDirectory> {
  const [
    group,
    teacherMembership,
    studentsResponse,
  ] = await Promise.all([
    getGroup(groupId),
    getGroupTeacher(groupId),
    getGroupStudents(groupId),
  ]);

  let teacher: MessageDirectoryPerson | null =
    null;

  if (teacherMembership?.user_id) {
    try {
      const teacherProfile =
        await getUserById(
          teacherMembership.user_id
        );

      teacher = {
        userId: teacherProfile.id,
        displayName:
          getTeacherName(teacherProfile),
        avatarUrl:
          teacherProfile.avatar_url,
        role: 'teacher',
      };
    } catch {
      teacher = {
        userId: teacherMembership.user_id,
        displayName:
          `Преподаватель №${teacherMembership.user_id}`,
        avatarUrl: null,
        role: 'teacher',
      };
    }
  }

  const students =
    studentsResponse.items
      .filter((student) => student.is_active)
      .map(
        (
          student
        ): MessageDirectoryPerson => ({
          userId: student.user_id,
          displayName:
            getStudentName(student),
          avatarUrl: student.avatar_url,
          role: 'student',
        })
      )
      .sort((first, second) =>
        first.displayName.localeCompare(
          second.displayName,
          'ru'
        )
      );

  return {
    groupId,
    groupName:
      group.name?.trim() ||
      `Группа №${group.id}`,
    teacher,
    students,
  };
}

export async function loadMessageGroupDirectories(
  groupIds: number[]
): Promise<Record<number, MessageGroupDirectory>> {
  const uniqueGroupIds = [
    ...new Set(
      groupIds.filter(
        (groupId) =>
          Number.isInteger(groupId) &&
          groupId > 0
      )
    ),
  ];

  const results = await Promise.allSettled(
    uniqueGroupIds.map((groupId) =>
      loadMessageGroupDirectory(groupId)
    )
  );

  const directories: Record<
    number,
    MessageGroupDirectory
  > = {};

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      directories[uniqueGroupIds[index]] =
        result.value;
    }
  });

  return directories;
}

async function findPrivateChat(
  chats: Chat[],
  currentUserId: number,
  targetUserId: number
): Promise<Chat | null> {
  const privateChats = chats.filter(
    (chat) =>
      chat.chat_type === 'private' &&
      chat.is_active &&
      !chat.is_archived
  );

  const results = await Promise.allSettled(
    privateChats.map(async (chat) => ({
      chat,
      members: (
        await getChatMembers(chat.id)
      ).items.filter(
        (member) => member.is_active
      ),
    }))
  );

  for (const result of results) {
    if (result.status !== 'fulfilled') {
      continue;
    }

    const userIds = new Set(
      result.value.members.map(
        (member) => member.user_id
      )
    );

    if (
      userIds.size === 2 &&
      userIds.has(currentUserId) &&
      userIds.has(targetUserId)
    ) {
      return result.value.chat;
    }
  }

  return null;
}

export async function openOrCreatePrivateChat(
  chats: Chat[],
  currentUserId: number,
  target: MessageDirectoryPerson
): Promise<Chat> {
  const existingChat = await findPrivateChat(
    chats,
    currentUserId,
    target.userId
  );

  if (existingChat) {
    return existingChat;
  }

  const currentUser =
    await getUserById(currentUserId);

  const currentUserName = joinName(
    [
      currentUser.first_name,
      currentUser.user_name,
    ],
    `Пользователь №${currentUserId}`
  );

  const chat = await createChat({
    chat_type: 'private',
    title:
      `${currentUserName} — ${target.displayName}`,
    description: 'Личный чат студентов',
    created_by: currentUserId,
  });

  try {
    await addChatMember({
      chat_id: chat.id,
      user_id: target.userId,
      member_role: 'member',
      added_by: currentUserId,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Чат создан, но участник не добавлен: ${error.message}`
        : 'Чат создан, но участник не добавлен'
    );
  }

  return chat;
}
