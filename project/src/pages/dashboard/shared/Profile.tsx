import {
  Camera,
  Check,
  Loader2,
  Mail,
  Pencil,
  Phone,
  X,
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { uploadAvatarToCloudinary } from '../../../api/cloudinaryApi';

import {
  updateUserProfile,
  type UserProfileUpdate,
} from '../../../api/userApi';

import UserAvatar from '../../../components/common/UserAvatar';
import { useAuth } from '../../../context/AuthContext';

import {
  getUserDisplayName,
} from '../../../utils/userDisplayName';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

interface ProfileForm {
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  birthday: string;
  about: string;
}

const EMPTY_FORM: ProfileForm = {
  user_name: '',
  first_name: '',
  last_name: '',
  email: '',
  birthday: '',
  about: '',
};

const inputClassName =
  'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';

function getRoleLabel(role: string): string {
  switch (role) {
    case 'student':
      return 'Студент';
    case 'parent':
      return 'Родитель';
    case 'teacher':
      return 'Преподаватель';
    case 'admin':
      return 'Администратор';
    default:
      return role;
  }
}

// function getDisplayName(
//   role: string,
//   firstName: string | null,
//   lastName: string | null,
//   userName: string
// ): string {
//   if (role === 'teacher') {
//     const fullName = [userName, lastName]
//       .filter(Boolean)
//       .join(' ')
//       .trim();

//     return fullName || userName;
//   }

//   const fullName = [firstName, userName]
//     .filter(Boolean)
//     .join(' ')
//     .trim();

//   return fullName || userName;
// }

// function getInitials(
//   firstName: string | null,
//   lastName: string | null,
//   userName: string
// ): string {
//   const firstInitial = firstName?.trim()[0] ?? '';
//   const lastInitial = lastName?.trim()[0] ?? '';
//   const initials = `${firstInitial}${lastInitial}`.toUpperCase();

//   return initials || userName.trim()[0]?.toUpperCase() || '?';
// }

function getErrorMessage(
  error: unknown,
  fallback = 'Не удалось выполнить действие'
): string {
  return error instanceof Error ? error.message : fallback;
}

function normalizeOptionalValue(value: string): string | null {
  const normalizedValue = value.trim();
  return normalizedValue || null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] =
    useState(false);
  const [avatarError, setAvatarError] =
    useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] =
    useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] =
    useState<ProfileForm>(EMPTY_FORM);
  const [profileError, setProfileError] =
    useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] =
    useState<string | null>(null);

  useEffect(() => {
    if (!user || isEditing) {
      return;
    }

    setForm({
      user_name: user.user_name ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
      birthday: user.birthday ?? '',
      about: user.about ?? '',
    });
  }, [user, isEditing]);

  if (!user) {
    return null;
  }

  const displayName = getUserDisplayName(user);

  const openAvatarPicker = () => {
    if (!isUploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setAvatarError(null);
    setAvatarSuccess(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError(
        'Выберите изображение JPG, PNG или WEBP'
      );
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError(
        'Размер изображения не должен превышать 5 МБ'
      );
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const cloudinaryResult =
        await uploadAvatarToCloudinary(file);

      await updateUserProfile(user.id, {
        avatar_url: cloudinaryResult.secure_url,
      });

      const refreshResult = await refreshProfile();

      if (!refreshResult.success) {
        throw new Error(
          refreshResult.error ??
            'Аватар загружен, но профиль не обновился'
        );
      }

      setAvatarSuccess('Аватарка успешно обновлена');
    } catch (error) {
      console.error(
        'Ошибка обновления аватарки:',
        error
      );

      setAvatarError(
        getErrorMessage(
          error,
          'Не удалось изменить аватарку'
        )
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const fillFormFromUser = () => {
    setForm({
      user_name: user.user_name ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
      birthday: user.birthday ?? '',
      about: user.about ?? '',
    });
  };

  const startEditing = () => {
    fillFormFromUser();
    setProfileError(null);
    setProfileSuccess(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    fillFormFromUser();
    setProfileError(null);
    setIsEditing(false);
  };

  const updateFormField = (
    field: keyof ProfileForm,
    value: string
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleSaveProfile = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setProfileError(null);
    setProfileSuccess(null);

    const userName = form.user_name.trim();
    const email = form.email.trim();

    if (!userName) {
      setProfileError(
        'Имя пользователя не может быть пустым'
      );
      return;
    }

    if (userName.length > 50) {
      setProfileError(
        'Имя пользователя не должно превышать 50 символов'
      );
      return;
    }

    if (form.first_name.trim().length > 100) {
      setProfileError(
        'Имя не должно превышать 100 символов'
      );
      return;
    }

    if (form.last_name.trim().length > 100) {
      setProfileError(
        'Фамилия не должна превышать 100 символов'
      );
      return;
    }

    if (email && !isValidEmail(email)) {
      setProfileError('Введите корректный email');
      return;
    }

    if (form.about.length > 1000) {
      setProfileError(
        'Текст «О себе» не должен превышать 1000 символов'
      );
      return;
    }

    const updateData: UserProfileUpdate = {
      user_name: userName,
      first_name: normalizeOptionalValue(
        form.first_name
      ),
      last_name: normalizeOptionalValue(
        form.last_name
      ),
      email: normalizeOptionalValue(form.email),
      birthday: form.birthday || null,
      about: normalizeOptionalValue(form.about),
    };

    setIsSaving(true);

    try {
      await updateUserProfile(user.id, updateData);

      const refreshResult = await refreshProfile();

      if (!refreshResult.success) {
        throw new Error(
          refreshResult.error ??
            'Данные сохранены, но профиль не обновился'
        );
      }

      setIsEditing(false);
      setProfileSuccess('Профиль успешно обновлён');
    } catch (error) {
      console.error(
        'Ошибка обновления профиля:',
        error
      );

      setProfileError(
        getErrorMessage(
          error,
          'Не удалось обновить профиль'
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Профиль
        </h1>
        <p className="mt-1 text-gray-500">
          Ваши личные данные
        </p>
      </div>

      <div className="card p-6">
        <div className="flex flex-col items-start gap-6 border-b border-gray-100 pb-6 sm:flex-row">
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={openAvatarPicker}
              disabled={isUploadingAvatar}
              className="group relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-red-50 text-2xl font-bold text-red-600 transition disabled:cursor-not-allowed disabled:opacity-70"
              title="Изменить аватарку"
              aria-label="Изменить аватарку"
            >
              <UserAvatar
                avatarUrl={user.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
              />

              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={openAvatarPicker}
              disabled={isUploadingAvatar}
              className="text-xs font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {isUploadingAvatar
                ? 'Загрузка...'
                : 'Изменить фото'}
            </button>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {displayName}
            </h2>

            <p className="text-sm text-gray-500">
              {getRoleLabel(user.role)}
            </p>

            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>
                  {user.email || 'Email не указан'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>
                  {user.phone_number ||
                    'Телефон не указан'}
                </span>
              </div>
            </div>

            {avatarError && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {avatarError}
              </div>
            )}

            {avatarSuccess && (
              <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {avatarSuccess}
              </div>
            )}
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Pencil className="h-4 w-4" />
              Редактировать
            </button>
          )}
        </div>

        {profileError && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {profileError}
          </div>
        )}

        {profileSuccess && !isEditing && (
          <div className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {profileSuccess}
          </div>
        )}

        {isEditing ? (
          <form
            onSubmit={handleSaveProfile}
            className="pt-6"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-first-name"
                  className="text-xs font-medium text-gray-500"
                >
                  Имя
                </label>
                <input
                  id="profile-first-name"
                  type="text"
                  value={form.first_name}
                  onChange={(event) =>
                    updateFormField(
                      'first_name',
                      event.target.value
                    )
                  }
                  maxLength={100}
                  disabled={isSaving}
                  className={inputClassName}
                  placeholder="Введите имя"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-last-name"
                  className="text-xs font-medium text-gray-500"
                >
                  Фамилия
                </label>
                <input
                  id="profile-last-name"
                  type="text"
                  value={form.last_name}
                  onChange={(event) =>
                    updateFormField(
                      'last_name',
                      event.target.value
                    )
                  }
                  maxLength={100}
                  disabled={isSaving}
                  className={inputClassName}
                  placeholder="Введите фамилию"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-user-name"
                  className="text-xs font-medium text-gray-500"
                >
                  Имя пользователя
                </label>
                <input
                  id="profile-user-name"
                  type="text"
                  value={form.user_name}
                  onChange={(event) =>
                    updateFormField(
                      'user_name',
                      event.target.value
                    )
                  }
                  maxLength={50}
                  required
                  disabled={isSaving}
                  className={inputClassName}
                  placeholder="Введите имя пользователя"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="text-xs font-medium text-gray-500"
                >
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateFormField(
                      'email',
                      event.target.value
                    )
                  }
                  maxLength={255}
                  disabled={isSaving}
                  className={inputClassName}
                  placeholder="example@mail.ru"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-phone"
                  className="text-xs font-medium text-gray-500"
                >
                  Телефон
                </label>
                <input
                  id="profile-phone"
                  type="text"
                  value={user.phone_number || ''}
                  disabled
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Изменение телефона будет добавлено отдельно
                </p>
              </div>

              <div>
                <label
                  htmlFor="profile-birthday"
                  className="text-xs font-medium text-gray-500"
                >
                  Дата рождения
                </label>
                <input
                  id="profile-birthday"
                  type="date"
                  value={form.birthday}
                  onChange={(event) =>
                    updateFormField(
                      'birthday',
                      event.target.value
                    )
                  }
                  disabled={isSaving}
                  className={inputClassName}
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="profile-about"
                    className="text-xs font-medium text-gray-500"
                  >
                    О себе
                  </label>
                  <span className="text-xs text-gray-400">
                    {form.about.length} / 1000
                  </span>
                </div>

                <textarea
                  id="profile-about"
                  value={form.about}
                  onChange={(event) =>
                    updateFormField(
                      'about',
                      event.target.value
                    )
                  }
                  maxLength={1000}
                  rows={5}
                  disabled={isSaving}
                  className={`${inputClassName} resize-y`}
                  placeholder="Расскажите немного о себе"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="btn-secondary inline-flex items-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Отмена
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isSaving
                  ? 'Сохранение...'
                  : 'Сохранить'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
            <div>
              <label className="text-xs text-gray-400">
                Имя
              </label>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {user.first_name || '—'}
              </p>
            </div>

                        <div>
              <label className="text-xs text-gray-400">
                Email
              </label>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {user.email || '—'}
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-400">
                Имя пользователя
              </label>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {user.user_name || '—'}
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-400">
                Телефон
              </label>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {user.phone_number || '—'}
              </p>
            </div>
            
                        <div>
              <label className="text-xs text-gray-400">
                Отчество
              </label>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {user.last_name || '—'}
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-400">
                Дата рождения
              </label>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {user.birthday || '—'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400">
                О себе
              </label>

              <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-gray-900">
                {user.about || '—'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
