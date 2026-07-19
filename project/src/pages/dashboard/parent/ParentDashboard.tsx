import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Circle, TrendingUp, GraduationCap, Calendar, MessageSquare } from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import ProgressBar from '../../../components/dashboard/ProgressBar';
import { parentChildData, notifications, schedule } from '../../../data/dashboardData';

export default function ParentDashboard() {
  const child = parentChildData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Личный кабинет родителя</h1>
        <p className="text-gray-500 mt-1">Прогресс вашего ребёнка — {child.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Средний балл" value={`${child.averageGrade}%`} change="+3%" trend="up" icon={TrendingUp} color="green" />
        <StatCard label="Посещаемость" value={`${child.attendance}%`} icon={CheckCircle2} color="blue" />
        <StatCard label="Группа" value={child.group} icon={GraduationCap} color="purple" />
        <StatCard label="Активные задания" value="1" icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses & grades */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-5">Оценки по курсам</h2>
          <div className="space-y-4">
            {child.courses.map((c) => (
              <div key={c.name} className="p-4 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.teacher}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{c.grade}%</span>
                </div>
                <ProgressBar value={c.grade} color={c.grade >= 85 ? 'bg-green-500' : c.grade >= 70 ? 'bg-amber-500' : 'bg-red-500'} showValue={false} />
              </div>
            ))}
          </div>
        </div>

        {/* Teacher messages */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">Сообщения от учителей</h2>
            <Link to="/dashboard/messages" className="text-sm text-red-600 hover:text-red-700">Все</Link>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Анна Петрова', text: 'Отличная работа над проектом!', time: 'Сегодня' },
              { name: 'Дмитрий Соколов', text: 'Рекомендую подтянуть асинхронность', time: 'Вчера' },
              { name: 'Екатерина Лебедева', text: 'Активность на семинарах высокая', time: 'Пн' },
            ].map((m, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm flex-shrink-0">
                  {m.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{m.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Homework + schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">Домашние задания</h2>
            <Link to="/dashboard/homework" className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1">
              Все <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {child.recentHomework.map((hw) => (
              <div key={hw.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                {hw.status === 'graded' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                 hw.status === 'submitted' ? <Clock className="w-5 h-5 text-amber-500" /> :
                 <Circle className="w-5 h-5 text-gray-300" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{hw.title}</p>
                  <p className="text-xs text-gray-500">{hw.subject} · {hw.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">Расписание</h2>
            <Link to="/dashboard/schedule" className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1">
              Неделя <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {schedule.slice(0, 3).map((day) => (
              <div key={day.day} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{day.day}</p>
                  <p className="text-xs text-gray-500">{day.lessons.length} занятий</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-gray-900">Уведомления</h2>
          <Link to="/dashboard/notifications" className="text-sm text-red-600 hover:text-red-700">Все</Link>
        </div>
        <div className="space-y-3">
          {notifications.slice(0, 3).map((n) => (
            <div key={n.id} className="flex gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-500">{n.text} · {n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
