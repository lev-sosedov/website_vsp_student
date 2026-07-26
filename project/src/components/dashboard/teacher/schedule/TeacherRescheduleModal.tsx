import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  CalendarClock,
  Loader2,
  X,
} from 'lucide-react';

import type {
  LessonReschedule,
  LessonSchedule,
  Room,
} from '../../../../api/scheduleApi';

interface TeacherRescheduleModalProps {
  lesson: LessonSchedule | null;
  rooms: Room[];
  teacherId: number;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: LessonReschedule) => Promise<void>;
}

export default function TeacherRescheduleModal({
  lesson,
  rooms,
  teacherId,
  isSaving,
  error,
  onClose,
  onSubmit,
}: TeacherRescheduleModalProps) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomId, setRoomId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!lesson) {
      return;
    }

    setDate(lesson.lesson_date);
    setStartTime(lesson.start_time.slice(0, 5));
    setEndTime(lesson.end_time.slice(0, 5));
    setRoomId(String(lesson.room_id));
    setReason('');
  }, [lesson]);

  if (!lesson) {
    return null;
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await onSubmit({
      lesson_date: date,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      room_id: Number(roomId),
      teacher_id: teacherId,
      changed_by: teacherId,
      reason: reason.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            <h2
              id="reschedule-title"
              className="text-lg font-bold text-gray-900"
            >
              Перенести занятие
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Новая дата
            </span>
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Начало
            </span>
            <input
              required
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Окончание
            </span>
            <input
              required
              type="time"
              value={endTime}
              onChange={(event) =>
                setEndTime(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Кабинет
            </span>
            <select
              required
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Причина переноса
            </span>
            <textarea
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
            />
          </label>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={
              isSaving ||
              !reason.trim() ||
              endTime <= startTime
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isSaving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Перенести
          </button>
        </div>
      </form>
    </div>
  );
}
