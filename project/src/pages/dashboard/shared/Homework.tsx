import { CheckCircle2, Clock, Circle, BookOpen } from 'lucide-react';
import { homework } from '../../../data/dashboardData';

export default function Homework() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Домашние задания</h1>
        <p className="text-gray-500 mt-1">Все ваши задания и их статусы</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Circle className="w-5 h-5 text-gray-400" />
            <div><p className="text-xl font-bold text-gray-900">2</p><p className="text-xs text-gray-500">Ожидают</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div><p className="text-xl font-bold text-gray-900">1</p><p className="text-xs text-gray-500">Сдано</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div><p className="text-xl font-bold text-gray-900">1</p><p className="text-xs text-gray-500">Оценено</p></div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="space-y-3">
          {homework.map((hw) => (
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
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> {hw.subject} · Срок: {hw.due}
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                hw.status === 'graded' ? 'bg-green-50 text-green-600' :
                hw.status === 'submitted' ? 'bg-amber-50 text-amber-600' :
                'bg-gray-50 text-gray-500'
              }`}>
                {hw.status === 'graded' ? 'Оценено' : hw.status === 'submitted' ? 'Сдано' : 'Ожидает'}
              </span>
              {hw.status === 'pending' && (
                <button className="btn-primary text-xs py-2 px-3">Сдать</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
