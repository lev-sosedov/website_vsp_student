import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

import {
  getGroup,
  getGroupStudents,
} from '../../../api/academicApi';

import type {
  UserNotification,
} from '../../../api/notificationApi';

import StatCard from '../../../components/dashboard/StatCard';

import StudentDashboardGroups, {
  type StudentDashboardGroupCard,
} from '../../../components/dashboard/student/StudentDashboardGroups';

import StudentDashboardHomeworks from '../../../components/dashboard/student/StudentDashboardHomeworks';
import StudentDashboardLessons from '../../../components/dashboard/student/StudentDashboardLessons';
import StudentDashboardNotifications from '../../../components/dashboard/student/StudentDashboardNotifications';
import { useAuth } from '../../../context/AuthContext';

import {
  loadStudentDashboard,
  type StudentDashboardHomework,
  type StudentDashboardLesson,
  type StudentDashboardStatistics,
} from '../../../services/dashboardService';

const EMPTY_STATISTICS: StudentDashboardStatistics = {
  averageScore: null,
  scoreTrend: null,
  attendancePercentage: null,
  actionableHomeworkCount: 0,
};

function getGreetingName(
  firstName: string | null | undefined,
  userName: string | null | undefined
): string {
  const fullName = [firstName, userName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  if (fullName) {
    return fullName;
  }

  if (userName?.trim()) {
    return userName.trim();
  }

  return 'студент';
}

function formatPercentage(
  value: number | null
): string {
  return value === null ? '—' : `${value}%`;
}

function formatScoreTrend(
  value: number | null
): string | undefined {
  if (value === null) {
    return undefined;
  }

  return `${value >= 0 ? '+' : ''}${value}%`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось загрузить данные главной страницы';
}

export default function StudentDashboard() {
  const { user } = useAuth();

  const [groups, setGroups] =
    useState<StudentDashboardGroupCard[]>([]);

  const [todayLessons, setTodayLessons] =
    useState<StudentDashboardLesson[]>([]);

  const [statistics, setStatistics] =
    useState<StudentDashboardStatistics>(
      EMPTY_STATISTICS
    );

  const [
    upcomingHomeworks,
    setUpcomingHomeworks,
  ] = useState<StudentDashboardHomework[]>([]);

  const [notifications, setNotifications] =
    useState<UserNotification[]>([]);

  const [
    unreadNotificationsCount,
    setUnreadNotificationsCount,
  ] = useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadDashboard = useCallback(
    async () => {
      if (!user?.id) {
        setGroups([]);
        setTodayLessons([]);
        setStatistics(EMPTY_STATISTICS);
        setUpcomingHomeworks([]);
        setNotifications([]);
        setUnreadNotificationsCount(0);
        setError(
          'Не удалось определить текущего пользователя'
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const dashboardData =
          await loadStudentDashboard(user.id);

        const enrichedGroups = await Promise.all(
          dashboardData.groups.map(
            async (
              group
            ): Promise<StudentDashboardGroupCard> => {
              const [
                groupDetailsResult,
                studentsResult,
              ] = await Promise.allSettled([
                getGroup(group.id),
                getGroupStudents(group.id),
              ]);

              if (
                groupDetailsResult.status ===
                'rejected'
              ) {
                console.error(
                  `Не удалось получить данные группы ${group.id}:`,
                  groupDetailsResult.reason
                );
              }

              if (
                studentsResult.status ===
                'rejected'
              ) {
                console.error(
                  `Не удалось получить студентов группы ${group.id}:`,
                  studentsResult.reason
                );
              }

              return {
                ...group,
                branchId:
                  groupDetailsResult.status ===
                  'fulfilled'
                    ? groupDetailsResult.value
                        .branch_id ?? null
                    : null,
                studentsCount:
                  studentsResult.status ===
                  'fulfilled'
                    ? studentsResult.value.total
                    : null,
              };
            }
          )
        );

        setGroups(enrichedGroups);
        setTodayLessons(
          dashboardData.todayLessons
        );
        setStatistics(
          dashboardData.statistics
        );
        setUpcomingHomeworks(
          dashboardData.upcomingHomeworks
        );
        setNotifications(
          dashboardData.notifications
        );
        setUnreadNotificationsCount(
          dashboardData.unreadNotificationsCount
        );
      } catch (loadError) {
        console.error(
          'Не удалось загрузить главную страницу студента:',
          loadError
        );

        setGroups([]);
        setTodayLessons([]);
        setStatistics(EMPTY_STATISTICS);
        setUpcomingHomeworks([]);
        setNotifications([]);
        setUnreadNotificationsCount(0);
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleNotificationRead = (
    notificationId: number
  ) => {
    setNotifications(
      (currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.notification_id ===
          notificationId
            ? {
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : notification
        )
    );

    setUnreadNotificationsCount(
      (currentCount) =>
        Math.max(0, currentCount - 1)
    );
  };

  const greetingName = getGreetingName(
    user?.first_name,
    user?.user_name
  );

  const scoreChange = formatScoreTrend(
    statistics.scoreTrend
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Здравствуйте, {greetingName}!
          </h1>

          <p className="mt-1 text-gray-500">
            Вот что у вас сегодня на повестке.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="text-sm font-semibold text-red-700 hover:text-red-800"
          >
            Повторить
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Средний балл"
          value={
            isLoading
              ? '…'
              : formatPercentage(
                  statistics.averageScore
                )
          }
          change={
            isLoading
              ? undefined
              : scoreChange
          }
          trend={
            statistics.scoreTrend !== null &&
            statistics.scoreTrend < 0
              ? 'down'
              : 'up'
          }
          icon={TrendingUp}
          color="green"
        />

        <StatCard
          label="Посещаемость"
          value={
            isLoading
              ? '…'
              : formatPercentage(
                  statistics.attendancePercentage
                )
          }
          icon={CheckCircle2}
          color="blue"
        />

        <StatCard
          label="Домашние задания"
          value={
            isLoading
              ? '…'
              : String(
                  statistics.actionableHomeworkCount
                )
          }
          icon={BookOpen}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StudentDashboardGroups
          groups={groups}
          isLoading={isLoading}
          hasError={Boolean(error)}
        />

        <StudentDashboardNotifications
          notifications={notifications}
          unreadCount={
            unreadNotificationsCount
          }
          isLoading={isLoading}
          onNotificationRead={
            handleNotificationRead
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StudentDashboardLessons
          groups={groups}
          lessons={todayLessons}
          isLoading={isLoading}
          hasError={Boolean(error)}
        />

        <StudentDashboardHomeworks
          homeworks={upcomingHomeworks}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
