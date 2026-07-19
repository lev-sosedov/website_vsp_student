import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Проверьте почту</h1>
        <p className="text-gray-500 mb-8">
          Инструкции по восстановлению пароля отправлены на {email}
        </p>
        <Link to="/login" className="btn-primary justify-center">
          Вернуться к входу
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Забыли пароль?</h1>
      <p className="text-gray-500 mb-8">
        Введите email — мы отправим инструкции для восстановления доступа.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
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

        <button type="submit" className="btn-primary w-full justify-center">
          Восстановить <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Вспомнили пароль?{' '}
        <Link to="/login" className="text-red-600 font-medium hover:text-red-700">
          Войти
        </Link>
      </p>
    </div>
  );
}
