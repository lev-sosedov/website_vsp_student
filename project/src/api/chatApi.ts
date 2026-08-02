import type {
  Chat,
  ChatActionRequest,
  ChatDetails,
  ChatListResponse,
  ChatMember,
  ChatMemberActionRequest,
  ChatMemberListResponse,
  ChatReadAllRequest,
  ChatReadAllResponse,
  ChatUnreadCountResponse,
  CreateChatMemberRequest,
  CreateChatMessageRequest,
  CreateChatRequest,
  ChatMessage,
  ChatMessageDetails,
  ChatMessageListResponse,
  LeaveChatRequest,
  MessageActionRequest,
  MessageRead,
  MessageReadRequest,
  UpdateChatMemberRoleRequest,
  UpdateChatMessageRequest,
  UpdateChatRequest,
} from '../types';
import { authorizedFetch } from './authorizedClient';

const API_URL =
  import.meta.env.VITE_API_URL ||
  '';

/**
 * Получает access token из localStorage.
 */
/**
 * Универсальный запрос к communication-service.
 */
async function chatRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await authorizedFetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message =
      `Ошибка communication-service: ${response.status}`;

    try {
      const data = (await response.json()) as {
        detail?: string | Array<{ msg?: string }>;
        message?: string;
      };

      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map((item) => item.msg)
          .filter(Boolean)
          .join(', ');
      } else if (data.message) {
        message = data.message;
      }
    } catch {
      const text = await response.text();

      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

// =====================================================
// Chats
// =====================================================

export async function createChat(
  data: CreateChatRequest
): Promise<Chat> {
  return chatRequest<Chat>('/api/v1/chats', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function ensureStudentAdminChat(
  studentId: number
): Promise<Chat> {
  return chatRequest<Chat>(
    '/api/v1/chats/student-admin/ensure',
    {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
      }),
    }
  );
}

export async function getChats(
  userId: number
): Promise<ChatListResponse> {
  const query = new URLSearchParams({
    user_id: String(userId),
  });

  return chatRequest<ChatListResponse>(
    `/api/v1/chats?${query.toString()}`
  );
}

export async function getChatById(
  chatId: number
): Promise<ChatDetails> {
  return chatRequest<ChatDetails>(
    `/api/v1/chats/${chatId}`
  );
}

export async function updateChat(
  chatId: number,
  data: UpdateChatRequest
): Promise<Chat> {
  return chatRequest<Chat>(
    `/api/v1/chats/${chatId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function archiveChat(
  chatId: number,
  data: ChatActionRequest
): Promise<Chat> {
  return chatRequest<Chat>(
    `/api/v1/chats/${chatId}/archive`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function restoreChat(
  chatId: number,
  data: ChatActionRequest
): Promise<Chat> {
  return chatRequest<Chat>(
    `/api/v1/chats/${chatId}/restore`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function deactivateChat(
  chatId: number,
  data: ChatActionRequest
): Promise<Chat> {
  return chatRequest<Chat>(
    `/api/v1/chats/${chatId}/deactivate`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function activateChat(
  chatId: number,
  data: ChatActionRequest
): Promise<Chat> {
  return chatRequest<Chat>(
    `/api/v1/chats/${chatId}/activate`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

// =====================================================
// Chat members
// =====================================================

export async function addChatMember(
  data: CreateChatMemberRequest
): Promise<ChatMember> {
  return chatRequest<ChatMember>(
    '/api/v1/chat-members',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function getChatMembers(
  chatId: number
): Promise<ChatMemberListResponse> {
  return chatRequest<ChatMemberListResponse>(
    `/api/v1/chat-members/chat/${chatId}`
  );
}

export async function getChatMemberById(
  memberId: number
): Promise<ChatMember> {
  return chatRequest<ChatMember>(
    `/api/v1/chat-members/${memberId}`
  );
}

export async function updateChatMemberRole(
  memberId: number,
  data: UpdateChatMemberRoleRequest
): Promise<ChatMember> {
  return chatRequest<ChatMember>(
    `/api/v1/chat-members/${memberId}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function deactivateChatMember(
  memberId: number,
  data: ChatMemberActionRequest
): Promise<ChatMember> {
  return chatRequest<ChatMember>(
    `/api/v1/chat-members/${memberId}/deactivate`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function activateChatMember(
  memberId: number,
  data: ChatMemberActionRequest
): Promise<ChatMember> {
  return chatRequest<ChatMember>(
    `/api/v1/chat-members/${memberId}/activate`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function leaveChat(
  chatId: number,
  data: LeaveChatRequest
): Promise<ChatMember> {
  return chatRequest<ChatMember>(
    `/api/v1/chat-members/chat/${chatId}/leave`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

// =====================================================
// Messages
// =====================================================

export async function sendChatMessage(
  data: CreateChatMessageRequest
): Promise<ChatMessage> {
  return chatRequest<ChatMessage>(
    '/api/v1/messages',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function getChatMessages(
  chatId: number,
  requestedBy: number
): Promise<ChatMessageListResponse> {
  const query = new URLSearchParams({
    requested_by: String(requestedBy),
    include_deleted: 'false',
    skip: '0',
    limit: '100',
  });

  return chatRequest<ChatMessageListResponse>(
    `/api/v1/messages/chat/${chatId}?${query.toString()}`
  );
}

export async function getMessageById(
  messageId: number
): Promise<ChatMessageDetails> {
  return chatRequest<ChatMessageDetails>(
    `/api/v1/messages/${messageId}`
  );
}

export async function updateChatMessage(
  messageId: number,
  data: UpdateChatMessageRequest
): Promise<ChatMessage> {
  return chatRequest<ChatMessage>(
    `/api/v1/messages/${messageId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteChatMessage(
  messageId: number,
  data: MessageActionRequest
): Promise<ChatMessage> {
  return chatRequest<ChatMessage>(
    `/api/v1/messages/${messageId}/delete`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function pinChatMessage(
  messageId: number,
  data: MessageActionRequest
): Promise<ChatMessage> {
  return chatRequest<ChatMessage>(
    `/api/v1/messages/${messageId}/pin`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function unpinChatMessage(
  messageId: number,
  data: MessageActionRequest
): Promise<ChatMessage> {
  return chatRequest<ChatMessage>(
    `/api/v1/messages/${messageId}/unpin`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

// =====================================================
// Message reads
// =====================================================

export async function markMessageAsRead(
  messageId: number,
  data: MessageReadRequest
): Promise<MessageRead> {
  return chatRequest<MessageRead>(
    `/api/v1/message-reads/${messageId}`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function markChatAsRead(
  chatId: number,
  data: ChatReadAllRequest
): Promise<ChatReadAllResponse> {
  return chatRequest<ChatReadAllResponse>(
    `/api/v1/message-reads/chat/${chatId}/read-all`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function getChatUnreadCount(
  chatId: number,
  userId: number
): Promise<ChatUnreadCountResponse> {
  const query = new URLSearchParams({
    user_id: String(userId),
  });

  return chatRequest<ChatUnreadCountResponse>(
    `/api/v1/message-reads/chat/${chatId}/unread-count?${query.toString()}`
  );
}

export interface UserUnreadCountResponse {
  user_id: number;
  unread_count: number;
}

export async function getUserUnreadCount(
  userId: number
): Promise<UserUnreadCountResponse> {
  return chatRequest<UserUnreadCountResponse>(
    `/api/v1/message-reads/user/${userId}/unread-count`
  );
}
