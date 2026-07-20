import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Phone,
  User,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+7');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agree, setAgree] = useState(false);
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
    const trimmedUserName = userName.trim();
    const phoneDigits = phoneNumber.replace(/\D/g, '');

    if (trimmedUserName.length < 2) {
      setError('Введите имя пользователя');
      return false;
    }

    if (phoneDigits.length !== 11) {
      setError('Введите корректный номер телефона');
      return false;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return false;
    }

    if (!/[A-ZА-ЯЁ]/.test(password)) {
      setError('Пароль должен содержать хотя бы одну заглавную букву');
      return false;
    }

    if (!/[a-zа-яё]/.test(password)) {
      setError('Пароль должен содержать хотя бы одну строчную букву');
      return false;
    }

    if (!/\d/.test(password)) {
      setError('Пароль должен содержать хотя бы одну цифру');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }

    if (!agree) {
      setError('Необходимо согласиться с условиями регистрации');
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

      const result = await register({
        phone_number: phoneNumber,
        password,
        user_name: userName.trim(),
      });

      if (result.success) {
        navigate('/login', {
          replace: true,
          state: {
            registrationSuccess: true,
            phoneNumber,
          },
        });

        return;
      }

      setError(result.error || 'Не удалось создать аккаунт');
    } catch {
      setError('Ошибка соединения с сервером. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Верхняя навигация */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="
            inline-flex items-center gap-2
            text-sm font-medium text-gray-500
            transition-colors hover:text-red-600
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться на сайт
        </Link>

        <Link
          to="/login"
          className="
            inline-flex items-center gap-1.5
            text-sm font-semibold text-red-600
            transition-colors hover:text-red-700
          "
        >
          Войти
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Заголовок */}
      <div className="mb-5">
        <p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-red-600">
          ВШП Студент
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Создание аккаунта
        </h1>

        <p className="mt-2 text-sm leading-5 text-gray-500 sm:text-base">
          Заполните данные, чтобы зарегистрироваться в системе.
        </p>
      </div>

      {/* Ошибка */}
      {error && (
        <div
          role="alert"
          className="
            mb-4 rounded-xl border border-red-200
            bg-red-50 px-4 py-3
            text-sm text-red-700
          "
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Имя пользователя */}
        <div>
          <label
            htmlFor="userName"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Имя пользователя
          </label>

          <div className="relative">
            <User
              className="
                pointer-events-none absolute left-4 top-1/2
                h-5 w-5 -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="userName"
              name="userName"
              type="text"
              autoComplete="name"
              value={userName}
              onChange={(event) => {
                setUserName(event.target.value);
                setError('');
              }}
              placeholder="Например, Александр"
              disabled={loading}
              minLength={2}
              maxLength={100}
              className="
                h-11 w-full rounded-xl border border-gray-200
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
        </div>

        {/* Номер телефона */}
        <div>
          <label
            htmlFor="phoneNumber"
            className="mb-1.5 block text-sm font-medium text-gray-700"
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
                h-11 w-full rounded-xl border border-gray-200
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

          <p className="mt-1.5 text-xs text-gray-400">
            В формате +79991234567
          </p>
        </div>

        {/* Пароль */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Пароль
          </label>

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
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Придумайте пароль"
              disabled={loading}
              className="
                h-11 w-full rounded-xl border border-gray-200
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

          <p className="mt-1.5 text-xs leading-4 text-gray-400">
            Минимум 8 символов, заглавная и строчная буквы, а также цифра.
          </p>
        </div>

        {/* Повтор пароля */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Повторите пароль
          </label>

          <div className="relative">
            <Lock
              className="
                pointer-events-none absolute left-4 top-1/2
                h-5 w-5 -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError('');
              }}
              placeholder="Повторите пароль"
              disabled={loading}
              className="
                h-11 w-full rounded-xl border border-gray-200
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
              onClick={() =>
                setShowConfirmPassword((current) => !current)
              }
              className="
                absolute right-4 top-1/2
                -translate-y-1/2 text-gray-400
                transition-colors hover:text-gray-700
              "
              aria-label={
                showConfirmPassword
                  ? 'Скрыть повторный пароль'
                  : 'Показать повторный пароль'
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Согласие */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => {
              setAgree(event.target.checked);
              setError('');
            }}
            disabled={loading}
            className="
              mt-1 h-4 w-4 shrink-0 rounded
              border-gray-300 text-red-600
              focus:ring-red-500
            "
          />

          <span className="text-sm leading-5 text-gray-500">
            Я принимаю{' '}
            <Link
              to="/terms"
              className="font-medium text-red-600 hover:text-red-700"
            >
              пользовательское соглашение
            </Link>{' '}
            и даю согласие на{' '}
            <Link
              to="/personal-data"
              className="font-medium text-red-600 hover:text-red-700"
            >
              обработку персональных данных
            </Link>
            .
          </span>
        </label>

        {/* Кнопка регистрации */}
        <button
          type="submit"
          disabled={loading}
          className="
            flex h-11 w-full items-center justify-center gap-2
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
              Создание аккаунта...
            </>
          ) : (
            <>
              Зарегистрироваться
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}