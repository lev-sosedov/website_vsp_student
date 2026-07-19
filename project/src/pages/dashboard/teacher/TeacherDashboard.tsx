import { Link } from 'react-router-dom';
import { Users, BookOpen, CheckCircle2, ClipboardList, ArrowRight, FileText, MessageSquare } from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import { teacherGroups, teacherStudents, notifications } from '../../../data/dashboardData';

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Кабинет преподавателя</h1>
        <p className="text-gray-500 mt-1">Обзор ваших групп и студентов</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Мои группы" value="3" icon={Users} color="red" />
        <StatCard label="Студентов" value="30" icon={BookOpen} color="blue" />
        <StatCard label="Заданий на проверке" value="12" icon={ClipboardList} color="amber" />
        <StatCard label="Средняя успеваемость" value="82%" change="+4%" trend="up" icon={CheckCircle2} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My groups */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">Мои группы</h2>
            <Link to="/dashboard/groups" className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1">
              Все <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {teacherGroups.map((g) => (
              <div key={g.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                  <p className="text-xs text-gray-500">{g.course} · {g.schedule}</p>
                </div>
                <span className="text-sm font-medium text-gray-700">{g.students} студ.</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">Уведомления</h2>
            <Link to="/dashboard/notifications" className="text-sm text-red-600 hover:text-red-700">Все</Link>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="flex gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{n.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Students */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-gray-900">Студенты</h2>
          <Link to="/dashboard/students" className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1">
            Все студенты <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Студент</th>
                <th className="pb-3 font-medium">Группа</th>
                <th className="pb-3 font-medium">Прогресс</th>
                <th className="pb-3 font-medium">Посещаемость</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teacherStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-semibold text-xs">
                        {s.name[0]}
                      </div>
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-500">{s.group}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${s.progress}%` }} />
                      </div>
                      <span className="text-gray-700 text-xs">{s.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-700">{s.attendance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ClipboardList, label: 'Задания', to: '/dashboard/homework' },
          { icon: FileText, label: 'Материалы', to: '/dashboard/materials' },
          { icon: MessageSquare, label: 'Сообщения', to: '/dashboard/messages' },
          { icon: CheckCircle2, label: 'Посещаемость', to: '/dashboard/attendance' },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="card p-5 flex flex-col items-center gap-2 hover:border-red-200 hover:bg-red-50 transition-all group">
            <a.icon className="w-6 h-6 text-gray-400 group-hover:text-red-600 transition-colors" />
            <span className="text-xs font-medium text-gray-700 text-center">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
