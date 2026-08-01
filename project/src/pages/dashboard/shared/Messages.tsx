import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  Loader2,
  MessageCircle,
  Pencil,
  Pin,
  RefreshCw,
  Reply,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import {
  useSearchParams,
} from 'react-router-dom';

import {
  archiveChat,
  deleteChatMessage,
  ensureStudentAdminChat,
  getChatMembers,
  getChatMessages,
  getChats,
  markChatAsRead,
  pinChatMessage,
  sendChatMessage,
  unpinChatMessage,
  updateChatMessage,
} from '../../../api/chatApi';

import GroupChatMembers from '../../../components/messages/GroupChatMembers';
import SchoolStaffDirectory from '../../../components/messages/SchoolStaffDirectory';
import UserAvatar from '../../../components/common/UserAvatar';

import {
  ChatSocket,
  type ChatSocketStatus,
} from '../../../api/chatSocket';

import {
  clearUserProfileCache,
  getUserById,
  getUsersByIds,
  type UserProfile,
} from '../../../api/userApi';

import type {
  Chat,
  ChatMessage,
} from '../../../types';

import { useAuth } from '../../../context/AuthContext';

import {
  ensureParentSchoolChats,
  loadMessageGroupDirectories,
  normalizeParentChatList,
  normalizePrivateChatList,
  openOrCreatePrivateChat,
  type MessageDirectoryPerson,
  type MessageGroupDirectory,
} from '../../../services/messageDirectoryService';

// =====================================================
// Вспомогательные функции
// =====================================================

function getChatTitle(
  chat: Chat,
  groupNamesById: Record<number, string> = {}
): string {
  if (
    chat.chat_type === 'group' &&
    chat.group_id &&
    groupNamesById[chat.group_id]
  ) {
    return groupNamesById[chat.group_id];
  }

  if (chat.title?.trim()) {
    return chat.title;
  }

  switch (chat.chat_type) {
    case 'private':
      return `Личный чат #${chat.id}`;

    case 'group':
      return chat.group_id
        ? `Чат группы #${chat.group_id}`
        : `Групповой чат #${chat.id}`;

    case 'lesson':
      return chat.lesson_id
        ? `Занятие #${chat.lesson_id}`
        : `Чат занятия #${chat.id}`;

    default:
      return `Чат #${chat.id}`;
  }
}

function getChatSubtitle(chat: Chat): string {
  switch (chat.chat_type) {
    case 'private':
      return 'Личный чат';

    case 'group':
      return 'Группа';

    case 'lesson':
      return 'Занятие';

    default:
      return 'Чат';
  }
}

function getChatSubtitleClass(chat: Chat): string {
  switch (chat.chat_type) {
    case 'private':
      return 'bg-blue-50 text-blue-700';

    case 'group':
      return 'bg-violet-50 text-violet-700';

    case 'lesson':
      return 'bg-amber-50 text-amber-700';

    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getEmbeddedUnreadCount(
  chat: Chat
): number {
  const chatWithUnreadCount = chat as Chat & {
    unread_count?: number | null;
    unreadCount?: number | null;
  };

  const value =
    chatWithUnreadCount.unread_count ??
    chatWithUnreadCount.unreadCount ??
    0;

  return Number.isFinite(value)
    ? Math.max(0, Number(value))
    : 0;
}

function getEmbeddedLastMessage(
  chat: Chat
): ChatMessage | null {
  const chatWithLastMessage = chat as Chat & {
    last_message?: ChatMessage | null;
    lastMessage?: ChatMessage | null;
  };

  return (
    chatWithLastMessage.last_message ??
    chatWithLastMessage.lastMessage ??
    null
  );
}

function areChatListsEqual(
  firstChats: Chat[],
  secondChats: Chat[]
): boolean {
  if (firstChats.length !== secondChats.length) {
    return false;
  }

  return firstChats.every((firstChat, index) => {
    const secondChat = secondChats[index];

    if (!secondChat) {
      return false;
    }

    const firstLastMessage =
      getEmbeddedLastMessage(firstChat);

    const secondLastMessage =
      getEmbeddedLastMessage(secondChat);

    return (
      firstChat.id === secondChat.id &&
      firstChat.chat_type ===
        secondChat.chat_type &&
      firstChat.title === secondChat.title &&
      firstChat.description ===
        secondChat.description &&
      firstChat.group_id ===
        secondChat.group_id &&
      firstChat.lesson_id ===
        secondChat.lesson_id &&
      firstChat.updated_at ===
        secondChat.updated_at &&
      getEmbeddedUnreadCount(firstChat) ===
        getEmbeddedUnreadCount(secondChat) &&
      firstLastMessage?.id ===
        secondLastMessage?.id &&
      firstLastMessage?.text ===
        secondLastMessage?.text &&
      firstLastMessage?.is_deleted ===
        secondLastMessage?.is_deleted
    );
  });
}

function areMessageMapsEqual(
  firstMessages: Record<number, ChatMessage>,
  secondMessages: Record<number, ChatMessage>
): boolean {
  const firstIds = Object.keys(firstMessages);
  const secondIds = Object.keys(secondMessages);

  if (firstIds.length !== secondIds.length) {
    return false;
  }

  return firstIds.every((chatId) => {
    const firstMessage =
      firstMessages[Number(chatId)];

    const secondMessage =
      secondMessages[Number(chatId)];

    return (
      firstMessage?.id === secondMessage?.id &&
      firstMessage?.text === secondMessage?.text &&
      firstMessage?.is_deleted ===
        secondMessage?.is_deleted &&
      firstMessage?.created_at ===
        secondMessage?.created_at
    );
  });
}

function areCountMapsEqual(
  firstCounts: Record<number, number>,
  secondCounts: Record<number, number>
): boolean {
  const firstIds = Object.keys(firstCounts);
  const secondIds = Object.keys(secondCounts);

  return (
    firstIds.length === secondIds.length &&
    firstIds.every(
      (chatId) =>
        firstCounts[Number(chatId)] ===
        secondCounts[Number(chatId)]
    )
  );
}

function getUserDisplayName(
  user: UserProfile | undefined,
  fallbackUserId?: number | string
): string {
  const fallback =
    typeof fallbackUserId === 'string'
      ? fallbackUserId
      : fallbackUserId
        ? `Пользователь №${fallbackUserId}`
        : 'Пользователь';

  if (!user) {
    return fallback;
  }

  const role = user.role?.toLowerCase();

  /*
   * Преподаватель, родитель и администратор:
   * user_name — имя;
   * last_name — отчество.
   * Например: Антон Викторович.
   */
  if (
    role === 'teacher' ||
    role === 'parent' ||
    role === 'admin'
  ) {
    const name = [
      user.user_name,
      user.last_name,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim();

    return name || fallback;
  }

  /*
   * Студент:
   * first_name — фамилия;
   * user_name — имя.
   * Например: Соседов Лев.
   */
  if (role === 'student') {
    const name = [
      user.first_name,
      user.user_name,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim();

    return name || fallback;
  }

  const name = [
    user.user_name,
    user.last_name,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || fallback;
}

function getDisplayChatTitle(
  chat: Chat,
  groupNamesById: Record<number, string>,
  privateChatPartner?: UserProfile
): string {
  if (
    chat.chat_type === 'private' &&
    privateChatPartner
  ) {
    return getUserDisplayName(
      privateChatPartner
    );
  }

  return getChatTitle(chat, groupNamesById);
}

function getMessagePreview(
  message: ChatMessage,
  currentUserId: number | null,
  usersById: Record<number, UserProfile>
): string {
  if (message.is_deleted) {
    return 'Сообщение удалено';
  }

  const content =
    message.text?.trim() || 'Вложение';

  if (message.sender_id === currentUserId) {
    return `Вы: ${content}`;
  }

  return `${getUserDisplayName(
    usersById[message.sender_id],
    message.sender_id
  )}: ${content}`;
}

function formatMessageTime(
  dateString: string
): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatChatDate(
  dateString: string
): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const today = new Date();

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return formatMessageTime(dateString);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function sortMessages(
  messages: ChatMessage[]
): ChatMessage[] {
  return [...messages].sort(
    (firstMessage, secondMessage) =>
      new Date(firstMessage.created_at).getTime() -
      new Date(secondMessage.created_at).getTime()
  );
}

function upsertMessage(
  messages: ChatMessage[],
  incomingMessage: ChatMessage
): ChatMessage[] {
  const index = messages.findIndex(
    (message) => message.id === incomingMessage.id
  );

  if (index === -1) {
    return sortMessages([
      ...messages,
      incomingMessage,
    ]);
  }

  const nextMessages = [...messages];

  nextMessages[index] = {
    ...nextMessages[index],
    ...incomingMessage,
  };

  return sortMessages(nextMessages);
}

function replaceOptimisticMessage(
  messages: ChatMessage[],
  optimisticMessageId: number,
  savedMessage: ChatMessage
): ChatMessage[] {
  return upsertMessage(
    messages.filter(
      (message) => message.id !== optimisticMessageId
    ),
    savedMessage
  );
}

function reconcileIncomingMessage(
  messages: ChatMessage[],
  incomingMessage: ChatMessage
): ChatMessage[] {
  const optimisticMessage = [...messages]
    .reverse()
    .find(
      (message) =>
        message.id < 0 &&
        message.chat_id === incomingMessage.chat_id &&
        message.sender_id === incomingMessage.sender_id &&
        message.text === incomingMessage.text &&
        message.reply_to_message_id ===
          incomingMessage.reply_to_message_id
    );

  if (!optimisticMessage) {
    return upsertMessage(
      messages,
      incomingMessage
    );
  }

  return replaceOptimisticMessage(
    messages,
    optimisticMessage.id,
    incomingMessage
  );
}

function getSocketStatusLabel(
  status: ChatSocketStatus
): string {
  switch (status) {
    case 'connected':
      return 'В сети';
    case 'connecting':
      return 'Подключение...';
    case 'reconnecting':
      return 'Переподключение...';
    case 'error':
      return 'Ошибка соединения';
    default:
      return 'Не в сети';
  }
}

// =====================================================
// Страница сообщений
// =====================================================

type MessageContextMenuState = {
  message: ChatMessage;
  x: number;
  y: number;
};

type MobileMessagesView = 'chats' | 'dialog';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const currentUserId = user?.id ?? null;

  const requestedGroupId = useMemo(() => {
    const groupId = Number(
      searchParams.get('groupId')
    );

    return Number.isInteger(groupId) &&
      groupId > 0
      ? groupId
      : null;
  }, [searchParams]);

  const requestedChatId = useMemo(() => {
    const chatId = Number(
      searchParams.get('chatId')
    );

    return Number.isInteger(chatId) &&
      chatId > 0
      ? chatId
      : null;
  }, [searchParams]);

  const requestedContactUserId =
    useMemo(() => {
      const contactUserId = Number(
        searchParams.get('contactUserId')
      );

      return Number.isInteger(
        contactUserId
      ) && contactUserId > 0
        ? contactUserId
        : null;
    }, [searchParams]);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] =
    useState<number | null>(null);
  const [mobileView, setMobileView] =
    useState<MobileMessagesView>('chats');

  useEffect(() => {
    if (
      activeChatId !== null &&
      (requestedChatId !== null ||
        requestedGroupId !== null ||
        requestedContactUserId !== null)
    ) {
      setMobileView('dialog');
    }
  }, [
    activeChatId,
    requestedChatId,
    requestedGroupId,
    requestedContactUserId,
  ]);

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([]);

  const [
    lastMessageByChatId,
    setLastMessageByChatId,
  ] = useState<Record<number, ChatMessage>>({});

  const [
    unreadCountByChatId,
    setUnreadCountByChatId,
  ] = useState<Record<number, number>>({});

  const [searchValue, setSearchValue] =
    useState('');

  const [messageText, setMessageText] =
    useState('');

  const [isChatsLoading, setIsChatsLoading] =
    useState(true);

  const [
    isMessagesLoading,
    setIsMessagesLoading,
  ] = useState(false);

  const [isSending, setIsSending] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [socketStatus, setSocketStatus] =
    useState<ChatSocketStatus>('disconnected');

  const [onlineUserIds, setOnlineUserIds] =
    useState<Set<number>>(new Set());

  const [typingUserIds, setTypingUserIds] =
    useState<Set<number>>(new Set());

  const [usersById, setUsersById] =
    useState<Record<number, UserProfile>>({});

  const [
    privateChatPartnersByChatId,
    setPrivateChatPartnersByChatId,
  ] = useState<Record<number, UserProfile>>({});

  const [
    groupDirectoriesById,
    setGroupDirectoriesById,
  ] = useState<
    Record<number, MessageGroupDirectory>
  >({});

  const [
    loadingGroupIds,
    setLoadingGroupIds,
  ] = useState<Set<number>>(new Set());

  const [
    expandedGroupId,
    setExpandedGroupId,
  ] = useState<number | null>(null);

  const [
    openingPersonId,
    setOpeningPersonId,
  ] = useState<number | null>(null);

  const [
    groupDirectoryReloadToken,
    setGroupDirectoryReloadToken,
  ] = useState(0);

  const [
    hasUnreadIncomingMessages,
    setHasUnreadIncomingMessages,
  ] = useState(false);

  const [
    lastReadMessageIdByOthers,
    setLastReadMessageIdByOthers,
  ] = useState<number | null>(null);

  const [replyToMessage, setReplyToMessage] =
    useState<ChatMessage | null>(null);

  const [
    messageContextMenu,
    setMessageContextMenu,
  ] = useState<MessageContextMenuState | null>(
    null
  );

  const [contextActionNotice, setContextActionNotice] =
    useState<string | null>(null);

  const [editingMessage, setEditingMessage] =
    useState<ChatMessage | null>(null);

  const [isMessageActionLoading, setIsMessageActionLoading] =
    useState(false);

  const [isChatArchiving, setIsChatArchiving] =
    useState(false);

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const isNearBottomRef =
    useRef(true);

  const socketRef =
    useRef<ChatSocket | null>(null);

  const typingStopTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasTypingStartedRef =
    useRef(false);

  const longPressTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const messageElementRefs =
    useRef<Map<number, HTMLDivElement>>(new Map());

  const attemptedGroupDirectoryIdsRef =
    useRef<Set<number>>(new Set());

  const activeChat = useMemo(
    () =>
      chats.find(
        (chat) => chat.id === activeChatId
      ) ?? null,
    [chats, activeChatId]
  );

  const groupChatIdsKey = useMemo(
    () =>
      chats
        .filter(
          (chat) =>
            chat.chat_type === 'group' &&
            chat.group_id
        )
        .map(
          (chat) =>
            `${chat.group_id}:${chat.created_by}`
        )
        .sort()
        .join(','),
    [chats]
  );

  const groupNamesById = useMemo(() => {
    const names: Record<number, string> = {};

    Object.values(groupDirectoriesById).forEach(
      (directory) => {
        names[directory.groupId] =
          directory.groupName;
      }
    );

    return names;
  }, [groupDirectoriesById]);

  const pinnedMessage = useMemo(
    () =>
      chatMessages.find(
        (message) =>
          message.is_pinned &&
          !message.is_deleted
      ) ?? null,
    [chatMessages]
  );

  const filteredChats = useMemo(() => {
    const query = searchValue
      .trim()
      .toLowerCase();

    if (!query) {
      return chats;
    }

    return chats.filter((chat) => {
      const title = getDisplayChatTitle(
        chat,
        groupNamesById,
        privateChatPartnersByChatId[
          chat.id
        ]
      )
        .toLowerCase();

      const description =
        chat.description?.toLowerCase() ?? '';

      const lastMessage =
        lastMessageByChatId[chat.id] ??
        getEmbeddedLastMessage(chat);

      const lastMessageText = lastMessage
        ? getMessagePreview(
            lastMessage,
            currentUserId,
            usersById
          ).toLowerCase()
        : '';

      return (
        title.includes(query) ||
        description.includes(query) ||
        lastMessageText.includes(query)
      );
    });
  }, [
    chats,
    searchValue,
    lastMessageByChatId,
    currentUserId,
    usersById,
    groupNamesById,
    privateChatPartnersByChatId,
  ]);

  const rememberLastMessage = useCallback(
    (message: ChatMessage) => {
      setLastMessageByChatId((currentMessages) => {
        const currentMessage =
          currentMessages[message.chat_id];

        if (
          currentMessage &&
          new Date(currentMessage.created_at).getTime() >
            new Date(message.created_at).getTime()
        ) {
          return currentMessages;
        }

        return {
          ...currentMessages,
          [message.chat_id]: message,
        };
      });
    },
    []
  );

  const clearUnreadCount = useCallback(
    (chatId: number) => {
      setUnreadCountByChatId((currentCounts) => {
        if (!currentCounts[chatId]) {
          return currentCounts;
        }

        return {
          ...currentCounts,
          [chatId]: 0,
        };
      });
    },
    []
  );

  const incrementUnreadCount = useCallback(
    (chatId: number) => {
      setUnreadCountByChatId((currentCounts) => ({
        ...currentCounts,
        [chatId]:
          (currentCounts[chatId] ?? 0) + 1,
      }));
    },
    []
  );

  const scrollToLastMessage = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: 'end',
      });

      isNearBottomRef.current = true;
      setHasUnreadIncomingMessages(false);
    },
    []
  );

  const handleMessagesScroll =
    useCallback(() => {
      const container =
        messagesContainerRef.current;

      if (!container) {
        return;
      }

      const distanceToBottom =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight;

      const isNearBottom =
        distanceToBottom <= 120;

      isNearBottomRef.current = isNearBottom;

      if (isNearBottom) {
        setHasUnreadIncomingMessages(false);

        if (activeChatId !== null) {
          clearUnreadCount(activeChatId);
        }

        if (
          activeChatId !== null &&
          currentUserId !== null &&
          document.visibilityState === 'visible'
        ) {
          void markChatAsRead(activeChatId, {
            user_id: currentUserId,
          }).catch((readError) => {
            console.error(
              'Не удалось отметить чат прочитанным:',
              readError
            );
          });
        }
      }
    }, [
      activeChatId,
      currentUserId,
      clearUnreadCount,
    ]);

  const loadChats = useCallback(async () => {
    setIsChatsLoading(true);
    setError(null);

    if (currentUserId === null) {
      setChats([]);
      setIsChatsLoading(false);
      return;
    }

    try {
      if (
        user?.role?.toLowerCase() ===
        'student'
      ) {
        try {
          await ensureStudentAdminChat(
            currentUserId
          );
        } catch (adminChatError) {
          console.warn(
            'Не удалось гарантировать чат с администрацией:',
            adminChatError
          );
        }
      }

      const response = await getChats(
        currentUserId
      );

      let allChats = response.items;

      const normalizedRole =
        user?.role?.toLowerCase();

      if (normalizedRole === 'parent') {
        allChats =
          await ensureParentSchoolChats(
            currentUserId,
            allChats
          );
      }

      /*
       * Один родитель может быть связан с ребёнком сразу
       * в нескольких группах одного преподавателя. В базе
       * при этом могли появиться несколько личных чатов с
       * тем же родителем. Для преподавателя оставляем один
       * наиболее актуальный чат на каждого собеседника.
       */
      if (normalizedRole === 'teacher') {
        allChats =
          await normalizePrivateChatList(
            currentUserId,
            allChats
          );
      }

      let availableChats = allChats
        .filter(
          (chat) =>
            chat.is_active &&
            !chat.is_archived
        )
        .sort((firstChat, secondChat) => {
          return (
            new Date(
              secondChat.updated_at
            ).getTime() -
            new Date(
              firstChat.updated_at
            ).getTime()
          );
        });

      let requestedContactChat: Chat | null =
        null;

      if (
        requestedContactUserId !== null &&
        requestedContactUserId !==
          currentUserId
      ) {
        clearUserProfileCache(currentUserId);
        clearUserProfileCache(
          requestedContactUserId
        );

        const [
          currentUserProfile,
          contactProfile,
        ] = await Promise.all([
          getUserById(currentUserId),
          getUserById(
            requestedContactUserId
          ),
        ]);

        if (
          !currentUserProfile
            .is_account_verified
        ) {
          throw new Error(
            'Аккаунт текущего пользователя не подтверждён. Подтвердите аккаунт и выполните повторный вход.'
          );
        }

        if (
          !contactProfile
            .is_account_verified
        ) {
          throw new Error(
            'Аккаунт выбранного пользователя не подтверждён в User Service.'
          );
        }

        const normalizedContactRole =
          contactProfile.role?.toLowerCase();

        const contactRole =
          normalizedContactRole === 'admin'
            ? 'admin'
            : normalizedContactRole ===
                'teacher'
              ? 'teacher'
              : normalizedContactRole ===
                  'parent'
                ? 'parent'
                : 'student';

        const contactName = [
          contactProfile.first_name,
          contactProfile.user_name,
          contactProfile.last_name,
        ]
          .map((value) => value?.trim())
          .filter(Boolean)
          .join(' ')
          .trim() ||
          (contactRole === 'parent'
            ? 'Родитель'
            : contactRole === 'teacher'
              ? 'Преподаватель'
              : contactRole === 'admin'
                ? 'Администратор'
                : 'Студент');

        requestedContactChat =
          await openOrCreatePrivateChat(
            availableChats,
            currentUserId,
            {
              userId:
                requestedContactUserId,
              displayName: contactName,
              avatarUrl:
                contactProfile.avatar_url,
              role: contactRole,
            }
          );

        if (
          !availableChats.some(
            (chat) =>
              chat.id ===
              requestedContactChat?.id
          )
        ) {
          availableChats = [
            requestedContactChat,
            ...availableChats,
          ];
        }

        // Resolve a contact deep-link only once. Keeping contactUserId
        // in the URL made every subsequent refresh attempt to open or
        // create the same personal chat again.
        setSearchParams(
          {
            chatId: String(
              requestedContactChat.id
            ),
          },
          {
            replace: true,
          }
        );
      }

      setChats(availableChats);

      setLastMessageByChatId((currentMessages) => {
        const nextMessages = {
          ...currentMessages,
        };

        for (const chat of availableChats) {
          const embeddedMessage =
            getEmbeddedLastMessage(chat);

          if (embeddedMessage) {
            nextMessages[chat.id] =
              embeddedMessage;
          }
        }

        return nextMessages;
      });

      setUnreadCountByChatId((currentCounts) => {
        const nextCounts = {
          ...currentCounts,
        };

        for (const chat of availableChats) {
          nextCounts[chat.id] =
            getEmbeddedUnreadCount(chat);
        }

        return nextCounts;
      });

      const requestedGroupChat =
        requestedGroupId === null
          ? null
          : availableChats.find(
              (chat) =>
                chat.chat_type === 'group' &&
                chat.group_id === requestedGroupId
            ) ?? null;

      const requestedChat =
        requestedChatId === null
          ? null
          : availableChats.find(
              (chat) =>
                chat.id === requestedChatId
            ) ?? null;

      if (
        requestedChatId !== null &&
        requestedChat === null
      ) {
        setError(
          `Чат №${requestedChatId} не найден или у вас нет к нему доступа.`
        );
      } else if (
        requestedGroupId !== null &&
        requestedGroupChat === null
      ) {
        setError(
          `Чат группы №${requestedGroupId} пока не создан или вы не добавлены в него.`
        );
      }

      setActiveChatId((currentId) => {
        if (requestedContactChat) {
          return requestedContactChat.id;
        }

        if (requestedChatId !== null) {
          return requestedChat?.id ?? null;
        }

        if (requestedGroupId !== null) {
          return requestedGroupChat?.id ?? null;
        }

        const currentChatStillExists =
          availableChats.some(
            (chat) => chat.id === currentId
          );

        if (currentChatStillExists) {
          return currentId;
        }

        return availableChats[0]?.id ?? null;
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось загрузить чаты'
      );
    } finally {
      setIsChatsLoading(false);
    }
  }, [
    currentUserId,
    requestedChatId,
    requestedGroupId,
    requestedContactUserId,
    setSearchParams,
    user?.role,
  ]);

  const refreshChatsSilently =
    useCallback(async () => {
      if (currentUserId === null) {
        return;
      }

      try {
        const response = await getChats(
          currentUserId
        );

        let refreshedChats = response.items;

        const normalizedRole =
          user?.role?.toLowerCase();

        /*
         * При тихом обновлении родительские чаты также
         * очищаются от дублей. Для преподавателя polling
         * ниже отключён, но нормализация сохранена на случай
         * ручного вызова этой функции в будущем.
         */
        if (normalizedRole === 'parent') {
          refreshedChats =
            await normalizeParentChatList(
              currentUserId,
              refreshedChats
            );
        } else if (normalizedRole === 'teacher') {
          refreshedChats =
            await normalizePrivateChatList(
              currentUserId,
              refreshedChats
            );
        }

        const availableChats = refreshedChats
          .filter(
            (chat) =>
              chat.is_active &&
              !chat.is_archived
          )
          .sort((firstChat, secondChat) => {
            return (
              new Date(
                secondChat.updated_at
              ).getTime() -
              new Date(
                firstChat.updated_at
              ).getTime()
            );
          });

        setChats((currentChats) =>
          areChatListsEqual(
            currentChats,
            availableChats
          )
            ? currentChats
            : availableChats
        );

        setLastMessageByChatId(
          (currentMessages) => {
            const nextMessages = {
              ...currentMessages,
            };

            for (const chat of availableChats) {
              const embeddedMessage =
                getEmbeddedLastMessage(chat);

              if (embeddedMessage) {
                nextMessages[chat.id] =
                  embeddedMessage;
              }
            }

            return areMessageMapsEqual(
              currentMessages,
              nextMessages
            )
              ? currentMessages
              : nextMessages;
          }
        );

        setUnreadCountByChatId(
          (currentCounts) => {
            const nextCounts = {
              ...currentCounts,
            };

            for (const chat of availableChats) {
              nextCounts[chat.id] =
                getEmbeddedUnreadCount(chat);
            }

            return areCountMapsEqual(
              currentCounts,
              nextCounts
            )
              ? currentCounts
              : nextCounts;
          }
        );
      } catch (refreshError) {
        console.error(
          'Не удалось обновить список чатов:',
          refreshError
        );
      }
    }, [
      currentUserId,
      user?.role,
    ]);

  const loadMessages = useCallback(
    async (chatId: number) => {
      setIsMessagesLoading(true);
      setError(null);

      try {
        if (!currentUserId) {
          throw new Error(
            'Не удалось определить ID текущего пользователя'
          );
        }

        const response = await getChatMessages(
          chatId,
          currentUserId
        );

        const sortedMessages =
          sortMessages(response.items);

        setChatMessages(sortedMessages);

        const lastMessage =
          sortedMessages[
            sortedMessages.length - 1
          ];

        if (lastMessage) {
          rememberLastMessage(lastMessage);
        }

        if (currentUserId) {
          try {
            await markChatAsRead(chatId, {
              user_id: currentUserId,
            });

            clearUnreadCount(chatId);
          } catch (readError) {
            console.error(
              'Не удалось отметить чат прочитанным:',
              readError
            );
          }
        }
      } catch (requestError) {
        setChatMessages([]);

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не удалось загрузить сообщения'
        );
      } finally {
        setIsMessagesLoading(false);
      }
    },
    [
      currentUserId,
      rememberLastMessage,
      clearUnreadCount,
    ]
  );

  useEffect(() => {
    const userIds = [
      ...new Set([
        ...chatMessages.map(
          (message) => message.sender_id
        ),
        ...typingUserIds,
        ...onlineUserIds,
      ]),
    ].filter(
      (userId) =>
        userId > 0 &&
        !usersById[userId]
    );

    if (userIds.length === 0) {
      return;
    }

    let isCancelled = false;

    void getUsersByIds(userIds)
      .then((loadedUsers) => {
        if (
          isCancelled ||
          Object.keys(loadedUsers).length === 0
        ) {
          return;
        }

        setUsersById((currentUsers) => ({
          ...currentUsers,
          ...loadedUsers,
        }));
      })
      .catch((userError) => {
        console.error(
          'Не удалось загрузить данные пользователей:',
          userError
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [
    chatMessages,
    typingUserIds,
    onlineUserIds,
    usersById,
  ]);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    const groupEntries = groupChatIdsKey
      .split(',')
      .map((entry) => {
        const [
          groupIdValue,
          creatorIdValue,
        ] = entry.split(':');

        return {
          groupId: Number(groupIdValue),
          creatorId: Number(creatorIdValue),
        };
      })
      .filter(
        ({ groupId, creatorId }) =>
          Number.isInteger(groupId) &&
          groupId > 0 &&
          Number.isInteger(creatorId) &&
          creatorId > 0
      );

    const groupIds = groupEntries.map(
      ({ groupId }) => groupId
    );

    const fallbackTeacherIdsByGroupId =
      Object.fromEntries(
        groupEntries.map(
          ({ groupId, creatorId }) => [
            groupId,
            creatorId,
          ]
        )
      );

    if (groupIds.length === 0) {
      setGroupDirectoriesById({});
      setLoadingGroupIds(new Set());
      attemptedGroupDirectoryIdsRef.current =
        new Set();
      return;
    }

    let isCancelled = false;
    let retryTimerId: number | null = null;

    const firstLoadGroupIds = groupIds.filter(
      (groupId) =>
        !attemptedGroupDirectoryIdsRef.current.has(
          groupId
        )
    );

    firstLoadGroupIds.forEach((groupId) => {
      attemptedGroupDirectoryIdsRef.current.add(
        groupId
      );
    });

    if (firstLoadGroupIds.length > 0) {
      setLoadingGroupIds(
        new Set(firstLoadGroupIds)
      );
    }

    void loadMessageGroupDirectories(
      groupIds,
      fallbackTeacherIdsByGroupId
    )
      .then((directories) => {
        if (isCancelled) {
          return;
        }

        setGroupDirectoriesById(
          (currentDirectories) => {
            const currentSerialized =
              JSON.stringify(
                currentDirectories
              );

            const nextSerialized =
              JSON.stringify(directories);

            return currentSerialized ===
              nextSerialized
              ? currentDirectories
              : directories;
          }
        );

        const hasIncompleteProfiles =
          Object.keys(directories).length !==
            groupIds.length ||
          Object.values(directories).some(
            (directory) =>
              !directory.teacher ||
              directory.teacher.displayName.startsWith(
                'Преподаватель №'
              ) ||
              directory.students.some((student) =>
                student.displayName.startsWith(
                  'Студент №'
                )
              )
          );

        if (hasIncompleteProfiles) {
          retryTimerId = window.setTimeout(
            () =>
              setGroupDirectoryReloadToken(
                (currentToken) =>
                  currentToken + 1
              ),
            15_000
          );
        }
      })
      .catch((directoryError) => {
        console.error(
          'Не удалось загрузить названия и участников групп:',
          directoryError
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingGroupIds(
            (currentLoadingGroupIds) =>
              currentLoadingGroupIds.size === 0
                ? currentLoadingGroupIds
                : new Set()
          );
        }
      });

    return () => {
      isCancelled = true;

      if (retryTimerId !== null) {
        window.clearTimeout(retryTimerId);
      }
    };
  }, [
    groupChatIdsKey,
    groupDirectoryReloadToken,
  ]);

  useEffect(() => {
    if (currentUserId === null) {
      setPrivateChatPartnersByChatId({});
      return;
    }

    const privateChats = chats.filter(
      (chat) =>
        chat.chat_type === 'private' &&
        chat.is_active &&
        !chat.is_archived
    );

    if (privateChats.length === 0) {
      setPrivateChatPartnersByChatId({});
      return;
    }

    let isCancelled = false;

    void Promise.allSettled(
      privateChats.map(async (chat) => {
        const members = (
          await getChatMembers(chat.id)
        ).items.filter(
          (member) =>
            member.is_active &&
            member.user_id !== currentUserId
        );

        return {
          chatId: chat.id,
          partnerUserId:
            members[0]?.user_id ?? null,
        };
      })
    ).then(async (memberResults) => {
      const chatPartnerIds: Array<{
        chatId: number;
        partnerUserId: number;
      }> = [];

      memberResults.forEach((result) => {
        if (
          result.status === 'fulfilled' &&
          result.value.partnerUserId !== null
        ) {
          chatPartnerIds.push({
            chatId: result.value.chatId,
            partnerUserId:
              result.value.partnerUserId,
          });
        }
      });

      const profiles = await getUsersByIds(
        chatPartnerIds.map(
          (entry) => entry.partnerUserId
        )
      );

      if (isCancelled) {
        return;
      }

      const nextPartners: Record<
        number,
        UserProfile
      > = {};

      chatPartnerIds.forEach(
        ({ chatId, partnerUserId }) => {
          const profile =
            profiles[partnerUserId];

          if (profile) {
            nextPartners[chatId] = profile;
          }
        }
      );

      setPrivateChatPartnersByChatId(
        (currentPartners) =>
          JSON.stringify(currentPartners) ===
          JSON.stringify(nextPartners)
            ? currentPartners
            : nextPartners
      );
    });

    return () => {
      isCancelled = true;
    };
  }, [chats, currentUserId]);

  useEffect(() => {
    /*
     * Для преподавателя не запускаем пятисекундный polling.
     * Новые сообщения продолжают приходить через WebSocket,
     * а список чатов загружается при открытии страницы.
     */
    if (
      user?.role?.toLowerCase() ===
      'teacher'
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshChatsSilently();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshChatsSilently, user?.role]);

  useEffect(() => {
    setChatMessages([]);
    setOnlineUserIds(new Set());
    setTypingUserIds(new Set());
    setHasUnreadIncomingMessages(false);
    setLastReadMessageIdByOthers(null);
    setReplyToMessage(null);
    setMessageContextMenu(null);
    setContextActionNotice(null);
    setEditingMessage(null);
    setIsMessageActionLoading(false);
    isNearBottomRef.current = true;

    if (activeChatId === null) {
      return;
    }

    clearUnreadCount(activeChatId);
    void loadMessages(activeChatId);
  }, [
    activeChatId,
    loadMessages,
    clearUnreadCount,
  ]);

  useEffect(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;

    if (
      activeChatId === null ||
      currentUserId === null
    ) {
      setSocketStatus('disconnected');
      return;
    }

    const socket = new ChatSocket({
      chatId: activeChatId,
      userId: currentUserId,

      onStatusChange: setSocketStatus,

      onConnected: (data) => {
        setOnlineUserIds(
          new Set(data.online_user_ids)
        );
      },

      onMessageCreated: (message) => {
        const shouldScrollToMessage =
          isNearBottomRef.current ||
          message.sender_id === currentUserId;

        setChatMessages((currentMessages) =>
          reconcileIncomingMessage(
            currentMessages,
            message as ChatMessage
          )
        );

        rememberLastMessage(
          message as ChatMessage
        );

        if (shouldScrollToMessage) {
          requestAnimationFrame(() => {
            scrollToLastMessage('smooth');
          });

          if (
            message.sender_id !== currentUserId &&
            document.visibilityState === 'visible'
          ) {
            void markChatAsRead(activeChatId, {
              user_id: currentUserId,
            })
              .then(() => {
                clearUnreadCount(activeChatId);
              })
              .catch((readError) => {
                console.error(
                  'Не удалось отметить новое сообщение прочитанным:',
                  readError
                );
              });
          }
        } else {
          setHasUnreadIncomingMessages(true);

          if (
            message.sender_id !== currentUserId
          ) {
            incrementUnreadCount(
              message.chat_id
            );
          }
        }

        setChats((currentChats) =>
          currentChats
            .map((chat) =>
              chat.id === message.chat_id
                ? {
                    ...chat,
                    updated_at:
                      message.created_at,
                  }
                : chat
            )
            .sort((firstChat, secondChat) =>
              new Date(
                secondChat.updated_at
              ).getTime() -
              new Date(
                firstChat.updated_at
              ).getTime()
            )
        );
      },

      onMessageUpdated: (message) => {
        setChatMessages((currentMessages) =>
          upsertMessage(
            currentMessages,
            message as ChatMessage
          )
        );

        setLastMessageByChatId(
          (currentMessages) => {
            const currentMessage =
              currentMessages[message.chat_id];

            if (
              currentMessage?.id !== message.id
            ) {
              return currentMessages;
            }

            return {
              ...currentMessages,
              [message.chat_id]:
                message as ChatMessage,
            };
          }
        );
      },

      onMessageDeleted: (message) => {
        setChatMessages((currentMessages) =>
          upsertMessage(
            currentMessages,
            message as ChatMessage
          )
        );

        setLastMessageByChatId(
          (currentMessages) => {
            const currentMessage =
              currentMessages[message.chat_id];

            if (
              currentMessage?.id !== message.id
            ) {
              return currentMessages;
            }

            return {
              ...currentMessages,
              [message.chat_id]:
                message as ChatMessage,
            };
          }
        );
      },

      onMessagePinned: (message) => {
        setChatMessages((currentMessages) =>
          upsertMessage(
            currentMessages,
            message as ChatMessage
          )
        );
      },

      onMessageUnpinned: (message) => {
        setChatMessages((currentMessages) =>
          upsertMessage(
            currentMessages,
            message as ChatMessage
          )
        );
      },

      onMessageRead: ({
        message_id,
        user_id,
      }) => {
        if (user_id === currentUserId) {
          return;
        }

        setLastReadMessageIdByOthers(
          (currentMessageId) =>
            currentMessageId === null
              ? message_id
              : Math.max(
                  currentMessageId,
                  message_id
                )
        );
      },

      onChatRead: ({
        last_read_message_id,
        user_id,
      }) => {
        if (user_id === currentUserId) {
          return;
        }

        setLastReadMessageIdByOthers(
          (currentMessageId) =>
            currentMessageId === null
              ? last_read_message_id
              : Math.max(
                  currentMessageId,
                  last_read_message_id
                )
        );
      },

      onUserOnline: ({ user_id }) => {
        setOnlineUserIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.add(user_id);
          return nextIds;
        });
      },

      onUserOffline: ({ user_id }) => {
        setOnlineUserIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.delete(user_id);
          return nextIds;
        });

        setTypingUserIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.delete(user_id);
          return nextIds;
        });
      },

      onTypingStarted: ({ user_id }) => {
        if (user_id === currentUserId) {
          return;
        }

        setTypingUserIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.add(user_id);
          return nextIds;
        });
      },

      onTypingStopped: ({ user_id }) => {
        setTypingUserIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.delete(user_id);
          return nextIds;
        });
      },

      onError: (socketError) => {
        console.error(
          '[Messages WebSocket]',
          socketError
        );
      },
    });

    socketRef.current = socket;
    socket.connect();

    return () => {
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    activeChatId,
    currentUserId,
    scrollToLastMessage,
    rememberLastMessage,
    clearUnreadCount,
    incrementUnreadCount,
  ]);

  useEffect(() => {
    if (
      activeChatId === null ||
      isMessagesLoading
    ) {
      return;
    }

    requestAnimationFrame(() => {
      scrollToLastMessage('auto');
    });
  }, [
    activeChatId,
    isMessagesLoading,
    scrollToLastMessage,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState !== 'visible' ||
        activeChatId === null ||
        currentUserId === null ||
        !isNearBottomRef.current
      ) {
        return;
      }

      void markChatAsRead(activeChatId, {
        user_id: currentUserId,
      })
        .then(() => {
          clearUnreadCount(activeChatId);
          setHasUnreadIncomingMessages(false);
        })
        .catch((readError) => {
          console.error(
            'Не удалось отметить чат прочитанным после возвращения на вкладку:',
            readError
          );
        });
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, [
    activeChatId,
    currentUserId,
    clearUnreadCount,
  ]);

  useEffect(() => {
    if (!messageContextMenu) {
      return;
    }

    const closeMenu = () => {
      setMessageContextMenu(null);
    };

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('click', closeMenu);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener(
        'click',
        closeMenu
      );
      window.removeEventListener(
        'resize',
        closeMenu
      );
      window.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [messageContextMenu]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        clearTimeout(
          typingStopTimerRef.current
        );
      }

      if (longPressTimerRef.current) {
        clearTimeout(
          longPressTimerRef.current
        );
      }
    };
  }, []);

  const handleMessageTextChange = useCallback(
    (value: string) => {
      setMessageText(value);

      const socket = socketRef.current;

      if (!socket?.isConnected()) {
        return;
      }

      if (value.trim()) {
        if (!hasTypingStartedRef.current) {
          socket.sendTypingStarted();
          hasTypingStartedRef.current = true;
        }

        if (typingStopTimerRef.current) {
          clearTimeout(
            typingStopTimerRef.current
          );
        }

        typingStopTimerRef.current =
          setTimeout(() => {
            socket.sendTypingStopped();
            hasTypingStartedRef.current = false;
            typingStopTimerRef.current = null;
          }, 1500);

        return;
      }

      if (hasTypingStartedRef.current) {
        socket.sendTypingStopped();
        hasTypingStartedRef.current = false;
      }

      if (typingStopTimerRef.current) {
        clearTimeout(
          typingStopTimerRef.current
        );
        typingStopTimerRef.current = null;
      }
    },
    []
  );

  const openMessageContextMenu =
    useCallback(
      (
        event:
          | React.MouseEvent
          | {
              clientX: number;
              clientY: number;
            },
        message: ChatMessage
      ) => {
        const menuWidth = 220;
        const menuHeight = 210;
        const padding = 12;

        const x = Math.min(
          event.clientX,
          window.innerWidth -
            menuWidth -
            padding
        );

        const y = Math.min(
          event.clientY,
          window.innerHeight -
            menuHeight -
            padding
        );

        setMessageContextMenu({
          message,
          x: Math.max(padding, x),
          y: Math.max(padding, y),
        });
      },
      []
    );

  const showActionNotice = useCallback(
    (message: string) => {
      setContextActionNotice(message);

      window.setTimeout(() => {
        setContextActionNotice(null);
      }, 2500);
    },
    []
  );

  const startEditingMessage = useCallback(
    (message: ChatMessage) => {
      if (message.is_deleted) {
        return;
      }

      setEditingMessage(message);
      setMessageText(message.text ?? '');
      setReplyToMessage(null);
      setMessageContextMenu(null);
    },
    []
  );

  const handleTogglePinMessage = useCallback(
    async (message: ChatMessage) => {
      if (currentUserId === null) {
        return;
      }

      setIsMessageActionLoading(true);
      setMessageContextMenu(null);

      try {
        const updatedMessage = message.is_pinned
          ? await unpinChatMessage(message.id, {
              requested_by: currentUserId,
            })
          : await pinChatMessage(message.id, {
              requested_by: currentUserId,
            });

        setChatMessages((currentMessages) =>
          upsertMessage(
            currentMessages,
            updatedMessage
          )
        );

        showActionNotice(
          message.is_pinned
            ? 'Сообщение откреплено'
            : 'Сообщение закреплено'
        );
      } catch (actionError) {
        showActionNotice(
          actionError instanceof Error
            ? actionError.message
            : 'Не удалось изменить закрепление'
        );
      } finally {
        setIsMessageActionLoading(false);
      }
    },
    [currentUserId, showActionNotice]
  );

  const handleDeleteMessage = useCallback(
    async (message: ChatMessage) => {
      if (currentUserId === null) {
        return;
      }

      const isConfirmed = window.confirm(
        'Удалить это сообщение?'
      );

      if (!isConfirmed) {
        setMessageContextMenu(null);
        return;
      }

      setIsMessageActionLoading(true);
      setMessageContextMenu(null);

      try {
        const deletedMessage =
          await deleteChatMessage(message.id, {
            requested_by: currentUserId,
          });

        setChatMessages((currentMessages) =>
          upsertMessage(
            currentMessages,
            deletedMessage
          )
        );

        setLastMessageByChatId(
          (currentMessages) => {
            const currentMessage =
              currentMessages[
                deletedMessage.chat_id
              ];

            if (
              currentMessage?.id !==
              deletedMessage.id
            ) {
              return currentMessages;
            }

            return {
              ...currentMessages,
              [deletedMessage.chat_id]:
                deletedMessage,
            };
          }
        );

        showActionNotice('Сообщение удалено');
      } catch (actionError) {
        showActionNotice(
          actionError instanceof Error
            ? actionError.message
            : 'Не удалось удалить сообщение'
        );
      } finally {
        setIsMessageActionLoading(false);
      }
    },
    [currentUserId, showActionNotice]
  );

  const handleArchiveActiveChat =
    useCallback(async () => {
      if (
        currentUserId === null ||
        activeChat === null ||
        isChatArchiving
      ) {
        return;
      }

      const chatTitle = getDisplayChatTitle(
        activeChat,
        groupNamesById,
        privateChatPartnersByChatId[
          activeChat.id
        ]
      );

      const isConfirmed = window.confirm(
        `Удалить чат «${chatTitle}» из активного списка?\n\nЧат будет перемещён в архив вместе с сообщениями.`
      );

      if (!isConfirmed) {
        return;
      }

      setIsChatArchiving(true);
      setError(null);

      try {
        await archiveChat(activeChat.id, {
          user_id: currentUserId,
        });

        const remainingChats = chats.filter(
          (chat) => chat.id !== activeChat.id
        );

        const nextChatId =
          remainingChats[0]?.id ?? null;

        setChats(remainingChats);
        setActiveChatId(nextChatId);
        setChatMessages([]);
        setMobileView('chats');

        setLastMessageByChatId(
          (currentMessages) => {
            const nextMessages = {
              ...currentMessages,
            };

            delete nextMessages[activeChat.id];

            return nextMessages;
          }
        );

        setUnreadCountByChatId(
          (currentCounts) => {
            const nextCounts = {
              ...currentCounts,
            };

            delete nextCounts[activeChat.id];

            return nextCounts;
          }
        );

        setSearchParams({}, {
          replace: true,
        });

        showActionNotice(
          'Чат перемещён в архив'
        );
      } catch (archiveError) {
        showActionNotice(
          archiveError instanceof Error
            ? archiveError.message
            : 'Не удалось удалить чат'
        );
      } finally {
        setIsChatArchiving(false);
      }
    }, [
      activeChat,
      chats,
      currentUserId,
      groupNamesById,
      isChatArchiving,
      privateChatPartnersByChatId,
      setSearchParams,
      showActionNotice,
    ]);

  const startReply = useCallback(
    (message: ChatMessage) => {
      if (message.is_deleted) {
        return;
      }

      setReplyToMessage(message);
    },
    []
  );

  const handleMessagePointerDown =
    useCallback((message: ChatMessage) => {
      if (longPressTimerRef.current) {
        clearTimeout(
          longPressTimerRef.current
        );
      }

      longPressTimerRef.current =
        setTimeout(() => {
          const element =
            messageElementRefs.current.get(
              message.id
            );

          const rect =
            element?.getBoundingClientRect();

          openMessageContextMenu(
            {
              clientX:
                rect?.left ??
                window.innerWidth / 2,
              clientY:
                rect?.top ??
                window.innerHeight / 2,
            },
            message
          );

          longPressTimerRef.current = null;
        }, 550);
    }, [openMessageContextMenu]);

  const cancelMessageLongPress =
    useCallback(() => {
      if (!longPressTimerRef.current) {
        return;
      }

      clearTimeout(
        longPressTimerRef.current
      );

      longPressTimerRef.current = null;
    }, []);

  const scrollToMessage = useCallback(
    (messageId: number) => {
      const element =
        messageElementRefs.current.get(messageId);

      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      if (element) {
        element.classList.add(
          'ring-2',
          'ring-red-300'
        );

        setTimeout(() => {
          element.classList.remove(
            'ring-2',
            'ring-red-300'
          );
        }, 1200);
      }
    },
    []
  );

  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const text = messageText.trim();

    if (
      !text ||
      activeChatId === null ||
      isSending
    ) {
      return;
    }

    if (!currentUserId) {
      setError(
        'Не удалось определить ID текущего пользователя. Проверьте данные JWT.'
      );
      return;
    }

    const replyMessageBeforeSending =
      replyToMessage;

    const optimisticMessageId =
      -Date.now();

    const optimisticMessage: ChatMessage | null =
      editingMessage
        ? null
        : {
            id: optimisticMessageId,
            chat_id: activeChatId,
            sender_id: currentUserId,
            message_type: 'text',
            text,
            reply_to_message_id:
              replyMessageBeforeSending?.id ?? null,
            is_edited: false,
            is_deleted: false,
            is_pinned: false,
            created_at: new Date().toISOString(),
            edited_at: null,
            deleted_at: null,
          };

    setIsSending(true);
    setError(null);

    if (optimisticMessage) {
      setChatMessages((currentMessages) =>
        sortMessages([
          ...currentMessages,
          optimisticMessage,
        ])
      );

      setMessageText('');
      setReplyToMessage(null);

      requestAnimationFrame(() => {
        scrollToLastMessage('smooth');
      });
    }

    try {
      const savedMessage = editingMessage
        ? await updateChatMessage(
            editingMessage.id,
            {
              text,
              edited_by: currentUserId,
            }
          )
        : await sendChatMessage({
            chat_id: activeChatId,
            sender_id: currentUserId,
            message_type: 'text',
            text,
            reply_to_message_id:
              replyMessageBeforeSending?.id ?? null,
          });

      setChatMessages((currentMessages) =>
        optimisticMessage
          ? replaceOptimisticMessage(
              currentMessages,
              optimisticMessage.id,
              savedMessage
            )
          : upsertMessage(
              currentMessages,
              savedMessage
            )
      );

      if (editingMessage) {
        setLastMessageByChatId(
          (currentMessages) => {
            const currentMessage =
              currentMessages[
                savedMessage.chat_id
              ];

            if (
              currentMessage?.id !==
              savedMessage.id
            ) {
              return currentMessages;
            }

            return {
              ...currentMessages,
              [savedMessage.chat_id]:
                savedMessage,
            };
          }
        );
      } else {
        rememberLastMessage(savedMessage);
      }

      setMessageText('');
      setReplyToMessage(null);
      setEditingMessage(null);

      requestAnimationFrame(() => {
        scrollToLastMessage('smooth');
      });

      if (hasTypingStartedRef.current) {
        socketRef.current?.sendTypingStopped();
        hasTypingStartedRef.current = false;
      }

      if (typingStopTimerRef.current) {
        clearTimeout(
          typingStopTimerRef.current
        );
        typingStopTimerRef.current = null;
      }

      setChats((currentChats) =>
        currentChats
          .map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  updated_at:
                    savedMessage.created_at,
                }
              : chat
          )
          .sort((firstChat, secondChat) => {
            return (
              new Date(
                secondChat.updated_at
              ).getTime() -
              new Date(
                firstChat.updated_at
              ).getTime()
            );
          })
      );
    } catch (requestError) {
      if (optimisticMessage) {
        setChatMessages((currentMessages) =>
          currentMessages.filter(
            (message) =>
              message.id !==
              optimisticMessage.id
          )
        );

        setMessageText(text);
        setReplyToMessage(
          replyMessageBeforeSending
        );
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : editingMessage
            ? 'Не удалось изменить сообщение'
            : 'Не удалось отправить сообщение'
      );
    } finally {
      setIsSending(false);
    }
  }

  const handlePersonChatOpen = async (
    person: MessageDirectoryPerson
  ) => {
    if (
      currentUserId === null ||
      person.userId === currentUserId ||
      openingPersonId !== null
    ) {
      return;
    }

    setOpeningPersonId(person.userId);
    setError(null);

    try {
      const privateChat =
        await openOrCreatePrivateChat(
          chats,
          currentUserId,
          person
        );

      setChats((currentChats) => {
        const chatAlreadyExists =
          currentChats.some(
            (chat) =>
              chat.id === privateChat.id
          );

        return chatAlreadyExists
          ? currentChats
          : [privateChat, ...currentChats];
      });

      const nextSearchParams =
        new URLSearchParams(searchParams);

      nextSearchParams.delete('groupId');
      nextSearchParams.delete('chatId');
      setSearchParams(nextSearchParams, {
        replace: true,
      });

      setExpandedGroupId(null);
      setActiveChatId(privateChat.id);
      setMobileView('dialog');
    } catch (openError) {
      setError(
        openError instanceof Error
          ? openError.message
          : 'Не удалось открыть личный чат'
      );
    } finally {
      setOpeningPersonId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Сообщения
        </h1>

        <p className="mt-1 text-gray-500">
          Общение с преподавателями и школой
        </p>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              void loadChats();

              if (activeChatId !== null) {
                void loadMessages(activeChatId);
              }
            }}
            className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800"
          >
            <RefreshCw className="h-4 w-4" />
            Повторить
          </button>
        </div>
      )}

      <div className="card grid h-[calc(100dvh-220px)] min-h-[420px] max-h-[calc(100dvh-220px)] grid-cols-1 overflow-hidden lg:grid-cols-3">
        {/* Список чатов */}
        <aside
          className={`min-h-0 flex-col border-gray-100 lg:col-span-1 lg:flex lg:border-r ${
            mobileView === 'chats'
              ? 'flex'
              : 'hidden'
          }`}
        >
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />

              <input
                type="search"
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Поиск чатов..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {user?.role?.toLowerCase() ===
              'teacher' &&
              currentUserId !== null && (
                <SchoolStaffDirectory
                  currentUserId={
                    currentUserId
                  }
                  openingPersonId={
                    openingPersonId
                  }
                  onPersonClick={
                    handlePersonChatOpen
                  }
                />
              )}

            {isChatsLoading ? (
              <div className="flex min-h-52 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
                <MessageCircle className="mb-3 h-9 w-9 text-gray-300" />

                <p className="text-sm font-medium text-gray-700">
                  Чаты не найдены
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Здесь появятся доступные вам
                  личные, групповые и учебные чаты
                </p>
              </div>
            ) : (
              <div>
                {filteredChats.map((chat) => {
                  const title =
                    getDisplayChatTitle(
                      chat,
                      groupNamesById,
                      privateChatPartnersByChatId[
                        chat.id
                      ]
                    );

                  const isActive =
                    chat.id === activeChatId;

                  const lastMessage =
                    lastMessageByChatId[chat.id] ??
                    getEmbeddedLastMessage(chat);

                  const unreadCount =
                    unreadCountByChatId[chat.id] ??
                    getEmbeddedUnreadCount(chat);

                  const hasUnread =
                    unreadCount > 0;

                  const groupId =
                    chat.chat_type === 'group'
                      ? chat.group_id
                      : null;

                  return (
                    <div
                      key={chat.id}
                      className={`overflow-hidden border-b border-gray-200 transition last:border-b-0 ${
                        isActive
                          ? 'bg-red-50'
                          : hasUnread
                            ? 'bg-red-50/30'
                            : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const nextSearchParams =
                            new URLSearchParams(
                              searchParams
                            );

                          nextSearchParams.delete(
                            'groupId'
                          );
                          nextSearchParams.delete(
                            'chatId'
                          );

                          setSearchParams(
                            nextSearchParams,
                            {
                              replace: true,
                            }
                          );

                          setActiveChatId(chat.id);
                          setMobileView('dialog');
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                          isActive
                            ? 'bg-red-50 shadow-[inset_3px_0_0_#dc2626]'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <UserAvatar
                          avatarUrl={
                            privateChatPartnersByChatId[
                              chat.id
                            ]?.avatar_url
                          }
                          alt={title}
                          className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-start gap-2">
                            <p
                              className={`min-w-0 flex-1 truncate text-sm text-gray-900 ${
                                hasUnread
                                  ? 'font-bold'
                                  : 'font-semibold'
                              }`}
                            >
                              {title}
                            </p>

                            <div className="ml-auto flex shrink-0 items-center gap-1.5">
                              <span
                                className={`whitespace-nowrap text-[11px] ${
                                  hasUnread
                                    ? 'font-semibold text-red-600'
                                    : 'text-gray-400'
                                }`}
                              >
                                {formatChatDate(
                                  chat.updated_at
                                )}
                              </span>

                              {hasUnread && (
                                <span
                                  className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                                  title={`${unreadCount} непрочитанных сообщений`}
                                >
                                  {unreadCount > 99
                                    ? '99+'
                                    : unreadCount}
                                </span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${getChatSubtitleClass(
                              chat
                            )}`}
                          >
                            {getChatSubtitle(chat)}
                          </span>

                          <p
                            className={`mt-1 truncate text-xs ${
                              hasUnread
                                ? 'font-semibold text-gray-800'
                                : lastMessage
                                  ? 'text-gray-600'
                                  : 'text-gray-400'
                            }`}
                            title={
                              lastMessage
                                ? getMessagePreview(
                                    lastMessage,
                                    currentUserId,
                                    usersById
                                  )
                                : chat.description ||
                                  'Сообщений пока нет'
                            }
                          >
                            {lastMessage
                              ? getMessagePreview(
                                  lastMessage,
                                  currentUserId,
                                  usersById
                                )
                              : chat.description ||
                                'Сообщений пока нет'}
                          </p>
                        </div>
                      </button>

                      {groupId && (
                        <GroupChatMembers
                          directory={
                            groupDirectoriesById[
                              groupId
                            ] ?? null
                          }
                          isExpanded={
                            expandedGroupId ===
                            groupId
                          }
                          isLoading={loadingGroupIds.has(
                            groupId
                          )}
                          currentUserId={
                            currentUserId
                          }
                          openingPersonId={
                            openingPersonId
                          }
                          onToggle={() =>
                            setExpandedGroupId(
                              (
                                currentGroupId
                              ) =>
                                currentGroupId ===
                                groupId
                                  ? null
                                  : groupId
                            )
                          }
                          onPersonClick={
                            handlePersonChatOpen
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Активный чат */}
        <section
          className={`relative min-h-0 flex-col overflow-hidden lg:col-span-2 lg:flex ${
            mobileView === 'dialog'
              ? 'flex'
              : 'hidden'
          }`}
        >
          {!activeChat ? (
            <div className="flex flex-1 flex-col items-center justify-center bg-gray-50/50 px-6 text-center">
              <MessageCircle className="mb-4 h-12 w-12 text-gray-300" />

              <p className="font-semibold text-gray-700">
                Выберите чат
              </p>

              <p className="mt-1 max-w-sm text-sm text-gray-400">
                Выберите диалог в списке слева,
                чтобы посмотреть сообщения
              </p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-gray-100 p-4">
                <button
                  type="button"
                  onClick={() => setMobileView('chats')}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 lg:hidden"
                  aria-label="Вернуться к списку чатов"
                  title="Назад к чатам"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <UserAvatar
                  avatarUrl={
                    privateChatPartnersByChatId[
                      activeChat.id
                    ]?.avatar_url
                  }
                  alt={getDisplayChatTitle(
                    activeChat,
                    groupNamesById,
                    privateChatPartnersByChatId[
                      activeChat.id
                    ]
                  )}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {getDisplayChatTitle(
                      activeChat,
                      groupNamesById,
                      privateChatPartnersByChatId[
                        activeChat.id
                      ]
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span
                      className={
                        socketStatus === 'connected'
                          ? 'text-green-600'
                          : socketStatus === 'error'
                            ? 'text-red-500'
                            : 'text-gray-400'
                      }
                    >
                      {getSocketStatusLabel(
                        socketStatus
                      )}
                    </span>

                    {onlineUserIds.size > 0 && (
                      <span className="text-gray-400">
                        Онлайн: {onlineUserIds.size}
                      </span>
                    )}

                    {typingUserIds.size > 0 && (
                      <span className="font-medium text-red-500">
                        {typingUserIds.size === 1
                          ? `${getUserDisplayName(
                              usersById[
                                [...typingUserIds][0]
                              ],
                              [...typingUserIds][0]
                            )} печатает...`
                          : `${typingUserIds.size} пользователя печатают...`}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleArchiveActiveChat()
                  }
                  disabled={isChatArchiving}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Удалить чат"
                  aria-label="Удалить чат"
                >
                  {isChatArchiving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}

                  <span className="hidden sm:inline">
                    Удалить чат
                  </span>
                </button>
              </header>

              {pinnedMessage && (
                <div className="flex items-center gap-3 border-b border-red-100 bg-red-50/70 px-4 py-2.5 sm:px-6">
                  <Pin className="h-4 w-4 flex-shrink-0 text-red-600" />

                  <button
                    type="button"
                    onClick={() =>
                      scrollToMessage(
                        pinnedMessage.id
                      )
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-xs font-semibold text-red-600">
                      Закреплённое сообщение
                    </p>

                    <p className="truncate text-xs text-gray-700">
                      {pinnedMessage.text ||
                        'Сообщение без текста'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleTogglePinMessage(
                        pinnedMessage
                      )
                    }
                    disabled={isMessageActionLoading}
                    className="rounded-full p-1.5 text-gray-400 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Открепить сообщение"
                    aria-label="Открепить сообщение"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-gray-50/50 p-4 sm:p-6 [touch-action:pan-y]"
              >
                {isMessagesLoading ? (
                  <div className="flex h-full min-h-60 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-red-600" />
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex h-full min-h-60 flex-col items-center justify-center text-center">
                    <MessageCircle className="mb-3 h-10 w-10 text-gray-300" />

                    <p className="text-sm font-medium text-gray-700">
                      Сообщений пока нет
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Напишите первое сообщение
                    </p>
                  </div>
                ) : (
                  chatMessages.map((message) => {
                    const isOwnMessage =
                      message.sender_id ===
                      currentUserId;

                    const isPendingMessage =
                      message.id < 0;

                    const senderProfile =
                      usersById[message.sender_id];

                    const senderName = getUserDisplayName(
                      senderProfile,
                      `Пользователь №${message.sender_id}`
                    );

                    const repliedMessage =
                      message.reply_to_message_id
                        ? chatMessages.find(
                            (candidate) =>
                              candidate.id ===
                              message.reply_to_message_id
                          ) ?? null
                        : null;

                    return (
                      <div
                        key={message.id}
                        ref={(element) => {
                          if (element) {
                            messageElementRefs.current.set(
                              message.id,
                              element
                            );
                          } else {
                            messageElementRefs.current.delete(
                              message.id
                            );
                          }
                        }}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          if (isPendingMessage) {
                            return;
                          }

                          openMessageContextMenu(
                            event,
                            message
                          );
                        }}
                        onPointerDown={() => {
                          if (isPendingMessage) {
                            return;
                          }

                          handleMessagePointerDown(
                            message
                          );
                        }}
                        onPointerUp={
                          cancelMessageLongPress
                        }
                        onPointerCancel={
                          cancelMessageLongPress
                        }
                        onPointerMove={
                          cancelMessageLongPress
                        }
                        className={`flex rounded-xl transition ${
                          isOwnMessage
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`mt-auto flex h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ${
                            isOwnMessage
                              ? 'order-2 ml-2'
                              : 'mr-2'
                          }`}
                        >
                          <UserAvatar
                            avatarUrl={
                              senderProfile?.avatar_url
                            }
                            alt={senderName}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div
                          className={`group max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-md ${
                            isOwnMessage
                              ? 'rounded-tr-sm bg-red-600'
                              : 'rounded-tl-sm border border-gray-100 bg-white'
                          }`}
                        >
                          <p
                            className={`mb-1 text-xs font-medium ${
                              isOwnMessage
                                ? 'text-white/90'
                                : 'text-red-600'
                            }`}
                          >
                            {senderName}
                          </p>

                          {message.reply_to_message_id && (
                            <button
                              type="button"
                              onClick={() =>
                                scrollToMessage(
                                  message.reply_to_message_id!
                                )
                              }
                              className={`mb-2 block w-full rounded-lg border-l-4 px-3 py-2 text-left ${
                                isOwnMessage
                                  ? 'border-white/70 bg-white/10'
                                  : 'border-red-500 bg-red-50'
                              }`}
                            >
                              <span
                                className={`block text-[11px] font-semibold ${
                                  isOwnMessage
                                    ? 'text-white/90'
                                    : 'text-red-600'
                                }`}
                              >
                                Ответ: {
                                  repliedMessage
                                    ? getUserDisplayName(
                                      usersById[repliedMessage.sender_id],
                                      `Пользователь №${repliedMessage.sender_id}`
                                    )
                                    : 'пользователь'
                                }
                              </span>

                              <span
                                className={`block truncate text-xs ${
                                  isOwnMessage
                                    ? 'text-white/75'
                                    : 'text-gray-600'
                                }`}
                              >
                                {repliedMessage?.is_deleted
                                  ? 'Сообщение удалено'
                                  : repliedMessage?.text ||
                                    'Исходное сообщение'}
                              </span>
                            </button>
                          )}

                          <p
                            className={`whitespace-pre-wrap break-words text-sm ${
                              isOwnMessage
                                ? 'text-white'
                                : 'text-gray-700'
                            }`}
                          >
                            {message.is_deleted
                              ? 'Сообщение удалено'
                              : message.text ||
                                'Вложение'}
                          </p>

                          <div className="mt-1 flex items-center justify-end gap-1.5">
                            {message.is_edited && (
                              <span
                                className={`text-[10px] ${
                                  isOwnMessage
                                    ? 'text-white/60'
                                    : 'text-gray-400'
                                }`}
                              >
                                изменено
                              </span>
                            )}

                            <span
                              className={`text-xs ${
                                isOwnMessage
                                  ? 'text-white/70'
                                  : 'text-gray-400'
                              }`}
                            >
                              {formatMessageTime(
                                message.created_at
                              )}
                            </span>

                            {message.is_pinned && (
                              <span
                                className={`inline-flex items-center ${
                                  isOwnMessage
                                    ? 'text-white/80'
                                    : 'text-red-500'
                                }`}
                                title="Закреплено"
                              >
                                <Pin className="h-3 w-3" />
                              </span>
                            )}

                            {isOwnMessage && (
                              isPendingMessage ? (
                                <span
                                  className="inline-flex text-white/65"
                                  title="Отправляется"
                                  aria-label="Сообщение отправляется"
                                >
                                  <Clock3 className="h-3.5 w-3.5" />
                                </span>
                              ) : (
                                <span
                                  className={`text-xs font-semibold ${
                                    lastReadMessageIdByOthers !==
                                      null &&
                                    message.id <=
                                      lastReadMessageIdByOthers
                                      ? 'text-white'
                                      : 'text-white/65'
                                  }`}
                                  title={
                                    lastReadMessageIdByOthers !==
                                      null &&
                                    message.id <=
                                      lastReadMessageIdByOthers
                                      ? 'Прочитано'
                                      : 'Доставлено'
                                  }
                                  aria-label={
                                    lastReadMessageIdByOthers !==
                                      null &&
                                    message.id <=
                                      lastReadMessageIdByOthers
                                      ? 'Сообщение прочитано'
                                      : 'Сообщение доставлено'
                                  }
                                >
                                  {lastReadMessageIdByOthers !==
                                    null &&
                                  message.id <=
                                    lastReadMessageIdByOthers
                                    ? '✓✓'
                                    : '✓'}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {contextActionNotice && (
                <div className="absolute bottom-[86px] left-1/2 z-30 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
                  {contextActionNotice}
                </div>
              )}

              {messageContextMenu && (
                <div
                  role="menu"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  className={`fixed z-50 w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-2xl ${
                    isMessageActionLoading
                      ? 'pointer-events-none opacity-60'
                      : ''
                  }`}
                  style={{
                    left: messageContextMenu.x,
                    top: messageContextMenu.y,
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      startReply(
                        messageContextMenu.message
                      );
                      setMessageContextMenu(null);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <Reply className="h-4 w-4" />
                    Ответить
                  </button>

                  {messageContextMenu.message
                    .sender_id === currentUserId && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        startEditingMessage(
                          messageContextMenu.message
                        )
                      }
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Редактировать
                    </button>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      void handleTogglePinMessage(
                        messageContextMenu.message
                      )
                    }
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <Pin className="h-4 w-4" />
                    {messageContextMenu.message.is_pinned
                      ? 'Открепить'
                      : 'Закрепить'}
                  </button>

                  {messageContextMenu.message
                    .sender_id === currentUserId && (
                    <>
                      <div className="my-1 border-t border-gray-100" />

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() =>
                          void handleDeleteMessage(
                            messageContextMenu.message
                          )
                        }
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              )}

              {hasUnreadIncomingMessages && (
                <button
                  type="button"
                  onClick={() =>
                    scrollToLastMessage('smooth')
                  }
                  className="absolute bottom-[78px] right-4 z-10 flex items-center gap-1.5 rounded-full border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-lg transition hover:bg-red-50 sm:right-6"
                >
                  <ChevronDown className="h-4 w-4" />
                  Новые сообщения
                  {activeChatId !== null &&
                    (unreadCountByChatId[
                      activeChatId
                    ] ?? 0) > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {(unreadCountByChatId[
                          activeChatId
                        ] ?? 0) > 99
                          ? '99+'
                          : unreadCountByChatId[
                              activeChatId
                            ]}
                      </span>
                    )}
                </button>
              )}

              <form
                onSubmit={handleSendMessage}
                className="border-t border-gray-100 p-4"
              >
                {editingMessage && (
                  <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                    <Pencil className="h-4 w-4 flex-shrink-0 text-blue-600" />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-blue-600">
                        Редактирование сообщения
                      </p>

                      <p className="truncate text-xs text-gray-600">
                        {editingMessage.text}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingMessage(null);
                        setMessageText('');
                      }}
                      className="rounded-full p-1 text-gray-400 transition hover:bg-white hover:text-gray-700"
                      aria-label="Отменить редактирование"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {replyToMessage && (
                  <div className="mb-3 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                    <Reply className="h-4 w-4 flex-shrink-0 text-red-600" />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-red-600">
                        Ответ: {getUserDisplayName(
                          usersById[
                            replyToMessage.sender_id
                          ],
                          replyToMessage.sender_id
                        )}
                      </p>

                      <p className="truncate text-xs text-gray-600">
                        {replyToMessage.text ||
                          'Вложение'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setReplyToMessage(null)
                      }
                      className="rounded-full p-1 text-gray-400 transition hover:bg-white hover:text-gray-700"
                      aria-label="Отменить ответ"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                <textarea
                  value={messageText}
                  onChange={(event) =>
                    handleMessageTextChange(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  maxLength={20000}
                  placeholder={
                    editingMessage
                      ? 'Измените сообщение...'
                      : 'Напишите сообщение...'
                  }
                  className="input-field max-h-32 min-h-[46px] flex-1 resize-none"
                />

                <button
                  type="submit"
                  disabled={
                    isSending ||
                    !messageText.trim() ||
                    !currentUserId
                  }
                  className="btn-primary flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center px-0 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Отправить сообщение"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
