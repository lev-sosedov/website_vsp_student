import { TrendingUp, Award } from 'lucide-react';
import ProgressBar from '../../../components/dashboard/ProgressBar';
import { progressData, weeklyActivity } from '../../../data/dashboardData';

export default function Progress() {
  const avg = Math.round(progressData.reduce((s, p) => s + p.value, 0) / progressData.length);
  const maxActivity = Math.max(...weeklyActivity.map((d) => d.value));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Успеваемость</h1>
        <p className="text-gray-500 mt-1">Ваш прогресс по курсам и активность</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <div><p className="text-xl font-bold text-gray-900">{avg}%</p><p className="text-xs text-gray-500">Средний балл</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-500" />
            <div><p className="text-xl font-bold text-gray-900">3</p><p className="text-xs text-gray-500">Лучших работы</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div><p className="text-xl font-bold text-gray-900">+8%</p><p className="text-xs text-gray-500">За месяц</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-5">Прогресс по курсам</h2>
          <div className="space-y-4">
            {progressData.map((p) => (
              <ProgressBar key={p.subject} label={p.subject} value={p.value} />
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-5">Активность за неделю</h2>
          <div className="flex items-end justify-between gap-2 h-48">
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
      </div>
    </div>
  );
}
