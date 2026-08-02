import { authorizedFetch } from './authorizedClient';
const API_URL =
  import.meta.env.VITE_API_URL ||
  '';

export type NotificationType =
  | 'system'
  | 'schedule'
  | 'lesson'
  | 'homework'
  | 'homework_result'
  | 'chat'
  | 'message'
  | 'news'
  | 'comment'
  | 'user'
  | 'academic';

export type NotificationPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export interface UserNotification {
  notification_id: number;
  recipient_id: number;

  notification_type: NotificationType;
  priority: NotificationPriority;

  title: string;
  message: string;

  source_service: string;
  event_type: string;

  source_entity_type: string | null;
  source_entity_id: number | null;
  payload: Record<string, unknown> | null;

  channel: string;
  status: string;

  is_read: boolean;
  delivered_at: string | null;
  read_at: string | null;

  created_at: string;
  expires_at: string | null;
}

export interface UserNotificationListResponse {
  total: number;
  unread_count: number;
  items: UserNotification[];
}

export interface NotificationUnreadCountResponse {
  user_id: number;
  unread_count: number;
}

export interface NotificationReadResponse {
  notification_id: number;
  user_id: number;
  is_read: boolean;
  read_at: string;
}

export interface NotificationReadAllResponse {
  user_id: number;
  updated_count: number;
}

export const NOTIFICATIONS_UPDATED_EVENT =
  'vsp:notifications-updated';

async function notificationRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await authorizedFetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    let message =
      `Ошибка Notification Service: ${response.status}`;

    try {
      const data = (await response.json()) as {
        detail?: string | {
          message?: string;
        };
        message?: string;
      };

      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (data.detail?.message) {
        message = data.detail.message;
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

  return response.json() as Promise<T>;
}

function dispatchNotificationsUpdated(): void {
  window.dispatchEvent(
    new Event(NOTIFICATIONS_UPDATED_EVENT)
  );
}

export async function getUserNotifications(
  userId: number,
  limit = 200
): Promise<UserNotificationListResponse> {
  const query = new URLSearchParams({
    limit: String(limit),
  });

  return notificationRequest<UserNotificationListResponse>(
    `/api/v1/notifications/user/${userId}?${query.toString()}`
  );
}

export async function getNotificationUnreadCount(
  userId: number
): Promise<NotificationUnreadCountResponse> {
  return notificationRequest<NotificationUnreadCountResponse>(
    `/api/v1/notifications/user/${userId}/unread-count`
  );
}

export async function markNotificationAsRead(
  notificationId: number,
  userId: number
): Promise<NotificationReadResponse> {
  const result =
    await notificationRequest<NotificationReadResponse>(
      `/api/v1/notifications/${notificationId}/read`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
        }),
      }
    );

  dispatchNotificationsUpdated();

  return result;
}

export async function markAllNotificationsAsRead(
  userId: number
): Promise<NotificationReadAllResponse> {
  const result =
    await notificationRequest<NotificationReadAllResponse>(
      `/api/v1/notifications/user/${userId}/read-all`,
      {
        method: 'POST',
      }
    );

  dispatchNotificationsUpdated();

  return result;
}

export interface NotificationPreference {
  id: number;
  user_id: number;

  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  telegram_enabled: boolean;

  schedule_enabled: boolean;
  lesson_enabled: boolean;
  homework_enabled: boolean;
  homework_result_enabled: boolean;
  chat_enabled: boolean;
  news_enabled: boolean;

  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;

  created_at: string;
  updated_at: string;
}

export type NotificationPreferenceBooleanField =
  | 'in_app_enabled'
  | 'email_enabled'
  | 'push_enabled'
  | 'telegram_enabled'
  | 'schedule_enabled'
  | 'lesson_enabled'
  | 'homework_enabled'
  | 'homework_result_enabled'
  | 'chat_enabled'
  | 'news_enabled';

export type NotificationPreferenceUpdate = Partial<
  Pick<
    NotificationPreference,
    NotificationPreferenceBooleanField |
      'quiet_hours_enabled' |
      'quiet_hours_start' |
      'quiet_hours_end' |
      'timezone'
  >
>;

export async function getNotificationPreference(
  userId: number
): Promise<NotificationPreference> {
  return notificationRequest<NotificationPreference>(
    `/api/v1/notification-preferences/${userId}`
  );
}

export async function updateNotificationPreference(
  userId: number,
  data: NotificationPreferenceUpdate
): Promise<NotificationPreference> {
  return notificationRequest<NotificationPreference>(
    `/api/v1/notification-preferences/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}
