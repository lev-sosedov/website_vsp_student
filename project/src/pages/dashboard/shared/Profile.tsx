import { useAuth } from '../../../context/AuthContext';
import { Mail, Phone } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
        <p className="text-gray-500 mt-1">Ваши личные данные</p>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 font-bold text-2xl">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-gray-500 capitalize">{user.role === 'student' ? 'Студент' : user.role === 'parent' ? 'Родитель' : user.role === 'teacher' ? 'Преподаватель' : 'Администратор'}</p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-gray-400" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="w-4 h-4 text-gray-400" /> {user.phone}
                </div>
              )}
            </div>
          </div>
          <button className="btn-secondary text-sm">Редактировать</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
          <div>
            <label className="text-xs text-gray-400">Имя</label>
            <p className="text-sm font-medium text-gray-900 mt-1">{user.firstName}</p>
          </div>
          <div>
            <label className="text-xs text-gray-400">Фамилия</label>
            <p className="text-sm font-medium text-gray-900 mt-1">{user.lastName}</p>
          </div>
          <div>
            <label className="text-xs text-gray-400">Email</label>
            <p className="text-sm font-medium text-gray-900 mt-1">{user.email}</p>
          </div>
          <div>
            <label className="text-xs text-gray-400">Телефон</label>
            <p className="text-sm font-medium text-gray-900 mt-1">{user.phone || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
