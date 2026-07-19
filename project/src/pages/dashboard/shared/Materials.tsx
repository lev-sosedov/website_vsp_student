import { FileText, Video, NotebookPen, Download } from 'lucide-react';
import { materials } from '../../../data/dashboardData';

export default function Materials() {
  const iconMap: Record<string, any> = { PDF: FileText, Видео: Video, Ноутбук: NotebookPen };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Материалы занятий</h1>
        <p className="text-gray-500 mt-1">Лекции, презентации и записи</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((m) => {
          const Icon = iconMap[m.type] || FileText;
          return (
            <div key={m.id} className="card p-5 group hover:-translate-y-0.5 transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-snug">{m.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{m.subject}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium text-gray-600">{m.type}</span>
                  <span>·</span>
                  <span>{m.size}</span>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
