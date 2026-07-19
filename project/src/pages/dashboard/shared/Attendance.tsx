import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { attendanceData } from '../../../data/dashboardData';

export default function Attendance() {
  const totalPresent = attendanceData.reduce((sum, m) => sum + m.present, 0);
  const totalAbsent = attendanceData.reduce((sum, m) => sum + m.absent, 0);
  const total = totalPresent + totalAbsent;
  const pct = Math.round((totalPresent / total) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Посещаемость</h1>
        <p className="text-gray-500 mt-1">Статистика посещения занятий</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div><p className="text-xl font-bold text-gray-900">{totalPresent}</p><p className="text-xs text-gray-500">Посещено</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <div><p className="text-xl font-bold text-gray-900">{totalAbsent}</p><p className="text-xs text-gray-500">Пропущено</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div><p className="text-xl font-bold text-gray-900">{pct}%</p><p className="text-xs text-gray-500">Посещаемость</p></div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-6">Посещаемость по месяцам</h2>
        <div className="space-y-4">
          {attendanceData.map((m) => {
            const total = m.present + m.absent;
            const presentPct = (m.present / total) * 100;
            return (
              <div key={m.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{m.month}</span>
                  <span className="text-xs text-gray-400">{m.present}/{total} занятий</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${presentPct}%` }} />
                  <div className="h-full bg-red-300 rounded-r-full" style={{ width: `${100 - presentPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
