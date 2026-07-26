import { BookOpen } from 'lucide-react';

interface TeacherMaterialsEmptyStateProps {
  title: string;
  text: string;
}

export default function TeacherMaterialsEmptyState({
  title,
  text,
}: TeacherMaterialsEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <BookOpen className="mx-auto h-11 w-11 text-gray-300" />

      <h2 className="mt-4 font-semibold text-gray-900">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
        {text}
      </p>
    </div>
  );
}
