import {
  Loader2,
  X,
} from 'lucide-react';

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import type {
  UserProfile,
} from '../../../api/userApi';

export interface AdminStudentFormValues {
  phoneNumber: string;
  firstName: string;
  userName: string;
  lastName: string;
  email: string;
  birthday: string;
  about: string;
}

interface AdminStudentFormModalProps {
  isOpen: boolean;
  student: UserProfile | null;
  entityLabel?: string;
  aboutLabel?: string;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: AdminStudentFormValues
  ) => Promise<void>;
}

const EMPTY_FORM: AdminStudentFormValues = {
  phoneNumber: '',
  firstName: '',
  userName: '',
  lastName: '',
  email: '',
  birthday: '',
  about: '',
};

export default function AdminStudentFormModal({
  isOpen,
  student,
  entityLabel = 'студента',
  aboutLabel = 'О студенте',
  isSaving,
  error,
  onClose,
  onSubmit,
}: AdminStudentFormModalProps) {
  const [form, setForm] =
    useState<AdminStudentFormValues>(
      EMPTY_FORM
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(
      student
        ? {
            phoneNumber:
              student.phone_number ?? '',
            firstName:
              student.first_name ?? '',
            userName:
              student.user_name ?? '',
            lastName:
              student.last_name ?? '',
            email: student.email ?? '',
            birthday:
              student.birthday?.slice(0, 10) ??
              '',
            about: student.about ?? '',
          }
        : EMPTY_FORM
    );
  }, [isOpen, student]);

  if (!isOpen) {
    return null;
  }

  const updateField = (
    field: keyof AdminStudentFormValues,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    void onSubmit(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {student
                ? `Изменить ${entityLabel}`
                : `Создать ${entityLabel}`}
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Профиль пользователя в User Service
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 overflow-y-auto p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Фамилия
              </span>
              <input
                value={form.firstName}
                onChange={(event) =>
                  updateField(
                    'firstName',
                    event.target.value
                  )
                }
                required
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Имя
              </span>
              <input
                value={form.userName}
                onChange={(event) =>
                  updateField(
                    'userName',
                    event.target.value
                  )
                }
                required
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Отчество
              </span>
              <input
                value={form.lastName}
                onChange={(event) =>
                  updateField(
                    'lastName',
                    event.target.value
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Телефон
              </span>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(event) =>
                  updateField(
                    'phoneNumber',
                    event.target.value
                  )
                }
                required
                placeholder="+79991234567"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    'email',
                    event.target.value
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Дата рождения
              </span>
              <input
                type="date"
                value={form.birthday}
                onChange={(event) =>
                  updateField(
                    'birthday',
                    event.target.value
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">
              {aboutLabel}
            </span>
            <textarea
              value={form.about}
              onChange={(event) =>
                updateField(
                  'about',
                  event.target.value
                )
              }
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
          </label>

          {!student && (
            <p className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700">
              Здесь создаётся профиль {entityLabel}.
              Пароль и данные входа управляются
              через Auth Service.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:bg-red-300"
            >
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {student
                ? 'Сохранить изменения'
                : `Создать ${entityLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
