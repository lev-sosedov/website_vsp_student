import {
  Bell,
  BookOpen,
  Calendar,
  Camera,
  Check,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Newspaper,
  Pencil,
  Phone,
  Settings,
  Smartphone,
  UserRound,
  X,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import {
  changePassword,
} from '../../../api/authApi';

import {
  uploadAvatarToCloudinary,
} from '../../../api/cloudinaryApi';

import {
  getNotificationPreference,
  updateNotificationPreference,
  type NotificationPreference,
  type NotificationPreferenceBooleanField,
} from '../../../api/notificationApi';

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

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type ProfileTab = 'personal' | 'settings';

const EMPTY_FORM: ProfileForm = {
  user_name: '',
  first_name: '',
  last_name: '',
  email: '',
  birthday: '',
  about: '',
};

const EMPTY_PASSWORD_FORM: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const inputClassName =
  'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';

function getRoleLabel(role: string): string {
  switch (role.trim().toLowerCase()) {
    case 'student':
      return 'Студент';
    case 'parent':
      return 'Родитель';
    case 'teacher':
      return 'Преподаватель';
    case 'admin':
      return 'Администратор';
    case 'user':
      return 'Пользователь';
    default:
      return role;
  }
}

function getErrorMessage(
  error: unknown,
  fallback = 'Не удалось выполнить действие'
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function normalizeOptionalValue(
  value: string
): string | null {
  const normalizedValue = value.trim();
  return normalizedValue || null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatBirthday(
  birthday: string | null
): string {
  if (!birthday) {
    return '—';
  }

  const date = new Date(`${birthday}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return birthday;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  icon: typeof Bell;
  onChange: () => void;
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  icon: Icon,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-red-50 p-2 text-red-600">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {title}
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={onChange}
        disabled={disabled}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-red-600' : 'bg-gray-200'
        } disabled:cursor-wait disabled:opacity-60`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] =
    useState<ProfileTab>('personal');

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

  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [isChangingPassword, setIsChangingPassword] =
    useState(false);
  const [passwordError, setPasswordError] =
    useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] =
    useState<string | null>(null);

  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] =
    useState(false);
  const [savingPreferenceField, setSavingPreferenceField] =
    useState<NotificationPreferenceBooleanField | null>(null);
  const [preferencesError, setPreferencesError] =
    useState<string | null>(null);
  const [preferencesSuccess, setPreferencesSuccess] =
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

  const loadNotificationPreferences = useCallback(
    async () => {
      if (!user?.id) {
        return;
      }

      setIsLoadingPreferences(true);
      setPreferencesError(null);

      try {
        const preference =
          await getNotificationPreference(user.id);

        setNotificationPreference(preference);
      } catch (error) {
        console.error(
          'Ошибка загрузки настроек уведомлений:',
          error
        );

        setPreferencesError(
          getErrorMessage(
            error,
            'Не удалось загрузить настройки уведомлений'
          )
        );
      } finally {
        setIsLoadingPreferences(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (
      activeTab === 'settings' &&
      !notificationPreference &&
      !isLoadingPreferences
    ) {
      void loadNotificationPreferences();
    }
  }, [
    activeTab,
    notificationPreference,
    isLoadingPreferences,
    loadNotificationPreferences,
  ]);

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

      setAvatarSuccess('Фотография профиля обновлена');
    } catch (error) {
      console.error(
        'Ошибка обновления аватарки:',
        error
      );

      setAvatarError(
        getErrorMessage(
          error,
          'Не удалось изменить фотографию'
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
      setProfileError('Имя не может быть пустым');
      return;
    }

    if (userName.length > 50) {
      setProfileError(
        'Имя не должно превышать 50 символов'
      );
      return;
    }

    if (form.first_name.trim().length > 100) {
      setProfileError(
        'Фамилия не должна превышать 100 символов'
      );
      return;
    }

    if (form.last_name.trim().length > 100) {
      setProfileError(
        'Отчество не должно превышать 100 символов'
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

  const updatePasswordField = (
    field: keyof PasswordForm,
    value: string
  ) => {
    setPasswordForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleChangePassword = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.currentPassword) {
      setPasswordError('Введите текущий пароль');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(
        'Новый пароль должен содержать не менее 8 символов'
      );
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }

    if (
      passwordForm.currentPassword ===
      passwordForm.newPassword
    ) {
      setPasswordError(
        'Новый пароль должен отличаться от текущего'
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword({
        current_password:
          passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });

      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordSuccess('Пароль успешно изменён');
    } catch (error) {
      console.error(
        'Ошибка изменения пароля:',
        error
      );

      setPasswordError(
        getErrorMessage(
          error,
          'Не удалось изменить пароль'
        )
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTogglePreference = async (
    field: NotificationPreferenceBooleanField
  ) => {
    if (
      !notificationPreference ||
      savingPreferenceField
    ) {
      return;
    }

    setSavingPreferenceField(field);
    setPreferencesError(null);
    setPreferencesSuccess(null);

    try {
      const updatedPreference =
        await updateNotificationPreference(
          user.id,
          {
            [field]: !notificationPreference[field],
          }
        );

      setNotificationPreference(updatedPreference);
      setPreferencesSuccess('Настройки сохранены');
    } catch (error) {
      console.error(
        'Ошибка сохранения настроек уведомлений:',
        error
      );

      setPreferencesError(
        getErrorMessage(
          error,
          'Не удалось сохранить настройки уведомлений'
        )
      );
    } finally {
      setSavingPreferenceField(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Профиль
        </h1>
        <p className="mt-1 text-gray-500">
          Управление личными данными и настройками аккаунта
        </p>
      </div>

      <div className="card p-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={openAvatarPicker}
              disabled={isUploadingAvatar}
              className="group relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-red-50 text-2xl font-bold text-red-600 transition disabled:cursor-not-allowed disabled:opacity-70"
              title="Изменить фотографию"
              aria-label="Изменить фотографию"
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

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-gray-900">
              {displayName}
            </h2>

            <p className="text-sm text-gray-500">
              {getRoleLabel(user.role)}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{user.email || 'Email не указан'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>
                  {user.phone_number || 'Телефон не указан'}
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

          {activeTab === 'personal' && !isEditing && (
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
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'personal'
              ? 'border-red-600 bg-red-600 text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-600'
          }`}
        >
          <UserRound className="h-4 w-4" />
          Личная информация
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('settings');
            setIsEditing(false);
            setProfileError(null);
          }}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'settings'
              ? 'border-red-600 bg-red-600 text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-600'
          }`}
        >
          <Settings className="h-4 w-4" />
          Настройки
        </button>
      </div>

      {activeTab === 'personal' ? (
        <div className="card p-6">
          {profileError && (
            <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {profileError}
            </div>
          )}

          {profileSuccess && !isEditing && (
            <div className="mb-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {profileSuccess}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-first-name"
                    className="text-xs font-medium text-gray-500"
                  >
                    Фамилия
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
                    placeholder="Введите фамилию"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-user-name"
                    className="text-xs font-medium text-gray-500"
                  >
                    Имя
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
                    placeholder="Введите имя"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-last-name"
                    className="text-xs font-medium text-gray-500"
                  >
                    Отчество
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
                    placeholder="Введите отчество"
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
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs text-gray-400">
                  Фамилия
                </label>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user.first_name || '—'}
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-400">
                  Имя
                </label>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user.user_name || '—'}
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
                  Email
                </label>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user.email || '—'}
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
                  Дата рождения
                </label>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatBirthday(user.birthday)}
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
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Смена пароля
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Укажите текущий и новый пароль
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                {passwordSuccess}
              </div>
            )}

            <form
              onSubmit={handleChangePassword}
              className="mt-5 space-y-4"
            >
              <div>
                <label
                  htmlFor="current-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Текущий пароль
                </label>
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    updatePasswordField(
                      'currentPassword',
                      event.target.value
                    )
                  }
                  disabled={isChangingPassword}
                  className={inputClassName}
                  placeholder="Введите текущий пароль"
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Новый пароль
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    updatePasswordField(
                      'newPassword',
                      event.target.value
                    )
                  }
                  minLength={8}
                  maxLength={128}
                  disabled={isChangingPassword}
                  className={inputClassName}
                  placeholder="Не менее 8 символов"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Подтвердите новый пароль
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    updatePasswordField(
                      'confirmPassword',
                      event.target.value
                    )
                  }
                  minLength={8}
                  maxLength={128}
                  disabled={isChangingPassword}
                  className={inputClassName}
                  placeholder="Повторите новый пароль"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isChangingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {isChangingPassword
                  ? 'Обновление...'
                  : 'Обновить пароль'}
              </button>
            </form>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Настройки уведомлений
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Выберите каналы и события
                </p>
              </div>
            </div>

            {preferencesError && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{preferencesError}</p>
                <button
                  type="button"
                  onClick={() =>
                    void loadNotificationPreferences()
                  }
                  className="mt-2 font-semibold underline"
                >
                  Повторить
                </button>
              </div>
            )}

            {preferencesSuccess && (
              <div className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                {preferencesSuccess}
              </div>
            )}

            {isLoadingPreferences ? (
              <div className="flex min-h-64 flex-col items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-red-600" />
                <p className="mt-3 text-sm text-gray-500">
                  Загружаем настройки…
                </p>
              </div>
            ) : notificationPreference ? (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Каналы доставки
                </p>

                <ToggleRow
                  title="Уведомления в приложении"
                  description="Показывать уведомления в личном кабинете"
                  checked={notificationPreference.in_app_enabled}
                  disabled={savingPreferenceField !== null}
                  icon={Bell}
                  onChange={() =>
                    void handleTogglePreference(
                      'in_app_enabled'
                    )
                  }
                />

                <ToggleRow
                  title="Email-уведомления"
                  description={
                    user.email
                      ? `Отправлять на ${user.email}`
                      : 'Сначала укажите email в личной информации'
                  }
                  checked={notificationPreference.email_enabled}
                  disabled={savingPreferenceField !== null}
                  icon={Mail}
                  onChange={() =>
                    void handleTogglePreference(
                      'email_enabled'
                    )
                  }
                />

                <ToggleRow
                  title="Push-уведомления"
                  description="Получать уведомления на устройстве после подключения Web Push"
                  checked={notificationPreference.push_enabled}
                  disabled={savingPreferenceField !== null}
                  icon={Smartphone}
                  onChange={() =>
                    void handleTogglePreference(
                      'push_enabled'
                    )
                  }
                />

                <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  События
                </p>

                <ToggleRow
                  title="Изменения расписания"
                  description="Переносы, отмены и изменения времени занятий"
                  checked={notificationPreference.schedule_enabled}
                  disabled={savingPreferenceField !== null}
                  icon={Calendar}
                  onChange={() =>
                    void handleTogglePreference(
                      'schedule_enabled'
                    )
                  }
                />

                <ToggleRow
                  title="Напоминания о занятиях"
                  description="Информация о предстоящих уроках"
                  checked={notificationPreference.lesson_enabled}
                  disabled={savingPreferenceField !== null}
                  icon={GraduationCap}
                  onChange={() =>
                    void handleTogglePreference(
                      'lesson_enabled'
                    )
                  }
                />

                <ToggleRow
                  title="Новые домашние задания"
                  description="Публикация и изменение домашнего задания"
                  checked={notificationPreference.homework_enabled}
                  disabled={savingPreferenceField !== null}
                  icon={BookOpen}
                  onChange={() =>
                    void handleTogglePreference(
                      'homework_enabled'
                    )
                  }
                />

                <ToggleRow
                  title="Оценки и результаты"
                  description="Проверка работы, оценка и комментарий преподавателя"
                  checked={notificationPreference.homework_result_enabled}
                  disabled={savingPreferenceField !== null}
                  icon={Check}
                  onChange={() =>
                    void handleTogglePreference(
                      'homework_result_enabled'
                    )
                  }
                />

                <ToggleRow
                  title="Сообщения"
                  description="Новые сообщения и ответы в чатах"
                  checked={notificationPreference.chat_enabled}
                  disabled={savingPreferenceField !== null}
                  icon={MessageSquare}
                  onChange={() =>
                    void handleTogglePreference(
                      'chat_enabled'
                    )
                  }
                />

                <ToggleRow
                  title="Новости школы"
                  description="Новые публикации и важные объявления"
                  checked={notificationPreference.news_enabled}
                  disabled={savingPreferenceField !== null}
                  icon={Newspaper}
                  onChange={() =>
                    void handleTogglePreference(
                      'news_enabled'
                    )
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
