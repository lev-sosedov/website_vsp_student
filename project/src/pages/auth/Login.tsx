import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Phone,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState('+7');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');

    if (!digits) {
      return '+7';
    }

    let normalizedDigits = digits;

    if (normalizedDigits.startsWith('8')) {
      normalizedDigits = `7${normalizedDigits.slice(1)}`;
    }

    if (!normalizedDigits.startsWith('7')) {
      normalizedDigits = `7${normalizedDigits}`;
    }

    return `+${normalizedDigits.slice(0, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(normalizePhone(value));
    setError('');
  };

  const validateForm = () => {
    const phoneDigits = phoneNumber.replace(/\D/g, '');

    if (phoneDigits.length !== 11) {
      setError('Введите корректный номер телефона');
      return false;
    }

    if (!password) {
      setError('Введите пароль');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const result = await login(phoneNumber, password);

      if (result.success) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setError(result.error || 'Неверный номер телефона или пароль');
    } catch {
      setError('Не удалось выполнить вход. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Link
        to="/"
        className="
          mb-8 inline-flex items-center gap-2
          text-sm font-medium text-gray-500
          transition-colors hover:text-red-600
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Вернуться на сайт
      </Link>

      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-600">
          Личный кабинет
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Вход
        </h1>

        <p className="mt-3 text-base leading-6 text-gray-500">
          Введите номер телефона и пароль, чтобы продолжить.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="
            mb-5 rounded-xl border border-red-200
            bg-red-50 px-4 py-3
            text-sm text-red-700
          "
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="phoneNumber"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Номер телефона
          </label>

          <div className="relative">
            <Phone
              className="
                pointer-events-none absolute left-4 top-1/2
                h-5 w-5 -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(event) => handlePhoneChange(event.target.value)}
              placeholder="+79991234567"
              disabled={loading}
              className="
                h-12 w-full rounded-xl border border-gray-200
                bg-white pl-12 pr-4
                text-base text-gray-900 outline-none
                transition
                placeholder:text-gray-400
                hover:border-gray-300
                focus:border-red-500
                focus:ring-4 focus:ring-red-100
                disabled:cursor-not-allowed disabled:bg-gray-50
              "
              required
            />
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Например: +79991234567
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Пароль
            </label>

            <Link
              to="/forgot-password"
              className="
                text-sm font-medium text-red-600
                transition-colors hover:text-red-700
              "
            >
              Забыли пароль?
            </Link>
          </div>

          <div className="relative">
            <Lock
              className="
                pointer-events-none absolute left-4 top-1/2
                h-5 w-5 -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Введите пароль"
              disabled={loading}
              className="
                h-12 w-full rounded-xl border border-gray-200
                bg-white pl-12 pr-12
                text-base text-gray-900 outline-none
                transition
                placeholder:text-gray-400
                hover:border-gray-300
                focus:border-red-500
                focus:ring-4 focus:ring-red-100
                disabled:cursor-not-allowed disabled:bg-gray-50
              "
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="
                absolute right-4 top-1/2
                -translate-y-1/2 text-gray-400
                transition-colors hover:text-gray-700
              "
              aria-label={
                showPassword ? 'Скрыть пароль' : 'Показать пароль'
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            flex h-12 w-full items-center justify-center gap-2
            rounded-xl bg-red-600
            px-5 text-sm font-semibold text-white
            transition
            hover:bg-red-700
            focus:outline-none focus:ring-4 focus:ring-red-200
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {loading ? (
            <>
              <span
                className="
                  h-4 w-4 animate-spin rounded-full
                  border-2 border-white/40 border-t-white
                "
              />
              Выполняется вход...
            </>
          ) : (
            <>
              Войти
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs uppercase tracking-wider text-gray-400">
          или
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm text-gray-600">
          Ещё нет личного кабинета?
        </p>

        <Link
          to="/register"
          className="
            mt-3 inline-flex items-center justify-center
            font-semibold text-red-600
            transition-colors hover:text-red-700
          "
        >
          Зарегистрироваться
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-gray-400">
        Продолжая работу, вы соглашаетесь с{' '}
        <Link
          to="/terms"
          className="text-gray-500 underline hover:text-red-600"
        >
          пользовательским соглашением
        </Link>{' '}
        и{' '}
        <Link
          to="/privacy"
          className="text-gray-500 underline hover:text-red-600"
        >
          политикой конфиденциальности
        </Link>
        .
      </p>
    </div>
  );
}