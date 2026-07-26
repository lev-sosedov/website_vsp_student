import {
  ArchiveRestore,
  Building2,
  Loader2,
  LockKeyhole,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import type { AdminBranchItem } from '../../../services/adminBranchesService';
import AdminBranchRooms from './AdminBranchRooms';

export interface AdminBranchFormValues {
  country: string;
  city: string;
  street: string;
  house: string;
  building: string;
  postalCode: string;
  phone: string;
  email: string;
}

interface AdminBranchModalProps {
  isOpen: boolean;
  item: AdminBranchItem | null;
  isSaving: boolean;
  activeAction: string | null;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    values: AdminBranchFormValues
  ) => Promise<void>;
  onDeactivate: () => Promise<void>;
  onRestore: () => Promise<void>;
  onDelete: () => Promise<void>;
}

const inputClassName =
  'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50';

export default function AdminBranchModal({
  isOpen,
  item,
  isSaving,
  activeAction,
  error,
  onClose,
  onSubmit,
  onDeactivate,
  onRestore,
  onDelete,
}: AdminBranchModalProps) {
  const [country, setCountry] =
    useState('Россия');
  const [city, setCity] =
    useState('Краснодар');
  const [street, setStreet] =
    useState('');
  const [house, setHouse] =
    useState('');
  const [building, setBuilding] =
    useState('');
  const [postalCode, setPostalCode] =
    useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const isBusy =
    isSaving || activeAction !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const address = item?.address;

    setCountry(
      address?.country?.trim() || 'Россия'
    );
    setCity(
      address?.city?.trim() || 'Краснодар'
    );
    setStreet(
      address?.street?.trim() ||
        address?.street_name?.trim() ||
        ''
    );
    setHouse(
      address?.house === null ||
        address?.house === undefined
        ? ''
        : String(address.house)
    );
    setBuilding(
      address?.building === null ||
        address?.building === undefined
        ? ''
        : String(address.building)
    );
    setPostalCode(
      address?.postal_code?.trim() || ''
    );
    setPhone(
      item?.branch.phone?.trim() || ''
    );
    setEmail(
      item?.branch.email?.trim() || ''
    );
  }, [isOpen, item]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    void onSubmit({
      country: country.trim(),
      city: city.trim(),
      street: street.trim(),
      house: house.trim(),
      building: building.trim(),
      postalCode: postalCode.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  };

  const isActive =
    item?.branch.is_active !== false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-3 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-branch-modal-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isBusy
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="admin-branch-modal-title"
                className="text-lg font-bold text-gray-900"
              >
                {item
                  ? 'Управление филиалом'
                  : 'Создание филиала'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {item
                  ? `Групп: ${item.groupCount} · студентов: ${item.studentCount} · преподавателей: ${item.teacherCount}`
                  : 'Сначала будет создан адрес, затем филиал'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Закрыть окно"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900">
              Адрес филиала
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Адрес создаётся и обновляется через Academic Service.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-gray-700">
                Страна
              </span>
              <input
                value={country}
                onChange={(event) =>
                  setCountry(event.target.value)
                }
                className={inputClassName}
                required
                disabled={isBusy}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Город
              </span>
              <input
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                className={inputClassName}
                required
                disabled={isBusy}
              />
            </label>

            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Улица
              </span>
              <input
                value={street}
                onChange={(event) =>
                  setStreet(event.target.value)
                }
                className={inputClassName}
                placeholder="Например, Зиповская"
                required
                disabled={isBusy}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Дом
              </span>
              <input
                value={house}
                onChange={(event) =>
                  setHouse(event.target.value)
                }
                className={inputClassName}
                required
                disabled={isBusy}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Корпус
              </span>
              <input
                value={building}
                onChange={(event) =>
                  setBuilding(
                    event.target.value
                  )
                }
                className={inputClassName}
                placeholder="Необязательно"
                disabled={isBusy}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Почтовый индекс
              </span>
              <input
                value={postalCode}
                onChange={(event) =>
                  setPostalCode(
                    event.target.value
                  )
                }
                className={inputClassName}
                placeholder="Необязательно"
                disabled={isBusy}
              />
            </label>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-900">
              Контакты филиала
            </h3>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-gray-700">
                Телефон
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                className={inputClassName}
                placeholder="+7..."
                disabled={isBusy}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-gray-700">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className={inputClassName}
                placeholder="branch@example.ru"
                required
                disabled={isBusy}
              />
              <p className="mt-1 text-xs text-gray-400">
                Email должен быть уникальным для каждого филиала.
              </p>
            </label>
          </div>

          {item ? (
            <AdminBranchRooms
              branchId={item.branch.id}
              branchIsActive={isActive}
            />
          ) : (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="font-semibold text-gray-900">
                Кабинеты филиала
              </h3>
              <p className="mt-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                Кабинеты можно добавить после
                создания филиала.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {item && isActive && (
                <button
                  type="button"
                  onClick={() =>
                    void onDeactivate()
                  }
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  {activeAction ===
                  'deactivate' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LockKeyhole className="h-4 w-4" />
                  )}
                  Закрыть филиал
                </button>
              )}

              {item && !isActive && (
                <button
                  type="button"
                  onClick={() =>
                    void onRestore()
                  }
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                >
                  {activeAction === 'restore' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArchiveRestore className="h-4 w-4" />
                  )}
                  Восстановить
                </button>
              )}

              {item && (
                <button
                  type="button"
                  onClick={() =>
                    void onDelete()
                  }
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {activeAction === 'delete' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Удалить филиал и адрес
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={
                isBusy ||
                !country.trim() ||
                !city.trim() ||
                !street.trim() ||
                !house.trim() ||
                !email.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {item
                ? 'Сохранить изменения'
                : 'Создать филиал'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
