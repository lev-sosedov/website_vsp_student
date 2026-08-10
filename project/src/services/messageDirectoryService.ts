import {
  getGroup,
  getGroupMembers,
  getGroupStudents,
  getGroupTeacher,
  type AcademicGroup,
  type GroupMember,
} from '../api/academicApi';

import {
  addChatMember,
  createChat,
  getChatMembers,
} from '../api/chatApi';

import {
  getUserById,
  getUsersByIds,
  type UserProfile,
} from '../api/userApi';

import type { Chat } from '../types';

export interface MessageDirectoryPerson {
  userId: number;
  displayName: string;
  avatarUrl: string | null;
  role: 'admin' | 'teacher' | 'parent' | 'student';
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
  groupId: number,
  fallbackTeacherUserId: number | null = null
): Promise<MessageGroupDirectory> {
  const [
    groupResult,
    membersResult,
    teacherResult,
    studentsResult,
  ] = await Promise.allSettled([
    getGroup(groupId),
    getGroupMembers(groupId),
    getGroupTeacher(groupId),
    getGroupStudents(groupId),
  ]);

  const group: AcademicGroup | null =
    groupResult.status === 'fulfilled'
      ? groupResult.value
      : null;

  const members: GroupMember[] =
    membersResult.status === 'fulfilled'
      ? membersResult.value.filter(
          (member) =>
            member.is_active &&
            member.left_at === null
        )
      : [];

  const teacherMembership =
    teacherResult.status === 'fulfilled'
      ? teacherResult.value
      : members.find(
          (member) =>
            member.role === 'teacher'
        ) ?? null;

  const teacherUserId =
    teacherMembership?.user_id ??
    group?.teacher_id ??
    fallbackTeacherUserId ??
    null;

  let teacher: MessageDirectoryPerson | null =
    null;

  if (teacherUserId) {
    try {
      const teacherProfile =
        await getUserById(
          teacherUserId
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
        userId: teacherUserId,
        displayName:
          `Преподаватель №${teacherUserId}`,
        avatarUrl: null,
        role: 'teacher',
      };
    }
  }

  let students: MessageDirectoryPerson[] = [];

  if (studentsResult.status === 'fulfilled') {
    const activeStudents =
      studentsResult.value.items.filter(
        (student) => student.is_active
      );

    /*
     * Academic Service может вернуть только ID и
     * технические подписи. Всегда дополняем участников
     * актуальными профилями из User Service.
     */
    const profiles = await getUsersByIds(
      activeStudents.map(
        (student) => student.user_id
      )
    );

    students = activeStudents
      .map(
        (
          student
        ): MessageDirectoryPerson => {
          const profile =
            profiles[student.user_id];

          return {
            userId: student.user_id,
            displayName: profile
              ? joinName(
                  [
                    profile.first_name,
                    profile.user_name,
                  ],
                  getStudentName(student)
                )
              : getStudentName(student),
            avatarUrl:
              profile?.avatar_url ??
              student.avatar_url,
            role: 'student',
          };
        }
      );
  } else {
    const studentMemberships = members.filter(
      (member) =>
        member.role === 'student'
    );

    const profiles = await getUsersByIds(
      studentMemberships.map(
        (member) => member.user_id
      )
    );

    students = studentMemberships.map(
      (
        member
      ): MessageDirectoryPerson => {
        const profile =
          profiles[member.user_id];

        return {
          userId: member.user_id,
          displayName: profile
            ? joinName(
                [
                  profile.first_name,
                  profile.user_name,
                ],
                `Студент №${member.user_id}`
              )
            : `Студент №${member.user_id}`,
          avatarUrl:
            profile?.avatar_url ?? null,
          role: 'student',
        };
      }
    );
  }

  students.sort((first, second) =>
    first.displayName.localeCompare(
      second.displayName,
      'ru'
    )
  );

  if (
    !group &&
    members.length === 0 &&
    students.length === 0
  ) {
    throw new Error(
      `Не удалось загрузить группу №${groupId}`
    );
  }

  return {
    groupId,
    groupName:
      group?.name?.trim() ||
      `Группа №${groupId}`,
    teacher,
    students,
  };
}

export async function loadMessageGroupDirectories(
  groupIds: number[],
  fallbackTeacherIdsByGroupId: Record<
    number,
    number
  > = {}
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
      loadMessageGroupDirectory(
        groupId,
        fallbackTeacherIdsByGroupId[
          groupId
        ] ?? null
      )
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

function getChatSortTimestamp(
  chat: Chat
): number {
  const updatedAt = new Date(
    chat.updated_at
  ).getTime();

  if (Number.isFinite(updatedAt)) {
    return updatedAt;
  }

  const createdAt = new Date(
    chat.created_at
  ).getTime();

  return Number.isFinite(createdAt)
    ? createdAt
    : 0;
}

function selectPreferredChat(
  firstChat: Chat,
  secondChat: Chat
): Chat {
  const firstTimestamp =
    getChatSortTimestamp(firstChat);

  const secondTimestamp =
    getChatSortTimestamp(secondChat);

  if (firstTimestamp !== secondTimestamp) {
    return firstTimestamp > secondTimestamp
      ? firstChat
      : secondChat;
  }

  return firstChat.id < secondChat.id
    ? firstChat
    : secondChat;
}

async function getPrivateChatPartnerId(
  chat: Chat,
  currentUserId: number
): Promise<number | null> {
  if (
    chat.chat_type !== 'private' ||
    !chat.is_active ||
    chat.is_archived
  ) {
    return null;
  }

  const members = (
    await getChatMembers(chat.id)
  ).items.filter(
    (member) => member.is_active
  );

  const participantIds = new Set(
    members.map(
      (member) => member.user_id
    )
  );

  /*
   * В некоторых версиях Communication Service
   * создатель хранится только в created_by.
   */
  participantIds.add(chat.created_by);

  if (!participantIds.has(currentUserId)) {
    return null;
  }

  const partnerIds = [...participantIds]
    .filter(
      (userId) => userId !== currentUserId
    );

  return partnerIds.length === 1
    ? partnerIds[0]
    : null;
}

async function deduplicatePrivateChatsByPartner(
  chats: Chat[],
  parentId: number
): Promise<Chat[]> {
  /*
   * Сначала удаляем повтор одной и той же записи,
   * если API вернул чат несколько раз из-за JOIN.
   */
  const uniqueChatsById = new Map<number, Chat>();

  chats.forEach((chat) => {
    const existingChat =
      uniqueChatsById.get(chat.id);

    uniqueChatsById.set(
      chat.id,
      existingChat
        ? selectPreferredChat(
            existingChat,
            chat
          )
        : chat
    );
  });

  const uniqueChats = [
    ...uniqueChatsById.values(),
  ];

  const visiblePrivateChats = uniqueChats.filter(
    (chat) =>
      chat.chat_type === 'private' &&
      chat.is_active &&
      !chat.is_archived
  );

  const partnerResults =
    await Promise.allSettled(
      visiblePrivateChats.map(
        async (chat) => ({
          chat,
          partnerId:
            await getPrivateChatPartnerId(
              chat,
              parentId
            ),
        })
      )
    );

  const chatByPartnerId =
    new Map<number, Chat>();

  const duplicateChatIds =
    new Set<number>();

  partnerResults.forEach((result) => {
    if (
      result.status !== 'fulfilled' ||
      result.value.partnerId === null
    ) {
      return;
    }

    const { chat, partnerId } = result.value;
    const existingChat =
      chatByPartnerId.get(partnerId);

    if (!existingChat) {
      chatByPartnerId.set(
        partnerId,
        chat
      );
      return;
    }

    const preferredChat =
      selectPreferredChat(
        existingChat,
        chat
      );

    const duplicateChat =
      preferredChat.id === existingChat.id
        ? chat
        : existingChat;

    chatByPartnerId.set(
      partnerId,
      preferredChat
    );

    duplicateChatIds.add(
      duplicateChat.id
    );
  });

  return uniqueChats.filter(
    (chat) =>
      !duplicateChatIds.has(chat.id)
  );
}

async function findPrivateChat(
  chats: Chat[],
  currentUserId: number,
  targetUserId: number,
  includeUnavailable = false
): Promise<Chat | null> {
  const privateChats = chats.filter(
    (chat) =>
      chat.chat_type === 'private' &&
      (
        includeUnavailable ||
        (
          chat.is_active &&
          !chat.is_archived
        )
      )
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

    const participantIds = new Set(
      result.value.members.map(
        (member) => member.user_id
      )
    );

    // Communication Service may keep the chat creator only in
    // `created_by` without a separate row in chat-members. Treat the
    // creator as a participant so an existing personal chat is not
    // mistaken for a new one.
    participantIds.add(
      result.value.chat.created_by
    );

    const hasUnrelatedParticipant = [
      ...participantIds,
    ].some(
      (userId) =>
        userId !== currentUserId &&
        userId !== targetUserId
    );

    if (
      !hasUnrelatedParticipant &&
      participantIds.has(currentUserId) &&
      participantIds.has(targetUserId)
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
    description:
      target.role === 'admin'
        ? 'Личный чат с администрацией'
        : target.role === 'teacher'
          ? 'Личный чат с преподавателем'
          : target.role === 'parent'
            ? 'Личный чат с родителем'
            : 'Личный чат студентов',
    created_by: currentUserId,
  });

  let activeMemberIds = new Set<number>();

  try {
    activeMemberIds = new Set(
      (
        await getChatMembers(chat.id)
      ).items
        .filter((member) => member.is_active)
        .map((member) => member.user_id)
    );
  } catch (membersError) {
    console.warn(
      'Не удалось проверить участников нового личного чата:',
      membersError
    );
  }

  if (!activeMemberIds.has(currentUserId)) {
    try {
      await addChatMember({
        chat_id: chat.id,
        user_id: currentUserId,
        member_role: 'owner',
        added_by: currentUserId,
      });
    } catch (creatorError) {
      // Some Communication Service versions automatically consider
      // `created_by` the owner and reject a duplicate member row.
      console.warn(
        'Создатель личного чата хранится только в created_by:',
        creatorError
      );
    }
  }

  if (!activeMemberIds.has(target.userId)) {
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
  }

  return chat;
}

/**
 * Автоматически подготавливает родителю личные чаты:
 * - с преподавателями всех активных групп его детей;
 * - с одним действующим администратором школы.
 *
 * Функция безопасна для повторных вызовов: существующий чат
 * переиспользуется, а архивный чат не создаётся повторно.
 */
export async function normalizePrivateChatList(
  currentUserId: number,
  chats: Chat[]
): Promise<Chat[]> {
  if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
    return chats;
  }

  return deduplicatePrivateChatsByPartner(chats, currentUserId);
}

export async function normalizeParentChatList(
  parentId: number,
  chats: Chat[]
): Promise<Chat[]> {
  return normalizePrivateChatList(
    parentId,
    chats
  );
}
