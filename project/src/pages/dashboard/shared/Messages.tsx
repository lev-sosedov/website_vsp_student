import { Send, Search } from 'lucide-react';
import { useState } from 'react';
import { messages } from '../../../data/dashboardData';

export default function Messages() {
  const [active, setActive] = useState(messages[0]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Сообщения</h1>
        <p className="text-gray-500 mt-1">Общение с преподавателями и школой</p>
      </div>

      <div className="card overflow-hidden grid grid-cols-1 lg:grid-cols-3" style={{ minHeight: '500px' }}>
        {/* List */}
        <div className="border-r border-gray-100 lg:col-span-1">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input placeholder="Поиск..." className="bg-transparent text-sm outline-none flex-1" />
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {messages.map((m) => (
              <button
                key={m.id}
                onClick={() => setActive(m)}
                className={`w-full flex gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${active.id === m.id ? 'bg-red-50' : ''}`}
              >
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm flex-shrink-0">
                  {m.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                    <span className="text-xs text-gray-400">{m.time}</span>
                  </div>
                  <p className="text-xs text-gray-400">{m.role}</p>
                  <p className="text-xs text-gray-500 truncate mt-1">{m.preview}</p>
                </div>
                {m.unread && <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm">
              {active.name[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{active.name}</p>
              <p className="text-xs text-gray-400">{active.role}</p>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50/50">
            <div className="flex justify-start">
              <div className="max-w-md bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                <p className="text-sm text-gray-700">Здравствуйте! Проверил ваше последнее задание — отличная работа!</p>
                <p className="text-xs text-gray-400 mt-1">10:25</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-md bg-red-600 rounded-2xl rounded-tr-sm px-4 py-2.5">
                <p className="text-sm text-white">Спасибо большое! Старался применить все изученные паттерны.</p>
                <p className="text-xs text-white/70 mt-1">10:28</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-md bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                <p className="text-sm text-gray-700">{active.preview}</p>
                <p className="text-xs text-gray-400 mt-1">{active.time}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center gap-2">
            <input placeholder="Напишите сообщение..." className="input-field flex-1" />
            <button className="btn-primary px-4 py-3">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
