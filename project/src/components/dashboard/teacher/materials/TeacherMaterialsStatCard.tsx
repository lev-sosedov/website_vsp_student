import type {
  LucideIcon,
} from 'lucide-react';

interface TeacherMaterialsStatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
}

export default function TeacherMaterialsStatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: TeacherMaterialsStatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </span>

        <span>
          <span className="block text-xl font-bold text-gray-900">
            {value}
          </span>

          <span className="block text-sm text-gray-500">
            {label}
          </span>
        </span>
      </div>
    </div>
  );
}
