import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, FileText, CheckCircle2, TrendingUp, MessageSquare, Bell, User, Users, GraduationCap, Layers, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import StudentDashboard from '../pages/dashboard/student/StudentDashboard';
import ParentDashboard from '../pages/dashboard/parent/ParentDashboard';
import TeacherDashboard from '../pages/dashboard/teacher/TeacherDashboard';
import AdminDashboard from '../pages/dashboard/admin/AdminDashboard';
import Schedule from '../pages/dashboard/shared/Schedule';
import Homework from '../pages/dashboard/shared/Homework';
import Materials from '../pages/dashboard/shared/Materials';
import Attendance from '../pages/dashboard/shared/Attendance';
import Progress from '../pages/dashboard/shared/Progress';
import Messages from '../pages/dashboard/shared/Messages';
import Notifications from '../pages/dashboard/shared/Notifications';
import Profile from '../pages/dashboard/shared/Profile';

const studentNav = [
  { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/dashboard/schedule', label: 'Расписание', icon: Calendar },
  { to: '/dashboard/homework', label: 'Домашние задания', icon: BookOpen },
  { to: '/dashboard/materials', label: 'Материалы', icon: FileText },
  { to: '/dashboard/attendance', label: 'Посещаемость', icon: CheckCircle2 },
  { to: '/dashboard/progress', label: 'Успеваемость', icon: TrendingUp },
  { to: '/dashboard/messages', label: 'Сообщения', icon: MessageSquare },
  { to: '/dashboard/notifications', label: 'Уведомления', icon: Bell },
  { to: '/dashboard/profile', label: 'Профиль', icon: User },
];

const parentNav = [
  { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/dashboard/attendance', label: 'Посещаемость', icon: CheckCircle2 },
  { to: '/dashboard/homework', label: 'Домашние задания', icon: BookOpen },
  { to: '/dashboard/progress', label: 'Успеваемость', icon: TrendingUp },
  { to: '/dashboard/messages', label: 'Сообщения', icon: MessageSquare },
  { to: '/dashboard/schedule', label: 'Расписание', icon: Calendar },
  { to: '/dashboard/notifications', label: 'Уведомления', icon: Bell },
  { to: '/dashboard/profile', label: 'Профиль', icon: User },
];

const teacherNav = [
  { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/dashboard/groups', label: 'Мои группы', icon: Layers },
  { to: '/dashboard/students', label: 'Студенты', icon: Users },
  { to: '/dashboard/homework', label: 'Домашние задания', icon: BookOpen },
  { to: '/dashboard/attendance', label: 'Посещаемость', icon: CheckCircle2 },
  { to: '/dashboard/materials', label: 'Материалы', icon: FileText },
  { to: '/dashboard/messages', label: 'Сообщения', icon: MessageSquare },
  { to: '/dashboard/notifications', label: 'Уведомления', icon: Bell },
  { to: '/dashboard/profile', label: 'Профиль', icon: User },
];

const adminNav = [
  { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/dashboard/students', label: 'Студенты', icon: Users },
  { to: '/dashboard/teachers', label: 'Преподаватели', icon: GraduationCap },
  { to: '/dashboard/groups', label: 'Группы', icon: Layers },
  { to: '/dashboard/progress', label: 'Аналитика', icon: TrendingUp },
  { to: '/dashboard/messages', label: 'Сообщения', icon: MessageSquare },
  { to: '/dashboard/notifications', label: 'Уведомления', icon: Bell },
  { to: '/dashboard/profile', label: 'Настройки', icon: Settings },
];

const roleLabels: Record<string, string> = {
  student: 'Студент',
  parent: 'Родитель',
  teacher: 'Преподаватель',
  admin: 'Администратор',
};

const roleNav: Record<string, any[]> = {
  student: studentNav,
  parent: parentNav,
  teacher: teacherNav,
  admin: adminNav,
};

const roleDashboard: Record<string, React.ReactNode> = {
  student: <StudentDashboard />,
  parent: <ParentDashboard />,
  teacher: <TeacherDashboard />,
  admin: <AdminDashboard />,
};

const sharedRoutes = (
  <>
    <Route path="schedule" element={<Schedule />} />
    <Route path="homework" element={<Homework />} />
    <Route path="materials" element={<Materials />} />
    <Route path="attendance" element={<Attendance />} />
    <Route path="progress" element={<Progress />} />
    <Route path="messages" element={<Messages />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="profile" element={<Profile />} />
    <Route path="groups" element={<Schedule />} />
    <Route path="students" element={<Progress />} />
    <Route path="teachers" element={<Progress />} />
  </>
);

export default function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const nav = roleNav[user.role] || studentNav;
  const dashboard = roleDashboard[user.role] || <StudentDashboard />;

  return (
    <DashboardLayout navItems={nav} roleLabel={roleLabels[user.role]}>
      <Routes>
        <Route index element={dashboard} />
        {sharedRoutes}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
