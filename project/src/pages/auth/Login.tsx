import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Ошибка входа');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">С возвращением</h1>
      <p className="text-gray-500 mb-8">Войдите в свой личный кабинет</p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-10"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Пароль</label>
            <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-700">
              Забыли пароль?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10 pr-10"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? 'Вход...' : 'Войти'} <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-3">Демо-доступы (пароль: 123456):</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['student@vshp.kz', 'Студент'],
            ['parent@vshp.kz', 'Родитель'],
            ['teacher@vshp.kz', 'Учитель'],
            ['admin@vshp.kz', 'Админ'],
          ].map(([em, role]) => (
            <button
              key={em}
              onClick={() => { setEmail(em); setPassword('123456'); }}
              className="px-3 py-2 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 text-left"
            >
              <span className="font-medium text-gray-900">{role}</span>
              <br />
              <span className="text-gray-400">{em}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-red-600 font-medium hover:text-red-700">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
