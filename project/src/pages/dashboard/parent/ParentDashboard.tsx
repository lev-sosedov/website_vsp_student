import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, CheckCircle2, Clock3, GraduationCap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  loadParentChildProgress,
  loadParentProgressChildren,
  type ParentProgressChild,
  type ParentProgressData,
} from '../../../services/parentProgressService';

const EMPTY: ParentProgressData = {
  groups: [], homeworkItems: [], attendanceItems: [], hasActiveGroup: false, warnings: [],
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const parentId = Number(user?.id ?? 0);
  const [children, setChildren] = useState<ParentProgressChild[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [data, setData] = useState<ParentProgressData>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadParentProgressChildren(parentId).then((items) => {
      if (!active) return;
      setChildren(items);
      setSelectedId(items[0]?.id ?? null);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить детей');
    });
    return () => { active = false; };
  }, [parentId]);

  useEffect(() => {
    if (selectedId === null) { setData(EMPTY); return; }
    let active = true;
    void loadParentChildProgress(selectedId).then((result) => {
      if (active) setData(result);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить данные ребёнка');
    });
    return () => { active = false; };
  }, [selectedId]);

  const selected = children.find((child) => child.id === selectedId);
  const average = data.homeworkItems.length
    ? Math.round(data.homeworkItems.reduce((sum, item) => sum + (item.submission?.score ?? 0), 0) / data.homeworkItems.length)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Личный кабинет родителя</h1>
          <p className="mt-1 text-gray-500">Данные загружаются из связанных учебных профилей.</p>
        </div>
        {children.length > 0 && (
          <label className="text-sm text-gray-600">Ребёнок
            <select className="ml-2 rounded-lg border border-gray-200 px-3 py-2" value={selectedId ?? ''} onChange={(event) => setSelectedId(Number(event.target.value))}>
              {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
            </select>
          </label>
        )}
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!selected ? <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500">Связанные дети не найдены.</div> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card p-5"><BookOpen className="h-5 w-5 text-red-600"/><p className="mt-3 text-sm text-gray-500">Средний результат</p><p className="text-2xl font-bold">{average === null ? '—' : `${average}%`}</p></div>
            <div className="card p-5"><CheckCircle2 className="h-5 w-5 text-green-600"/><p className="mt-3 text-sm text-gray-500">Посещаемость</p><p className="text-2xl font-bold">{data.attendanceItems.length}</p></div>
            <div className="card p-5"><GraduationCap className="h-5 w-5 text-violet-600"/><p className="mt-3 text-sm text-gray-500">Активные группы</p><p className="text-2xl font-bold">{data.groups.length}</p></div>
            <div className="card p-5"><Clock3 className="h-5 w-5 text-amber-600"/><p className="mt-3 text-sm text-gray-500">Задания</p><p className="text-2xl font-bold">{data.homeworkItems.length}</p></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6"><h2 className="mb-4 font-bold">Учебные группы</h2>{data.groups.length === 0 ? <p className="text-sm text-gray-500">Активных групп нет.</p> : <ul className="space-y-2">{data.groups.map((group) => <li key={group.id} className="rounded-lg bg-gray-50 p-3">{group.name}</li>)}</ul>}</section>
            <section className="card p-6"><h2 className="mb-4 font-bold">Последние задания</h2>{data.homeworkItems.length === 0 ? <p className="text-sm text-gray-500">Опубликованных заданий нет.</p> : <ul className="space-y-2">{data.homeworkItems.slice(0, 5).map((item) => <li key={item.homework.id} className="rounded-lg border border-gray-100 p-3"><p className="font-medium">{item.homework.title}</p><p className="text-xs text-gray-500">{item.groupName}</p></li>)}</ul>}</section>
          </div>
          <div className="flex gap-3 text-sm"><Link to="/dashboard/schedule" className="text-red-600 hover:underline"><CalendarDays className="mr-1 inline h-4 w-4"/>Расписание</Link><Link to="/dashboard/progress" className="text-red-600 hover:underline">Подробный прогресс</Link></div>
        </>
      )}
    </div>
  );
}
