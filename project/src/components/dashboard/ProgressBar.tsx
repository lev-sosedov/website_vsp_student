interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export default function ProgressBar({ value, max = 100, color = 'bg-red-500', label, showValue = true }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-600">{label}</span>
          {showValue && <span className="text-sm font-semibold text-gray-900">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
