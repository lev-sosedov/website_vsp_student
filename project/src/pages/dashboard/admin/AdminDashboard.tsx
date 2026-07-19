import { Users, GraduationCap, Building2, BookOpen, UserCog, Layers, Calendar, Newspaper, Settings } from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import ProgressBar from '../../../components/dashboard/ProgressBar';
import { adminStats, adminStudents, weeklyActivity, progressData } from '../../../data/dashboardData';

export default function AdminDashboard() {
  const maxActivity = Math.max(...weeklyActivity.map((d) => d.value));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
        <p className="text-gray-500 mt-1">Обзор системы и ключевые показатели</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Студентов" value={String(adminStats.totalStudents)} change="+47" trend="up" icon={Users} color="red" />
        <StatCard label="Преподавателей" value={String(adminStats.totalTeachers)} icon={GraduationCap} color="blue" />
        <StatCard label="Родителей" value={String(adminStats.totalParents)} change="+12" trend="up" icon={UserCog} color="purple" />
        <StatCard label="Групп" value={String(adminStats.totalGroups)} icon={Layers} color="amber" />
        <StatCard label="Филиалов" value={String(adminStats.totalBranches)} icon={Building2} color="green" />
        <StatCard label="Курсов" value={String(adminStats.totalCourses)} icon={BookOpen} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">Активность платформы</h2>
            <span className="text-xs text-gray-400">За неделю</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-48">
            {weeklyActivity.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-100 rounded-lg overflow-hidden flex items-end" style={{ height: '160px' }}>
                  <div className="w-full bg-red-500 rounded-lg transition-all duration-500 hover:bg-red-600" style={{ height: `${(d.value / maxActivity) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Course popularity */}
        <div className="card p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-5">Популярность курсов</h2>
          <div className="space-y-4">
            {progressData.slice(0, 5).map((p) => (
              <ProgressBar key={p.subject} label={p.subject} value={p.value} />
            ))}
          </div>
        </div>
      </div>

      {/* Students table */}
      <div className="card p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-5">Последние студенты</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Студент</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Группа</th>
                <th className="pb-3 font-medium">Филиал</th>
                <th className="pb-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {adminStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-semibold text-xs">
                        {s.name[0]}
                      </div>
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-500">{s.email}</td>
                  <td className="py-3 text-gray-700">{s.group}</td>
                  <td className="py-3 text-gray-700">{s.branch}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {s.status === 'active' ? 'Активен' : 'Приостановлен'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick admin actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Users, label: 'Студенты' },
          { icon: GraduationCap, label: 'Преподаватели' },
          { icon: Layers, label: 'Группы' },
          { icon: Calendar, label: 'Расписания' },
          { icon: Newspaper, label: 'Новости' },
          { icon: Settings, label: 'Настройки' },
        ].map((a, i) => (
          <div key={i} className="card p-5 flex flex-col items-center gap-2 hover:border-red-200 hover:bg-red-50 transition-all group cursor-pointer">
            <a.icon className="w-6 h-6 text-gray-400 group-hover:text-red-600 transition-colors" />
            <span className="text-xs font-medium text-gray-700 text-center">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
