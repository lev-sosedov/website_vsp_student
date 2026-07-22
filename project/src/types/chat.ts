/**
 * Типы чатов communication_service.
 */
export type ChatType =
  | 'private'
  | 'group'
  | 'lesson';

export type ChatMemberRole =
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'member'
  | string;

export type MessageType =
  | 'text'
  | 'file'
  | 'image'
  | 'video'
  | 'audio'
  | 'system'
  | string;

export interface ChatMemberShort {
  id: number;
  user_id: number;
  member_role: ChatMemberRole;
  is_active: boolean;
  joined_at: string;
}

/**
 * Основной ответ чата.
 *
 * unread_count и last_message приходят в списке чатов.
 * Для одиночных endpoints они могут отсутствовать.
 */
export interface Chat {
  id: number;
  chat_type: ChatType;

  title: string | null;
  description: string | null;

  group_id: number | null;
  lesson_id: number | null;

  created_by: number;

  is_active: boolean;
  is_archived: boolean;

  created_at: string;
  updated_at: string;

  unread_count?: number;
  last_message?: ChatMessage | null;
}

export interface ChatDetails extends Chat {
  members: ChatMemberShort[];
}

export interface ChatListResponse {
  total: number;
  items: Chat[];
}

export interface CreateChatRequest {
  chat_type: ChatType;

  title?: string | null;
  description?: string | null;

  group_id?: number | null;
  lesson_id?: number | null;

  created_by: number;
}

export interface UpdateChatRequest {
  title?: string | null;
  description?: string | null;
  changed_by: number;
}

export interface ChatActionRequest {
  user_id: number;
}

export interface ChatMember {
  id: number;
  chat_id: number;
  user_id: number;

  member_role: ChatMemberRole;

  added_by: number | null;
  joined_at: string;
  left_at: string | null;

  is_active: boolean;
  is_muted: boolean;
  is_pinned: boolean;

  last_read_message_id: number | null;
}

export interface ChatMemberListResponse {
  total: number;
  items: ChatMember[];
}

export interface CreateChatMemberRequest {
  chat_id: number;
  user_id: number;
  member_role?: ChatMemberRole;
  added_by: number;
}

export interface UpdateChatMemberRoleRequest {
  member_role: ChatMemberRole;
  changed_by: number;
}

export interface ChatMemberActionRequest {
  requested_by: number;
}

export interface LeaveChatRequest {
  user_id: number;
}

export interface ReplyMessage {
  id: number;
  sender_id: number;
  text: string | null;
  is_deleted: boolean;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  sender_id: number;

  message_type: MessageType;
  text: string | null;

  reply_to_message_id: number | null;

  is_edited: boolean;
  is_deleted: boolean;
  is_pinned: boolean;

  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export interface ChatMessageDetails extends ChatMessage {
  reply_to: ReplyMessage | null;
}

export interface ChatMessageListResponse {
  total: number;
  items: ChatMessage[];
}

export interface CreateChatMessageRequest {
  chat_id: number;
  sender_id: number;

  message_type?: MessageType;
  text?: string | null;

  reply_to_message_id?: number | null;
}

export interface UpdateChatMessageRequest {
  text: string;
  edited_by: number;
}

export interface MessageActionRequest {
  requested_by: number;
}

export interface MessageReadRequest {
  user_id: number;
}

export interface ChatReadAllRequest {
  user_id: number;
}

export interface MessageRead {
  id: number;
  message_id: number;
  user_id: number;
  read_at: string;
}

export interface ChatReadAllResponse {
  chat_id: number;
  user_id: number;
  last_read_message_id: number | null;
  created_read_count: number;
}

export interface ChatUnreadCountResponse {
  chat_id: number;
  user_id: number;
  unread_count: number;
}

export interface ChatListItem extends Chat {
  display_title: string;
  display_subtitle: string | null;
  last_message: ChatMessage | null;
  unread_count: number;
}