import { Bell } from 'lucide-react';
import { notifications } from '../../../data/dashboardData';

const typeColor: Record<string, string> = {
  homework: 'bg-amber-50 text-amber-600',
  grade: 'bg-green-50 text-green-600',
  schedule: 'bg-blue-50 text-blue-600',
  message: 'bg-red-50 text-red-600',
};

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
        <p className="text-gray-500 mt-1">Все ваши оповещения</p>
      </div>

      <div className="card p-6">
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor[n.type] || 'bg-gray-50 text-gray-600'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-500">{n.text}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
