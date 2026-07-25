import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Loader2,
  MessageSquareText,
  Newspaper,
  RefreshCw,
  Settings,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationType,
  type UserNotification,
} from '../../../api/notificationApi';

import { useAuth } from '../../../context/AuthContext';

type NotificationFilter =
  | 'all'
  | 'unread'
  | 'homework'
  | 'schedule'
  | 'messages'
  | 'news';

interface NotificationStyle {
  icon: typeof Bell;
  iconClass: string;
  backgroundClass: string;
  label: string;
}

const FILTERS: Array<{
  value: NotificationFilter;
  label: string;
}> = [
  {
    value: 'all',
    label: 'Все',
  },
  {
    value: 'unread',
    label: 'Непрочитанные',
  },
  {
    value: 'homework',
    label: 'Задания',
  },
  {
    value: 'schedule',
    label: 'Расписание',
  },
  {
    value: 'messages',
    label: 'Сообщения',
  },
  {
    value: 'news',
    label: 'Новости',
  },
];

const NOTIFICATION_STYLES: Partial<
  Record<NotificationType, NotificationStyle>
> = {
  homework: {
    icon: BookOpen,
    iconClass: 'text-amber-600',
    backgroundClass: 'bg-amber-50',
    label: 'Домашнее задание',
  },
  homework_result: {
    icon: CheckCheck,
    iconClass: 'text-green-600',
    backgroundClass: 'bg-green-50',
    label: 'Результат работы',
  },
  schedule: {
    icon: CalendarDays,
    iconClass: 'text-blue-600',
    backgroundClass: 'bg-blue-50',
    label: 'Расписание',
  },
  lesson: {
    icon: CalendarDays,
    iconClass: 'text-blue-600',
    backgroundClass: 'bg-blue-50',
    label: 'Занятие',
  },
  chat: {
    icon: MessageSquareText,
    iconClass: 'text-red-600',
    backgroundClass: 'bg-red-50',
    label: 'Сообщение',
  },
  message: {
    icon: MessageSquareText,
    iconClass: 'text-red-600',
    backgroundClass: 'bg-red-50',
    label: 'Сообщение',
  },
  news: {
    icon: Newspaper,
    iconClass: 'text-violet-600',
    backgroundClass: 'bg-violet-50',
    label: 'Новость',
  },
  comment: {
    icon: Newspaper,
    iconClass: 'text-violet-600',
    backgroundClass: 'bg-violet-50',
    label: 'Комментарий',
  },
};

const DEFAULT_STYLE: NotificationStyle = {
  icon: Bell,
  iconClass: 'text-gray-600',
  backgroundClass: 'bg-gray-100',
  label: 'Уведомление',
};

function getNotificationStyle(
  type: NotificationType
): NotificationStyle {
  return (
    NOTIFICATION_STYLES[type] ??
    DEFAULT_STYLE
  );
}

function isNotificationInFilter(
  notification: UserNotification,
  filter: NotificationFilter
): boolean {
  switch (filter) {
    case 'unread':
      return !notification.is_read;

    case 'homework':
      return (
        notification.notification_type ===
          'homework' ||
        notification.notification_type ===
          'homework_result'
      );

    case 'schedule':
      return (
        notification.notification_type ===
          'schedule' ||
        notification.notification_type ===
          'lesson'
      );

    case 'messages':
      return (
        notification.notification_type ===
          'chat' ||
        notification.notification_type ===
          'message'
      );

    case 'news':
      return (
        notification.notification_type ===
          'news' ||
        notification.notification_type ===
          'comment'
      );

    default:
      return true;
  }
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

  if (type === 'homework_result') {
    return '/dashboard/homework';
  }

  if (type === 'homework') {
    const groupId = getPayloadNumber(
      notification,
      'group_id'
    );

    return groupId
      ? `/dashboard/homework?groupId=${groupId}`
      : '/dashboard/homework';
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

function formatNotificationDate(
  dateString: string
): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Дата не указана';
  }

  const differenceMs =
    Date.now() - date.getTime();

  const differenceMinutes = Math.floor(
    differenceMs / 60_000
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
    month: 'long',
    year:
      date.getFullYear() ===
      new Date().getFullYear()
        ? undefined
        : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось загрузить уведомления';
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState<UserNotification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [filter, setFilter] =
    useState<NotificationFilter>('all');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isMarkingAll, setIsMarkingAll] =
    useState(false);

  const [
    openingNotificationId,
    setOpeningNotificationId,
  ] = useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const loadNotifications = useCallback(
    async (background = false) => {
      if (!user?.id) {
        setNotifications([]);
        setUnreadCount(0);
        setError(
          'Не удалось определить текущего пользователя'
        );
        setIsLoading(false);
        return;
      }

      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const response =
          await getUserNotifications(user.id);

        setNotifications(
          (currentNotifications) =>
            JSON.stringify(currentNotifications) ===
            JSON.stringify(response.items)
              ? currentNotifications
              : response.items
        );

        setUnreadCount(
          Math.max(0, response.unread_count)
        );
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(
      () => {
        if (
          document.visibilityState === 'visible'
        ) {
          void loadNotifications(true);
        }
      },
      30_000
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadNotifications]);

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) =>
        isNotificationInFilter(
          notification,
          filter
        )
      ),
    [notifications, filter]
  );

  const filterCounts = useMemo(() => {
    const counts: Record<
      NotificationFilter,
      number
    > = {
      all: notifications.length,
      unread: unreadCount,
      homework: 0,
      schedule: 0,
      messages: 0,
      news: 0,
    };

    notifications.forEach((notification) => {
      (
        [
          'homework',
          'schedule',
          'messages',
          'news',
        ] as NotificationFilter[]
      ).forEach((candidateFilter) => {
        if (
          isNotificationInFilter(
            notification,
            candidateFilter
          )
        ) {
          counts[candidateFilter] += 1;
        }
      });
    });

    return counts;
  }, [notifications, unreadCount]);

  const handleNotificationOpen = async (
    notification: UserNotification
  ) => {
    if (!user?.id || openingNotificationId) {
      return;
    }

    setOpeningNotificationId(
      notification.notification_id
    );
    setError(null);

    try {
      if (!notification.is_read) {
        await markNotificationAsRead(
          notification.notification_id,
          user.id
        );

        setNotifications(
          (currentNotifications) =>
            currentNotifications.map((item) =>
              item.notification_id ===
              notification.notification_id
                ? {
                    ...item,
                    is_read: true,
                    read_at:
                      new Date().toISOString(),
                  }
                : item
            )
        );

        setUnreadCount((currentCount) =>
          Math.max(0, currentCount - 1)
        );
      }

      const target =
        getNotificationTarget(notification);

      if (target) {
        navigate(target);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setOpeningNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (
      !user?.id ||
      unreadCount === 0 ||
      isMarkingAll
    ) {
      return;
    }

    setIsMarkingAll(true);
    setError(null);

    try {
      await markAllNotificationsAsRead(
        user.id
      );

      const readAt = new Date().toISOString();

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              is_read: true,
              read_at:
                notification.read_at ??
                readAt,
            })
          )
      );

      setUnreadCount(0);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Уведомления
          </h1>

          <p className="mt-1 text-gray-500">
            Задания, расписание, сообщения и новости
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              void handleMarkAllAsRead()
            }
            disabled={
              unreadCount === 0 ||
              isMarkingAll
            }
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isMarkingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Прочитать все
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-2xl font-bold text-gray-900">
            {notifications.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Всего уведомлений
          </p>
        </div>

        <div className="stat-card">
          <p className="text-2xl font-bold text-red-600">
            {unreadCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Непрочитанных
          </p>
        </div>

        <div className="stat-card">
          <p className="text-2xl font-bold text-green-600">
            {Math.max(
              0,
              notifications.length -
                unreadCount
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Прочитано
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-4 sm:p-5">
          {FILTERS.map((filterItem) => (
            <button
              key={filterItem.value}
              type="button"
              onClick={() =>
                setFilter(filterItem.value)
              }
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                filter === filterItem.value
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterItem.label}

              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  filter === filterItem.value
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-gray-500'
                }`}
              >
                {filterCounts[filterItem.value]}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />
              <p className="mt-3 text-sm text-gray-500">
                Загружаем уведомления…
              </p>
            </div>
          </div>
        ) : error &&
          notifications.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="mt-4 font-semibold text-gray-900">
              Не удалось загрузить уведомления
            </p>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              {error}
            </p>
            <button
              type="button"
              onClick={() =>
                void loadNotifications()
              }
              className="btn-primary mt-5 px-4 py-2.5"
            >
              Повторить
            </button>
          </div>
        ) : filteredNotifications.length ===
          0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Bell className="h-7 w-7 text-gray-400" />
            </div>
            <p className="mt-4 font-semibold text-gray-900">
              {filter === 'all'
                ? 'Уведомлений пока нет'
                : 'В этой категории ничего нет'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Новые события появятся здесь автоматически.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map(
              (notification) => {
                const style =
                  getNotificationStyle(
                    notification.notification_type
                  );

                const Icon = style.icon;
                const target =
                  getNotificationTarget(
                    notification
                  );

                const isOpening =
                  openingNotificationId ===
                  notification.notification_id;

                return (
                  <button
                    key={
                      notification.notification_id
                    }
                    type="button"
                    onClick={() =>
                      void handleNotificationOpen(
                        notification
                      )
                    }
                    disabled={isOpening}
                    className={`relative flex w-full gap-4 p-4 text-left transition hover:bg-gray-50 sm:p-5 ${
                      notification.is_read
                        ? 'bg-white'
                        : 'bg-red-50/40'
                    }`}
                  >
                    {!notification.is_read && (
                      <span
                        className="absolute left-0 top-0 h-full w-1 bg-red-500"
                        aria-label="Непрочитанное уведомление"
                      />
                    )}

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.backgroundClass}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${style.iconClass}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p
                            className={`text-sm text-gray-900 ${
                              notification.is_read
                                ? 'font-semibold'
                                : 'font-bold'
                            }`}
                          >
                            {notification.title}
                          </p>

                          <p className="mt-0.5 text-xs font-medium text-gray-400">
                            {style.label}
                          </p>
                        </div>

                        <time className="shrink-0 text-xs text-gray-400">
                          {formatNotificationDate(
                            notification.created_at
                          )}
                        </time>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {notification.message}
                      </p>

                      {notification.priority ===
                        'urgent' && (
                        <span className="mt-2 inline-flex rounded-lg bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                          Важно
                        </span>
                      )}
                    </div>

                    <div className="my-auto shrink-0">
                      {isOpening ? (
                        <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                      ) : target ? (
                        <ChevronRight className="h-5 w-5 text-gray-300" />
                      ) : (
                        <Settings className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>

      {error && notifications.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
