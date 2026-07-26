import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Newspaper,
} from 'lucide-react';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  markNotificationAsRead,
  type NotificationType,
  type UserNotification,
} from '../../../api/notificationApi';

import { useAuth } from '../../../context/AuthContext';

interface NotificationVisual {
  icon: typeof Bell;
  iconClass: string;
  backgroundClass: string;
}

interface StudentDashboardNotificationsProps {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  onNotificationRead: (
    notificationId: number
  ) => void;
}

const NOTIFICATION_VISUALS: Partial<
  Record<NotificationType, NotificationVisual>
> = {
  homework: {
    icon: BookOpen,
    iconClass: 'text-amber-600',
    backgroundClass: 'bg-amber-50',
  },
  homework_result: {
    icon: CheckCircle2,
    iconClass: 'text-green-600',
    backgroundClass: 'bg-green-50',
  },
  schedule: {
    icon: CalendarDays,
    iconClass: 'text-blue-600',
    backgroundClass: 'bg-blue-50',
  },
  lesson: {
    icon: CalendarDays,
    iconClass: 'text-blue-600',
    backgroundClass: 'bg-blue-50',
  },
  chat: {
    icon: MessageSquareText,
    iconClass: 'text-red-600',
    backgroundClass: 'bg-red-50',
  },
  message: {
    icon: MessageSquareText,
    iconClass: 'text-red-600',
    backgroundClass: 'bg-red-50',
  },
  news: {
    icon: Newspaper,
    iconClass: 'text-violet-600',
    backgroundClass: 'bg-violet-50',
  },
  comment: {
    icon: Newspaper,
    iconClass: 'text-violet-600',
    backgroundClass: 'bg-violet-50',
  },
};

const DEFAULT_NOTIFICATION_VISUAL: NotificationVisual = {
  icon: Bell,
  iconClass: 'text-gray-600',
  backgroundClass: 'bg-gray-100',
};

function formatNotificationDate(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Дата не указана';
  }

  const differenceMinutes = Math.floor(
    (Date.now() - date.getTime()) / 60_000
  );

  if (differenceMinutes < 1) {
    return 'Только что';
  }

  if (differenceMinutes < 60) {
    return `${differenceMinutes} мин назад`;
  }

  const differenceHours = Math.floor(
    differenceMinutes / 60
  );

  if (differenceHours < 24) {
    return `${differenceHours} ч назад`;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function getPayloadNumber(
  notification: UserNotification,
  field: string
): number | null {
  const value = notification.payload?.[field];
  const numberValue = Number(value);

  return Number.isInteger(numberValue) &&
    numberValue > 0
    ? numberValue
    : null;
}

function getNotificationTarget(
  notification: UserNotification
): string | null {
  const type = notification.notification_type;

  if (type === 'message' || type === 'chat') {
    const chatId = getPayloadNumber(
      notification,
      'chat_id'
    );

    return chatId
      ? `/dashboard/messages?chatId=${chatId}`
      : '/dashboard/messages';
  }

  if (
    type === 'homework' ||
    type === 'homework_result'
  ) {
    return '/dashboard/homework';
  }

  if (type === 'schedule' || type === 'lesson') {
    const groupId = getPayloadNumber(
      notification,
      'group_id'
    );

    return groupId
      ? `/dashboard/schedule?groupId=${groupId}`
      : '/dashboard/schedule';
  }

  if (type === 'news' || type === 'comment') {
    return '/news';
  }

  return null;
}

export default function StudentDashboardNotifications({
  notifications,
  unreadCount,
  isLoading,
  onNotificationRead,
}: StudentDashboardNotificationsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [
    openingNotificationId,
    setOpeningNotificationId,
  ] = useState<number | null>(null);

  const handleNotificationOpen = async (
    notification: UserNotification
  ) => {
    if (
      !user?.id ||
      openingNotificationId !== null
    ) {
      return;
    }

    setOpeningNotificationId(
      notification.notification_id
    );

    try {
      if (!notification.is_read) {
        await markNotificationAsRead(
          notification.notification_id,
          user.id
        );

        onNotificationRead(
          notification.notification_id
        );
      }

      const target =
        getNotificationTarget(notification);

      if (target) {
        navigate(target);
      }
    } catch (error) {
      console.error(
        'Не удалось открыть уведомление:',
        error
      );
    } finally {
      setOpeningNotificationId(null);
    }
  };

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Уведомления
          </h2>

          {!isLoading && unreadCount > 0 && (
            <p className="mt-0.5 text-xs text-red-500">
              Непрочитанных: {unreadCount}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            navigate('/dashboard/notifications')
          }
          className="text-sm text-red-600 hover:text-red-700"
        >
          Все
        </button>
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-gray-50 p-5 text-center">
          <Bell className="h-7 w-7 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700">
            Уведомлений пока нет
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Новые события появятся здесь.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notification) => {
            const visual =
              NOTIFICATION_VISUALS[
                notification.notification_type
              ] ??
              DEFAULT_NOTIFICATION_VISUAL;

            const Icon = visual.icon;
            const isOpening =
              openingNotificationId ===
              notification.notification_id;

            return (
              <button
                key={notification.notification_id}
                type="button"
                onClick={() =>
                  void handleNotificationOpen(
                    notification
                  )
                }
                disabled={isOpening}
                className={`flex w-full gap-3 rounded-xl p-2.5 text-left transition hover:bg-gray-50 ${
                  notification.is_read
                    ? ''
                    : 'bg-red-50/50'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${visual.backgroundClass}`}
                >
                  {isOpening ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  ) : (
                    <Icon
                      className={`h-4 w-4 ${visual.iconClass}`}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <p
                      className={`line-clamp-1 flex-1 text-sm text-gray-900 ${
                        notification.is_read
                          ? 'font-medium'
                          : 'font-semibold'
                      }`}
                    >
                      {notification.title}
                    </p>

                    {!notification.is_read && (
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500"
                        aria-label="Непрочитанное уведомление"
                      />
                    )}
                  </div>

                  <p className="line-clamp-1 text-xs text-gray-500">
                    {notification.message}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatNotificationDate(
                      notification.created_at
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
