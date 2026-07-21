import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';

interface HomeworkStatsProps {
  pendingCount: number;
  submittedCount: number;
  gradedCount: number;
  overdueCount: number;
}

export default function HomeworkStats({
  pendingCount,
  submittedCount,
  gradedCount,
  overdueCount,
}: HomeworkStatsProps) {
  const stats = [
    {
      label: 'Ожидают',
      value: pendingCount,
      icon: Circle,
      iconClass: 'text-gray-400',
      backgroundClass: 'bg-gray-100',
    },
    {
      label: 'Сдано',
      value: submittedCount,
      icon: Clock,
      iconClass: 'text-amber-600',
      backgroundClass: 'bg-amber-50',
    },
    {
      label: 'Оценено',
      value: gradedCount,
      icon: CheckCircle2,
      iconClass: 'text-green-600',
      backgroundClass: 'bg-green-50',
    },
    {
      label: 'Просрочено',
      value: overdueCount,
      icon: AlertTriangle,
      iconClass: 'text-red-600',
      backgroundClass: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="card p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.backgroundClass}`}
              >
                <Icon
                  className={`h-5 w-5 ${stat.iconClass}`}
                />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>

                <p className="text-sm text-gray-500">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}