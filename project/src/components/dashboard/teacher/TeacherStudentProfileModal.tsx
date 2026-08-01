import {
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  getChats,
} from '../../../api/chatApi';

import {
  getStudentParents,
  type ParentStudentWithParent,
} from '../../../api/parentStudentApi';

import type {
  UserProfile,
} from '../../../api/userApi';

import {
  useAuth,
} from '../../../context/AuthContext';

import {
  openOrCreatePrivateChat,
  type MessageDirectoryPerson,
} from '../../../services/messageDirectoryService';

import UserAvatar from '../../common/UserAvatar';

interface TeacherStudentProfileModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isOpeningMessage: boolean;
  error: string | null;
  studentName: string;
  studentAvatarUrl: string | null;
  groupName: string;
  profile: UserProfile | null;
  parents?: ParentStudentWithParent[];
  areParentsLoading?: boolean;
  parentError?: string | null;
  assignedCount?: number;
  acceptedCount?: number;
  outstandingCount?: number;
  openingMessageUserId?: number | null;
  onClose: () => void;
  onMessage: () => void;
  onMessageParent?: (
    parentLink: ParentStudentWithParent
  ) => void;
}

function formatBirthday(value: string | null): string {
  if (!value) {
    return 'Не указана';
  }

  const dateParts = value.split('-').map(Number);

  if (
    dateParts.length !== 3 ||
    dateParts.some((part) => !Number.isFinite(part))
  ) {
    return value;
  }

  const [year, month, day] = dateParts;

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function getPersonName(person: {
  id: number;
  user_name: string | null;
  first_name: string | null;
  last_name: string | null;
}): string {
  const fullName = [
    person.first_name,
    person.user_name,
    person.last_name,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || `Пользователь №${person.id}`;
}

function getRelationshipLabel(
  relationship: ParentStudentWithParent['relationship']
): string {
  switch (relationship) {
    case 'mother':
      return 'Мама';
    case 'father':
      return 'Папа';
    case 'guardian':
      return 'Законный представитель';
    case 'other':
    default:
      return 'Родитель или представитель';
  }
}

function getPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export default function TeacherStudentProfileModal({
  isOpen,
  isLoading,
  isOpeningMessage,
  error,
  studentName,
  studentAvatarUrl,
  groupName,
  profile,
  parents,
  areParentsLoading,
  parentError,
  assignedCount,
  acceptedCount,
  outstandingCount,
  openingMessageUserId,
  onClose,
  onMessage,
  onMessageParent,
}: TeacherStudentProfileModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [
    internalParents,
    setInternalParents,
  ] = useState<ParentStudentWithParent[]>([]);

  const [
    areInternalParentsLoading,
    setAreInternalParentsLoading,
  ] = useState(false);

  const [
    internalParentError,
    setInternalParentError,
  ] = useState<string | null>(null);

  const [
    openingInternalParentId,
    setOpeningInternalParentId,
  ] = useState<number | null>(null);

  const [
    internalMessageError,
    setInternalMessageError,
  ] = useState<string | null>(null);

  const shouldLoadParentsInternally =
    parents === undefined;

  useEffect(() => {
    if (!shouldLoadParentsInternally) {
      setInternalParents([]);
      setAreInternalParentsLoading(false);
      setInternalParentError(null);
      return;
    }

    if (!isOpen) {
      setInternalParents([]);
      setAreInternalParentsLoading(false);
      setInternalParentError(null);
      setInternalMessageError(null);
      return;
    }

    const studentId = profile?.id;

    if (
      typeof studentId !== 'number' ||
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      if (!isLoading && !error) {
        setInternalParents([]);
        setInternalParentError(
          'Не удалось определить студента для загрузки родителей'
        );
      }

      return;
    }

    const validStudentId = studentId;
    let cancelled = false;

    async function loadParents(): Promise<void> {
      setInternalParents([]);
      setAreInternalParentsLoading(true);
      setInternalParentError(null);
      setInternalMessageError(null);

      try {
        const loadedParents =
          await getStudentParents(validStudentId);

        if (!cancelled) {
          setInternalParents(
            loadedParents.filter(
              (parentLink) =>
                parentLink.is_active &&
                parentLink.parent.is_active
            )
          );
        }
      } catch (loadError) {
        console.error(
          'Не удалось загрузить родителей студента:',
          loadError
        );

        if (!cancelled) {
          setInternalParents([]);
          setInternalParentError(
            loadError instanceof Error
              ? loadError.message
              : 'Не удалось загрузить родителей студента'
          );
        }
      } finally {
        if (!cancelled) {
          setAreInternalParentsLoading(false);
        }
      }
    }

    void loadParents();

    return () => {
      cancelled = true;
    };
  }, [
    error,
    isLoading,
    isOpen,
    profile?.id,
    shouldLoadParentsInternally,
  ]);

  const resolvedParents =
    parents ?? internalParents;

  const resolvedParentsLoading =
    areParentsLoading ??
    (
      shouldLoadParentsInternally
        ? isLoading || areInternalParentsLoading
        : false
    );

  const resolvedParentError =
    parentError !== undefined
      ? parentError
      : internalParentError;

  const resolvedOpeningMessageUserId =
    openingMessageUserId !== undefined
      ? openingMessageUserId
      : openingInternalParentId;

  const isBusy =
    isOpeningMessage ||
    resolvedOpeningMessageUserId !== null;

  const hasHomeworkSummary =
    assignedCount !== undefined ||
    acceptedCount !== undefined ||
    outstandingCount !== undefined;

  const isStudentMessageOpening =
    resolvedOpeningMessageUserId !== null
      ? resolvedOpeningMessageUserId === profile?.id
      : isOpeningMessage;

  const handleParentMessage = async (
    parentLink: ParentStudentWithParent
  ): Promise<void> => {
    if (onMessageParent) {
      onMessageParent(parentLink);
      return;
    }

    if (
      openingInternalParentId !== null ||
      isOpeningMessage
    ) {
      return;
    }

    const currentUserId = Number(user?.id);

    if (
      !Number.isInteger(currentUserId) ||
      currentUserId <= 0
    ) {
      setInternalMessageError(
        'Не удалось определить текущего преподавателя'
      );
      return;
    }

    const parent = parentLink.parent;

    setOpeningInternalParentId(parent.id);
    setInternalMessageError(null);

    const target: MessageDirectoryPerson = {
      userId: parent.id,
      displayName: getPersonName(parent),
      avatarUrl: parent.avatar_url,
      /*
       * В текущем MessageDirectoryPerson пока нет роли
       * parent. Для поиска личного чата используется ID,
       * поэтому существующий диалог всё равно определяется
       * правильно.
       */
      role: 'student',
    };

    try {
      const chatsResponse =
        await getChats(currentUserId);

      const privateChat =
        await openOrCreatePrivateChat(
          chatsResponse.items,
          currentUserId,
          target
        );

      navigate(
        `/dashboard/messages?chatId=${privateChat.id}`
      );
    } catch (messageError) {
      console.error(
        'Не удалось открыть чат с родителем:',
        messageError
      );

      setInternalMessageError(
        messageError instanceof Error
          ? messageError.message
          : 'Не удалось открыть чат с родителем'
      );
    } finally {
      setOpeningInternalParentId(null);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-student-profile-title"
      onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
        if (
          event.target === event.currentTarget &&
          !isBusy
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <UserAvatar
              avatarUrl={
                profile?.avatar_url ??
                studentAvatarUrl
              }
              alt={studentName}
              className="h-16 w-16 shrink-0 rounded-full object-cover shadow-sm"
            />

            <div className="min-w-0">
              <h2
                id="teacher-student-profile-title"
                className="truncate text-xl font-bold text-gray-900"
              >
                {studentName}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {groupName || 'Группа не указана'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Закрыть профиль студента"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {hasHomeworkSummary && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <ClipboardList className="h-4 w-4" />
                  <p className="text-xs font-semibold">
                    Назначено
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-blue-900">
                  {assignedCount ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold">
                    Принято
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-green-900">
                  {acceptedCount ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-xs font-semibold">
                    Осталось сдать
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-red-900">
                  {outstandingCount ?? 0}
                </p>
              </div>
            </div>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <UserRound className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-gray-900">
                Краткая информация о студенте
              </h3>
            </div>

            {isLoading ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl bg-gray-50">
                <Loader2 className="h-7 w-7 animate-spin text-red-600" />

                <p className="mt-3 text-sm text-gray-500">
                  Загружаем профиль студента…
                </p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">
                    Имя
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {profile?.user_name || 'Не указано'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">
                    Дата рождения
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatBirthday(
                      profile?.birthday ?? null
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">
                    Телефон
                  </p>
                  {profile?.phone_number ? (
                    <a
                      href={getPhoneHref(
                        profile.phone_number
                      )}
                      className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      <Phone className="h-4 w-4" />
                      {profile.phone_number}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      Не указан
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">
                    Электронная почта
                  </p>
                  {profile?.email ? (
                    <a
                      href={`mailto:${profile.email}`}
                      className="mt-1 inline-flex items-center gap-2 break-all text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      {profile.email}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      Не указана
                    </p>
                  )}
                </div>

                {profile?.about?.trim() && (
                  <div className="rounded-xl border border-gray-100 p-4 sm:col-span-2">
                    <p className="text-xs text-gray-400">
                      О студенте
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                      {profile.about}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-gray-900">
                Родители и представители
              </h3>
            </div>

            {resolvedParentsLoading ? (
              <div className="flex items-center justify-center gap-3 rounded-xl bg-gray-50 px-4 py-8 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                Загружаем данные родителя…
              </div>
            ) : resolvedParentError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {resolvedParentError}
              </div>
            ) : resolvedParents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                К студенту пока не привязан родитель.
              </div>
            ) : (
              <div className="space-y-3">
                {resolvedParents.map((parentLink) => {
                  const parent = parentLink.parent;
                  const parentName = getPersonName(parent);
                  const isParentMessageOpening =
                    resolvedOpeningMessageUserId === parent.id;

                  return (
                    <article
                      key={parentLink.id}
                      className="rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar
                            avatarUrl={parent.avatar_url}
                            alt={parentName}
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                          />

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {parentName}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {getRelationshipLabel(
                                parentLink.relationship
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {parent.phone_number && (
                            <a
                              href={getPhoneHref(
                                parent.phone_number
                              )}
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:text-red-600"
                            >
                              <Phone className="h-4 w-4" />
                              Позвонить
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              void handleParentMessage(
                                parentLink
                              )
                            }
                            disabled={isBusy}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                          >
                            {isParentMessageOpening ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                            Написать родителю
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                        {parent.phone_number && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {parent.phone_number}
                          </span>
                        )}

                        {parent.email && (
                          <a
                            href={`mailto:${parent.email}`}
                            className="inline-flex items-center gap-1.5 hover:text-red-600"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {parent.email}
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {internalMessageError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {internalMessageError}
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-100 bg-gray-50/95 p-5 backdrop-blur sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Закрыть
          </button>

          {profile?.phone_number && (
            <a
              href={getPhoneHref(profile.phone_number)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Phone className="h-4 w-4" />
              Позвонить студенту
            </a>
          )}

          <button
            type="button"
            onClick={onMessage}
            disabled={isBusy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isStudentMessageOpening ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}

            Написать студенту
          </button>
        </div>
      </div>
    </div>
  );
}
