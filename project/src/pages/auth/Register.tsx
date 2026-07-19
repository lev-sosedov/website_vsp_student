import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '',
  });
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (!agree) {
      setError('Необходимо согласиться с условиями');
      return;
    }
    setLoading(true);
    const res = await register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Ошибка регистрации');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Создать аккаунт</h1>
      <p className="text-gray-500 mb-8">Начните обучение в ВШП Студент</p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input className="input-field pl-10" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Александр" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Фамилия</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input className="input-field pl-10" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Иванов" required />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" className="input-field pl-10" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Телефон</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="tel" className="input-field pl-10" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+7 700 123 45 67" required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={show ? 'text' : 'password'} className="input-field pl-10 pr-10" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Повторите пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={show ? 'text' : 'password'} className="input-field pl-10" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} placeholder="••••••••" required />
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
          <span className="text-sm text-gray-500">
            Я согласен с <Link to="/privacy" className="text-red-600">политикой конфиденциальности</Link> и условиями использования
          </span>
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? 'Создание...' : 'Зарегистрироваться'} <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-red-600 font-medium hover:text-red-700">
          Войти
        </Link>
      </p>
    </div>
  );
}
