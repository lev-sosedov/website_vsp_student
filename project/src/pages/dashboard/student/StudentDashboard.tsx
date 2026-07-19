import { Calendar, BookOpen, Bell, Clock, CheckCircle2, Circle, FileText, MessageSquare, TrendingUp, ArrowRight, GraduationCap, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../../../components/dashboard/StatCard';
import ProgressBar from '../../../components/dashboard/ProgressBar';
import { todaysLessons, homework, notifications, upcomingEvents, progressData, weeklyActivity } from '../../../data/dashboardData';

export default function StudentDashboard() {
  const maxActivity = Math.max(...weeklyActivity.map((d) => d.value));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Здравствуйте, Александр!</h1>
        <p className="text-gray-500 mt-1">Вот что у вас сегодня на повестке.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Средний балл" value="85%" change="+5%" trend="up" icon={TrendingUp} color="green" />
        <StatCard label="Посещаемость" value="95%" icon={CheckCircle2} color="blue" />
        <StatCard label="Активные задания" value="3" icon={BookOpen} color="amber" />
        <StatCard label="Завершено курсов" value="2" icon={Award} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's lessons */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">Сегодняшние занятия</h2>
            <Link to="/dashboard/schedule" className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1">
              Расписание <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {todaysLessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-red-50 rounded-xl flex-shrink-0">
                  <span className="text-xs text-red-600 font-medium">{lesson.time.split(':')[0]}:{lesson.time.split(':')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{lesson.subject}</p>
                  <p className="text-xs text-gray-500">{lesson.teacher} · {lesson.room}</p>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">{lesson.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">Уведомления</h2>
            <Link to="/dashboard/notifications" className="text-sm text-red-600 hover:text-red-700">
              Все
            </Link>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="flex gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-red-600" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Homework */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">Ближайшие задания</h2>
            <Link to="/dashboard/homework" className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1">
              Все задания <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {homework.slice(0, 3).map((hw) => (
              <div key={hw.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                {hw.status === 'graded' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : hw.status === 'submitted' ? (
                  <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{hw.title}</p>
                  <p className="text-xs text-gray-500">{hw.subject} · {hw.due}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                  hw.status === 'graded' ? 'bg-green-50 text-green-600' :
                  hw.status === 'submitted' ? 'bg-amber-50 text-amber-600' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {hw.status === 'graded' ? 'Оценено' : hw.status === 'submitted' ? 'Сдано' : 'Ожидает'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="card p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-5">Ближайшие события</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-50 rounded-xl flex-shrink-0">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.date} · {event.time}</p>
                  <p className="text-xs text-gray-400">{event.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress */}
        <div className="card p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-5">Прогресс по курсам</h2>
          <div className="space-y-4">
            {progressData.map((p) => (
              <ProgressBar key={p.subject} label={p.subject} value={p.value} />
            ))}
          </div>
        </div>

        {/* Weekly activity */}
        <div className="card p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-5">Активность за неделю</h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {weeklyActivity.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-100 rounded-lg overflow-hidden flex items-end" style={{ height: '120px' }}>
                  <div
                    className="w-full bg-red-500 rounded-lg transition-all duration-500 hover:bg-red-600"
                    style={{ height: `${(d.value / maxActivity) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-5">Быстрые действия</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: BookOpen, label: 'Домашние задания', to: '/dashboard/homework' },
            { icon: FileText, label: 'Материалы', to: '/dashboard/materials' },
            { icon: MessageSquare, label: 'Сообщения', to: '/dashboard/messages' },
            { icon: GraduationCap, label: 'Успеваемость', to: '/dashboard/progress' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all group"
            >
              <action.icon className="w-6 h-6 text-gray-400 group-hover:text-red-600 transition-colors" />
              <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
