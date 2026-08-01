import {
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

import {
  getStudentParents,
  type ParentRelationship,
  type ParentStudentWithParent,
} from '../../../api/parentStudentApi';

import UserAvatar from '../../common/UserAvatar';

import {
  getAdminStudentName,
  type AdminStudentItem,
} from '../../../services/adminStudentsService';

interface AdminStudentDetailsModalProps {
  student: AdminStudentItem | null;
  roleLabel?: string;
  assignmentTitle?: string;
  emptyAssignmentText?: string;
  deleteEntityLabel?: string;
  activeAction: string | null;
  error: string | null;
  onClose: () => void;
  onEdit: () => void;
  onVerifyAccount: () => void;
  onVerifyPhone: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onMessage?: () => void;
  showParentContacts?: boolean;
  onMessageParent?: (
    parentLink: ParentStudentWithParent
  ) => void;
}

function VerificationBadge({
  verified,
  verifiedText,
  pendingText,
}: {
  verified: boolean;
  verifiedText: string;
  pendingText: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
        verified
          ? 'bg-green-50 text-green-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      {verified ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5" />
      )}
      {verified ? verifiedText : pendingText}
    </span>
  );
}

const PARENT_RELATIONSHIP_LABELS: Record<
  ParentRelationship,
  string
> = {
  mother: 'Мама',
  father: 'Папа',
  guardian: 'Законный представитель',
  other: 'Родственник',
};

function getParentName(
  parentLink: ParentStudentWithParent
): string {
  const parent = parentLink.parent;

  return (
    [
      parent.first_name,
      parent.user_name,
      parent.last_name,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ')
      .trim() ||
    `Родитель №${parent.id}`
  );
}

export default function AdminStudentDetailsModal({
  student,
  roleLabel = 'Студент',
  assignmentTitle = 'Обучение',
  emptyAssignmentText =
    'Студент пока не зачислен в группу',
  deleteEntityLabel = 'студента',
  activeAction,
  error,
  onClose,
  onEdit,
  onVerifyAccount,
  onVerifyPhone,
  onToggleActive,
  onDelete,
  onMessage,
  showParentContacts = false,
  onMessageParent,
}: AdminStudentDetailsModalProps) {
  const [
    isDeleteConfirmationVisible,
    setIsDeleteConfirmationVisible,
  ] = useState(false);

  const [parents, setParents] =
    useState<ParentStudentWithParent[]>([]);
  const [
    areParentsLoading,
    setAreParentsLoading,
  ] = useState(false);
  const [
    parentsError,
    setParentsError,
  ] = useState<string | null>(null);

  const studentId =
    student?.profile.id ?? null;

  useEffect(() => {
    setIsDeleteConfirmationVisible(false);
  }, [studentId]);

  useEffect(() => {
    if (
      !showParentContacts ||
      studentId === null
    ) {
      setParents([]);
      setParentsError(null);
      setAreParentsLoading(false);
      return;
    }

    let cancelled = false;

    const loadParents = async () => {
      setAreParentsLoading(true);
      setParentsError(null);

      try {
        const result =
          await getStudentParents(
            studentId,
            true
          );

        if (!cancelled) {
          setParents(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setParents([]);
          setParentsError(
            loadError instanceof Error
              ? loadError.message
              : 'Не удалось загрузить родителей'
          );
        }
      } finally {
        if (!cancelled) {
          setAreParentsLoading(false);
        }
      }
    };

    void loadParents();

    return () => {
      cancelled = true;
    };
  }, [
    showParentContacts,
    studentId,
  ]);

  if (!student) {
    return null;
  }

  const profile = student.profile;
  const isBusy = activeAction !== null;

  const actionButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-50';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              avatarUrl={profile.avatar_url}
              alt={getAdminStudentName(profile)}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />

            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-gray-900">
                {getAdminStudentName(profile)}
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                {roleLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <Phone className="h-4 w-4" />
                Телефон
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {profile.phone_number ||
                  'Не указан'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-gray-900">
                {profile.email || 'Не указан'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                profile.is_active
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {profile.is_active ? (
                <UserCheck className="h-3.5 w-3.5" />
              ) : (
                <Ban className="h-3.5 w-3.5" />
              )}
              {profile.is_active
                ? 'Активен'
                : 'Заблокирован'}
            </span>

            <VerificationBadge
              verified={
                profile.is_account_verified
              }
              verifiedText="Аккаунт подтверждён"
              pendingText="Аккаунт не подтверждён"
            />

            <VerificationBadge
              verified={
                profile.is_phone_verified
              }
              verifiedText="Телефон подтверждён"
              pendingText="Телефон не подтверждён"
            />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-900">
              {assignmentTitle}
            </h3>

            {student.study.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <GraduationCap className="mx-auto h-7 w-7 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  {emptyAssignmentText}
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {student.study.map((study) => (
                  <div
                    key={study.groupId}
                    className="rounded-xl border border-gray-100 p-4"
                  >
                    <p className="font-semibold text-gray-900">
                      {study.groupName}
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-500 sm:grid-cols-3">
                      <span className="flex items-start gap-1.5">
                        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {study.branchName}
                      </span>

                      <span className="flex items-start gap-1.5">
                        <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {study.directionName}
                      </span>

                      <span className="flex items-start gap-1.5">
                        <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {study.educationPlanName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showParentContacts && (
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-bold text-gray-900">
                  Родители и представители
                </h3>
              </div>

              {areParentsLoading ? (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                  Загружаем родителей…
                </div>
              ) : parentsError ? (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {parentsError}
                </p>
              ) : parents.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                  <Users className="mx-auto h-7 w-7 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    К студенту пока не привязан родитель
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {parents.map((parentLink) => {
                    const parent =
                      parentLink.parent;
                    const parentName =
                      getParentName(parentLink);

                    return (
                      <div
                        key={parentLink.id}
                        className="rounded-xl border border-gray-100 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <UserAvatar
                            avatarUrl={
                              parent.avatar_url
                            }
                            alt={parentName}
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {parentName}
                              </p>

                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {
                                  PARENT_RELATIONSHIP_LABELS[
                                    parentLink.relationship
                                  ]
                                }
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                              <div className="flex min-w-0 items-center gap-2 text-gray-600">
                                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate">
                                  {parent.phone_number ||
                                    'Телефон не указан'}
                                </span>
                              </div>

                              <div className="flex min-w-0 items-center gap-2 text-gray-600">
                                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate">
                                  {parent.email ||
                                    'Email не указан'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                              {parent.phone_number && (
                                <a
                                  href={`tel:${parent.phone_number}`}
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                                >
                                  <Phone className="h-4 w-4" />
                                  Позвонить родителю
                                </a>
                              )}

                              {onMessageParent && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    onMessageParent(
                                      parentLink
                                    )
                                  }
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  Написать родителю
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {onMessage && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onMessage}
                className={`${actionButtonClass} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
              >
                {activeAction === 'message' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Написать
              </button>
            )}

            {profile.phone_number && (
              <a
                href={`tel:${profile.phone_number}`}
                className={`${actionButtonClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
              >
                <Phone className="h-4 w-4" />
                Позвонить
              </a>
            )}

            <button
              type="button"
              disabled={isBusy}
              onClick={onEdit}
              className={`${actionButtonClass} border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}
            >
              <Pencil className="h-4 w-4" />
              Изменить профиль
            </button>

            {!profile.is_account_verified && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onVerifyAccount}
                className={`${actionButtonClass} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
              >
                {activeAction ===
                'verify-account' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="h-4 w-4" />
                )}
                Подтвердить аккаунт
              </button>
            )}

            {!profile.is_phone_verified && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onVerifyPhone}
                className={`${actionButtonClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
              >
                {activeAction ===
                'verify-phone' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Подтвердить телефон
              </button>
            )}

            <button
              type="button"
              disabled={isBusy}
              onClick={onToggleActive}
              className={`${actionButtonClass} ${
                profile.is_active
                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {activeAction ===
              'toggle-active' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : profile.is_active ? (
                <Ban className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              {profile.is_active
                ? 'Заблокировать'
                : 'Активировать'}
            </button>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            {isDeleteConfirmationVisible ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Удалить {deleteEntityLabel} без возможности восстановления?
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={onDelete}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {activeAction === 'delete' && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Да, удалить
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      setIsDeleteConfirmationVisible(
                        false
                      )
                    }
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  setIsDeleteConfirmationVisible(
                    true
                  )
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Удалить {deleteEntityLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
