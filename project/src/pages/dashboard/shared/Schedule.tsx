import { Calendar } from 'lucide-react';
import { schedule } from '../../../data/dashboardData';

export default function Schedule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Расписание</h1>
        <p className="text-gray-500 mt-1">Ваши занятия на неделю</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {schedule.map((day) => (
          <div key={day.day} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-red-600" />
              <h3 className="font-semibold text-gray-900">{day.day}</h3>
            </div>
            {day.lessons.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Нет занятий</p>
            ) : (
              <div className="space-y-3">
                {day.lessons.map((lesson, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="text-xs font-semibold text-red-600 w-12 pt-0.5">{lesson.time}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{lesson.subject}</p>
                      <p className="text-xs text-gray-500">{lesson.teacher} · {lesson.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
