import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import type {
  ReactNode,
} from 'react';

import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Bell,
  User,
  Users,
  GraduationCap,
  Layers,
  Building2,
  Settings,
  Loader2,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import DashboardLayout from './dashboard/DashboardLayout';

import StudentDashboard from '../pages/dashboard/student/StudentDashboard';
import ParentDashboard from '../pages/dashboard/parent/ParentDashboard';
import TeacherDashboard from '../pages/dashboard/teacher/TeacherDashboard';
import TeacherHomeworkReview from '../pages/dashboard/teacher/TeacherHomeworkReview';
import TeacherAttendance from '../pages/dashboard/teacher/TeacherAttendance';
import TeacherGroups from '../pages/dashboard/teacher/TeacherGroups';
import TeacherStudents from '../pages/dashboard/teacher/TeacherStudents';
import TeacherMaterials from '../pages/dashboard/teacher/TeacherMaterials';
import TeacherSchedule from '../pages/dashboard/teacher/TeacherSchedule';
import AdminDashboard from '../pages/dashboard/admin/AdminDashboard';
import AdminStudents from '../pages/dashboard/admin/AdminStudents';
import AdminTeachers from '../pages/dashboard/admin/AdminTeachers';
import AdminGroups from '../pages/dashboard/admin/AdminGroups';
import AdminBranches from '../pages/dashboard/admin/AdminBranches';
import AdminEducationPrograms from '../pages/dashboard/admin/AdminEducationPrograms';
import AdminSchedule from '../pages/dashboard/admin/AdminSchedule';
import AdminNews from '../pages/dashboard/admin/AdminNews';

import Schedule from '../pages/dashboard/shared/Schedule';
import Homework from '../pages/dashboard/shared/Homework';
import Materials from '../pages/dashboard/shared/Materials';
import Attendance from '../pages/dashboard/shared/Attendance';
import Progress from '../pages/dashboard/shared/Progress';
import Messages from '../pages/dashboard/shared/Messages';
import Notifications from '../pages/dashboard/shared/Notifications';
import Profile from '../pages/dashboard/shared/Profile';

type DashboardRole =
  | 'student'
  | 'parent'
  | 'teacher'
  | 'admin';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const studentNav: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Дашборд',
    icon: LayoutDashboard,
  },
  {
    to: '/dashboard/schedule',
    label: 'Расписание',
    icon: Calendar,
  },
  {
    to: '/dashboard/homework',
    label: 'Домашние задания',
    icon: BookOpen,
  },
  {
    to: '/dashboard/materials',
    label: 'Материалы',
    icon: FileText,
  },
  {
    to: '/dashboard/attendance',
    label: 'Посещаемость',
    icon: CheckCircle2,
  },
  {
    to: '/dashboard/progress',
    label: 'Успеваемость',
    icon: TrendingUp,
  },
  {
    to: '/dashboard/messages',
    label: 'Сообщения',
    icon: MessageSquare,
  },
  {
    to: '/dashboard/notifications',
    label: 'Уведомления',
    icon: Bell,
  },
  {
    to: '/dashboard/profile',
    label: 'Профиль',
    icon: User,
  },
];

const parentNav: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Дашборд',
    icon: LayoutDashboard,
  },
  {
    to: '/dashboard/attendance',
    label: 'Посещаемость',
    icon: CheckCircle2,
  },
  {
    to: '/dashboard/homework',
    label: 'Домашние задания',
    icon: BookOpen,
  },
  {
    to: '/dashboard/progress',
    label: 'Успеваемость',
    icon: TrendingUp,
  },
  {
    to: '/dashboard/messages',
    label: 'Сообщения',
    icon: MessageSquare,
  },
  {
    to: '/dashboard/schedule',
    label: 'Расписание',
    icon: Calendar,
  },
  {
    to: '/dashboard/notifications',
    label: 'Уведомления',
    icon: Bell,
  },
  {
    to: '/dashboard/profile',
    label: 'Профиль',
    icon: User,
  },
];

const teacherNav: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Дашборд',
    icon: LayoutDashboard,
  },
  {
    to: '/dashboard/groups',
    label: 'Мои группы',
    icon: Layers,
  },
  {
  to: '/dashboard/schedule',
  label: 'Расписание',
  icon: Calendar,
  },
  {
    to: '/dashboard/students',
    label: 'Студенты',
    icon: Users,
  },
  {
    to: '/dashboard/homework',
    label: 'Домашние задания',
    icon: BookOpen,
  },
  {
    to: '/dashboard/attendance',
    label: 'Посещаемость',
    icon: CheckCircle2,
  },
  {
    to: '/dashboard/materials',
    label: 'Материалы',
    icon: FileText,
  },
  {
    to: '/dashboard/messages',
    label: 'Сообщения',
    icon: MessageSquare,
  },
  {
    to: '/dashboard/notifications',
    label: 'Уведомления',
    icon: Bell,
  },
  {
    to: '/dashboard/profile',
    label: 'Профиль',
    icon: User,
  },
];

const adminNav: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Дашборд',
    icon: LayoutDashboard,
  },
  {
    to: '/dashboard/students',
    label: 'Студенты',
    icon: Users,
  },
  {
    to: '/dashboard/teachers',
    label: 'Преподаватели',
    icon: GraduationCap,
  },
  {
    to: '/dashboard/groups',
    label: 'Группы',
    icon: Layers,
  },
  {
    to: '/dashboard/branches',
    label: 'Филиалы',
    icon: Building2,
  },
  {
    to: '/dashboard/programs',
    label: 'Учебные программы',
    icon: BookOpen,
  },
  {
    to: '/dashboard/schedule',
    label: 'Расписание',
    icon: Calendar,
  },
  {
    to: '/dashboard/news',
    label: 'Новости',
    icon: Newspaper,
  },
  {
    to: '/dashboard/progress',
    label: 'Аналитика',
    icon: TrendingUp,
  },
  {
    to: '/dashboard/messages',
    label: 'Сообщения',
    icon: MessageSquare,
  },
  {
    to: '/dashboard/notifications',
    label: 'Уведомления',
    icon: Bell,
  },
  {
    to: '/dashboard/profile',
    label: 'Настройки',
    icon: Settings,
  },
];

const roleLabels: Record<DashboardRole, string> = {
  student: 'Студент',
  parent: 'Родитель',
  teacher: 'Преподаватель',
  admin: 'Администратор',
};

const roleNav: Record<DashboardRole, NavItem[]> = {
  student: studentNav,
  parent: parentNav,
  teacher: teacherNav,
  admin: adminNav,
};

const roleDashboard: Record<DashboardRole, ReactNode> = {
  student: <StudentDashboard />,
  parent: <ParentDashboard />,
  teacher: <TeacherDashboard />,
  admin: <AdminDashboard />,
};

function normalizeRole(
  role: string | null
): DashboardRole {
  const normalizedRole = role
    ?.trim()
    .toUpperCase();

  switch (normalizedRole) {
    case 'ADMIN':
      return 'admin';

    case 'TEACHER':
      return 'teacher';

    case 'PARENT':
      return 'parent';

    case 'STUDENT':
      return 'student';

    case 'USER':
    default:
      return 'student';
  }
}

function DashboardLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />

        <p className="text-sm text-gray-500">
          Загружаем личный кабинет...
        </p>
      </div>
    </div>
  );
}

export default function DashboardRouter() {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  /*
   * При обновлении страницы AuthContext сначала
   * восстанавливает токен и пользователя из localStorage.
   *
   * Пока восстановление не завершено, нельзя
   * перенаправлять пользователя на страницу входа.
   */
  if (loading) {
    return <DashboardLoadingScreen />;
  }

  /*
   * Если токена или пользователя действительно нет,
   * отправляем посетителя на страницу входа.
   */
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const currentRole = normalizeRole(user.role);

  const navItems = roleNav[currentRole];
  const dashboard = roleDashboard[currentRole];
  const roleLabel = roleLabels[currentRole];

  return (
    <DashboardLayout
      navItems={navItems}
      roleLabel={roleLabel}
    >
      <Routes>
        <Route
          index
          element={dashboard}
        />

        <Route
          path="schedule"
          element={
            currentRole === 'teacher'
              ? <TeacherSchedule />
              : currentRole === 'admin'
                ? <AdminSchedule />
                : <Schedule />
          }
        />

        <Route
          path="homework"
          element={
            currentRole === 'teacher'
              ? <TeacherHomeworkReview />
              : <Homework />
          }
        />

        <Route
          path="materials"
          element={
            currentRole === 'teacher'
              ? <TeacherMaterials />
              : <Materials />
          }
        />

        <Route
          path="attendance"
          element={
            currentRole === 'teacher'
              ? <TeacherAttendance />
              : <Attendance />
          }
        />

        <Route
          path="progress"
          element={<Progress />}
        />

        <Route
          path="messages"
          element={<Messages />}
        />

        <Route
          path="notifications"
          element={<Notifications />}
        />

        <Route
          path="news"
          element={
            currentRole === 'admin'
              ? <AdminNews />
              : (
                <Navigate
                  to="/dashboard"
                  replace
                />
              )
          }
        />

        <Route
          path="profile"
          element={<Profile />}
        />

        <Route
          path="groups"
          element={
            currentRole === 'teacher'
              ? <TeacherGroups />
              : currentRole === 'admin'
                ? <AdminGroups />
                : <Progress />
          }
        />

        <Route
          path="students"
          element={
            currentRole === 'teacher'
              ? <TeacherStudents />
              : currentRole === 'admin'
                ? <AdminStudents />
                : <Progress />
          }
        />

        <Route
          path="teachers"
          element={
            currentRole === 'admin'
              ? <AdminTeachers />
              : <Progress />
          }
        />

        <Route
          path="branches"
          element={
            currentRole === 'admin'
              ? <AdminBranches />
              : <Progress />
          }
        />

        <Route
          path="programs"
          element={
            currentRole === 'admin'
              ? <AdminEducationPrograms />
              : <Progress />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </DashboardLayout>
  );
}
