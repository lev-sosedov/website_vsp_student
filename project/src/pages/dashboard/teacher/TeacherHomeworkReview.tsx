import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Loader2,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';

import {
  acceptHomeworkSubmission,
  getHomework,
  getHomeworkSubmissions,
  rejectHomeworkSubmission,
  requestHomeworkRevision,
  startHomeworkReview,
  type Homework,
  type HomeworkSubmission,
  type HomeworkSubmissionStatus,
} from '../../../api/homeworkApi';
import type { UserProfile } from '../../../api/userApi';
import { getTeacherStudentProfile } from '../../../api/academicApi';
import TeacherHomeworkManagement from '../../../components/dashboard/teacher/homework/TeacherHomeworkManagement';

type FilterStatus = 'all' | HomeworkSubmissionStatus;

interface SubmissionWithHomework {
  submission: HomeworkSubmission;
  homework: Homework | null;
  student: UserProfile | null;
}

const statusLabels: Record<HomeworkSubmissionStatus, string> = {
  draft: 'Черновик',
  submitted: 'Отправлено',
  in_review: 'На проверке',
  needs_revision: 'На доработке',
  accepted: 'Принято',
  rejected: 'Отклонено',
};

const statusClasses: Record<HomeworkSubmissionStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-amber-50 text-amber-700',
  in_review: 'bg-blue-50 text-blue-700',
  needs_revision: 'bg-orange-50 text-orange-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

function formatDate(value: string | null): string {
  if (!value) {
    return 'Не указано';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getStudentName(
  student: UserProfile | null
): string {
  if (!student) {
    return 'Имя студента не указано';
  }

  const nameParts = [
    student.first_name,
    student.user_name,
    student.last_name,
  ]
    .map((part) => part?.trim())
    .filter(
      (part): part is string =>
        Boolean(part)
    );

  return (
    nameParts.join(' ') ||
    'Имя студента не указано'
  );
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export default function TeacherHomeworkReview() {
  const { user } = useAuth();

  const [items, setItems] = useState<SubmissionWithHomework[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const [selectedItem, setSelectedItem] =
    useState<SubmissionWithHomework | null>(null);

  const [teacherComment, setTeacherComment] = useState('');
  const [score, setScore] = useState('');

  const teacherId = user?.id;

  const loadSubmissions = useCallback(async () => {
    if (!teacherId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await getHomeworkSubmissions({
        skip: 0,
        limit: 500,
      });

      const submissions = response.items.filter(
        (submission) => submission.status !== 'draft'
      );

      const homeworkIds = Array.from(
        new Set(
          submissions.map(
            (submission) => submission.homework_id
          )
        )
      );

      const homeworkEntries = await Promise.all(
        homeworkIds.map(async (homeworkId) => {
          try {
            const homework = await getHomework(homeworkId);

            return [homeworkId, homework] as const;
          } catch {
            return [homeworkId, null] as const;
          }
        })
      );

      const homeworkMap = new Map<number, Homework | null>(
        homeworkEntries
      );

      const teacherItems = submissions
        .map((submission) => ({
          submission,
          homework:
            homeworkMap.get(submission.homework_id) ?? null,
          student: null,
        }))
        .filter(
          ({ homework }) =>
            homework !== null &&
            homework.created_by === teacherId
        );

      const studentIds = [...new Set(teacherItems.map(({ submission }) => submission.student_id))];
      const profileResults = await Promise.allSettled(studentIds.map((studentId) => getTeacherStudentProfile(studentId)));
      const studentProfiles: Record<number, UserProfile> = {};
      profileResults.forEach((result, index) => {
        if (result.status === 'fulfilled') studentProfiles[studentIds[index]] = result.value;
      });

      setItems(
        teacherItems.map((item) => ({
          ...item,
          student:
            studentProfiles[
              item.submission.student_id
            ] ?? null,
        }))
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Не удалось загрузить домашние работы'
      );
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (teacherId) {
      void loadSubmissions();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [loadSubmissions, teacherId]);

  const counters = useMemo(() => {
    return {
      submitted: items.filter(
        ({ submission }) =>
          submission.status === 'submitted'
      ).length,

      inReview: items.filter(
        ({ submission }) =>
          submission.status === 'in_review'
      ).length,

      needsRevision: items.filter(
        ({ submission }) =>
          submission.status === 'needs_revision'
      ).length,

      accepted: items.filter(
        ({ submission }) =>
          submission.status === 'accepted'
      ).length,

      rejected: items.filter(
        ({ submission }) =>
          submission.status === 'rejected'
      ).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    const normalizedPhone =
      normalizePhone(normalizedSearch);

    return items.filter(({ submission, student }) => {
      if (
        statusFilter !== 'all' &&
        submission.status !== statusFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const nameParts = [
        student?.first_name,
        student?.user_name,
        student?.last_name,
      ]
        .filter(Boolean)
        .map((value) =>
          String(value).trim().toLowerCase()
        );

      const fullNames = [
        nameParts.join(' '),
        [...nameParts].reverse().join(' '),
      ];

      const matchesName =
        nameParts.some((value) =>
          value.includes(normalizedSearch)
        ) ||
        fullNames.some((value) =>
          value.includes(normalizedSearch)
        );

      const studentPhone = normalizePhone(
        student?.phone_number ?? ''
      );

      const matchesPhone =
        normalizedPhone.length > 0 &&
        studentPhone.includes(normalizedPhone);

      return matchesName || matchesPhone;
    });
  }, [items, search, statusFilter]);

  function openReview(item: SubmissionWithHomework) {
    setSelectedItem(item);
    setTeacherComment(
      item.submission.teacher_comment ?? ''
    );
    setScore(
      item.submission.score !== null
        ? String(item.submission.score)
        : ''
    );
    setError('');
  }

  function closeReview() {
    setSelectedItem(null);
    setTeacherComment('');
    setScore('');
  }

  async function runAction(
    submissionId: number,
    action: () => Promise<HomeworkSubmission>
  ) {
    try {
      setActionLoadingId(submissionId);
      setError('');

      await action();
      await loadSubmissions();
      closeReview();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Не удалось изменить статус работы'
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleStartReview(
    item: SubmissionWithHomework
  ) {
    if (!teacherId) {
      setError('Не удалось определить преподавателя');
      return;
    }

    try {
      setActionLoadingId(item.submission.id);
      setError('');

      const updatedSubmission = await startHomeworkReview(
        item.submission.id,
        teacherId
      );

      const updatedItem: SubmissionWithHomework = {
        ...item,
        submission: updatedSubmission,
      };

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.submission.id === updatedSubmission.id
            ? updatedItem
            : currentItem
        )
      );

      openReview(updatedItem);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Не удалось начать проверку работы'
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleAccept() {
    if (!selectedItem || !teacherId) {
      return;
    }

    const numericScore = Number(score);

    if (
      score.trim() === '' ||
      !Number.isFinite(numericScore)
    ) {
      setError('Укажите корректный балл');
      return;
    }

    const maxScore =
      selectedItem.homework?.max_score ?? 100;

    if (
      numericScore < 0 ||
      numericScore > maxScore
    ) {
      setError(
        `Балл должен быть от 0 до ${maxScore}`
      );
      return;
    }

    await runAction(
      selectedItem.submission.id,
      () =>
        acceptHomeworkSubmission(
          selectedItem.submission.id,
          {
            checked_by: teacherId,
            score: numericScore,
            teacher_comment:
              teacherComment.trim(),
          }
        )
    );
  }

  async function handleRevision() {
    if (!selectedItem || !teacherId) {
      return;
    }

    if (!teacherComment.trim()) {
      setError(
        'Напишите, что студенту нужно исправить'
      );
      return;
    }

    await runAction(
      selectedItem.submission.id,
      () =>
        requestHomeworkRevision(
          selectedItem.submission.id,
          {
            checked_by: teacherId,
            teacher_comment:
              teacherComment.trim(),
          }
        )
    );
  }

  async function handleReject() {
    if (!selectedItem || !teacherId) {
      return;
    }

    if (!teacherComment.trim()) {
      setError('Укажите причину отклонения');
      return;
    }

    const numericScore =
      score.trim() === ''
        ? 0
        : Number(score);

    if (
      !Number.isFinite(numericScore) ||
      numericScore < 0
    ) {
      setError('Укажите корректный балл');
      return;
    }

    await runAction(
      selectedItem.submission.id,
      () =>
        rejectHomeworkSubmission(
          selectedItem.submission.id,
          {
            checked_by: teacherId,
            teacher_comment:
              teacherComment.trim(),
            score: numericScore,
          }
        )
    );
  }

  const canReviewSelected =
    selectedItem?.submission.status === 'submitted' ||
    selectedItem?.submission.status === 'in_review';

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Проверка домашних работ
          </h1>

          <p className="mt-1 text-gray-500">
            Работы студентов и результаты проверки
          </p>
        </div>
      </div>

      {teacherId && (
        <TeacherHomeworkManagement
          teacherId={teacherId}
          onChanged={loadSubmissions}
        />
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <CounterCard
          label="Новые"
          value={counters.submitted}
          icon={Clock3}
        />

        <CounterCard
          label="На проверке"
          value={counters.inReview}
          icon={FileCheck2}
        />

        <CounterCard
          label="На доработке"
          value={counters.needsRevision}
          icon={RotateCcw}
        />

        <CounterCard
          label="Принято"
          value={counters.accepted}
          icon={CheckCircle2}
        />

        <CounterCard
          label="Отклонено"
          value={counters.rejected}
          icon={XCircle}
        />
      </div>

      <div className="card p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Фамилия, имя или телефон студента"
              className="
                h-11 w-full rounded-xl border border-gray-200
                bg-white pl-10 pr-4 text-sm outline-none
                transition focus:border-red-400
                focus:ring-4 focus:ring-red-50
              "
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as FilterStatus
              )
            }
            className="
              h-11 rounded-xl border border-gray-200
              bg-white px-4 text-sm text-gray-700
              outline-none focus:border-red-400
              focus:ring-4 focus:ring-red-50
            "
          >
            <option value="all">Все статусы</option>
            <option value="submitted">Новые</option>
            <option value="in_review">На проверке</option>
            <option value="needs_revision">
              На доработке
            </option>
            <option value="accepted">Принятые</option>
            <option value="rejected">Отклонённые</option>
          </select>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <p className="text-sm text-gray-500">
                Загружаем работы студентов...
              </p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <FileCheck2 className="mb-3 h-10 w-10 text-gray-300" />

            <p className="font-medium text-gray-700">
              Работы не найдены
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Измените фильтр или дождитесь новых работ
            </p>
          </div>
        ) : (
          <div
            className="space-y-3 overflow-y-auto pr-2"
            style={{ maxHeight: '700px' }}
          >
            {filteredItems.map((item) => {
              const {
                submission,
                homework,
                student,
              } = item;

              const studentName =
                getStudentName(student);

              return (
                <div
                  key={submission.id}
                  className="
                    rounded-2xl border border-gray-100
                    bg-white p-4 transition
                    hover:border-red-100 hover:shadow-sm
                  "
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-gray-900">
                          {homework?.title ??
                            `Домашнее задание №${submission.homework_id}`}
                        </h2>

                        <span
                          className={`
                            rounded-full px-2.5 py-1
                            text-xs font-medium
                            ${statusClasses[submission.status]}
                          `}
                        >
                          {statusLabels[submission.status]}
                        </span>

                        {submission.is_late && (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                            Сдано поздно
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                        <span className="font-medium text-gray-700">
                          {studentName}
                        </span>

                        <span>
                          Отправлено:{' '}
                          {formatDate(
                            submission.submitted_at
                          )}
                        </span>
                      </div>

                      {submission.answer_text && (
                        <div className="mt-3 rounded-xl bg-gray-50 p-3">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                            Ответ студента
                          </p>

                          <p className="max-h-12 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {submission.answer_text}
                          </p>
                        </div>
                      )}

                      {submission.teacher_comment && (
                        <div className="mt-3 rounded-xl border border-gray-100 p-3">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                            Комментарий преподавателя
                          </p>

                          <p className="max-h-12 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {submission.teacher_comment}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {submission.status ===
                        'submitted' && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleStartReview(item)
                          }
                          disabled={
                            actionLoadingId ===
                            submission.id
                          }
                          className="
                            inline-flex h-10 items-center gap-2
                            rounded-xl bg-red-600 px-4
                            text-sm font-semibold text-white
                            transition hover:bg-red-700
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                          "
                        >
                          {actionLoadingId ===
                          submission.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileCheck2 className="h-4 w-4" />
                          )}

                          Начать проверку
                        </button>
                      )}

                      {[
                        'in_review',
                        'needs_revision',
                        'accepted',
                        'rejected',
                      ].includes(submission.status) && (
                        <button
                          type="button"
                          onClick={() => openReview(item)}
                          className="
                            inline-flex h-10 items-center
                            rounded-xl border border-gray-200
                            bg-white px-4 text-sm font-medium
                            text-gray-700 transition
                            hover:border-red-200 hover:text-red-600
                          "
                        >
                          {submission.status === 'in_review'
                            ? 'Открыть проверку'
                            : 'Посмотреть'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Проверка работы
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedItem.homework?.title ??
                    `Домашнее задание №${selectedItem.submission.homework_id}`}
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700">
                  {getStudentName(
                    selectedItem.student
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReview}
                className="
                  rounded-lg p-2 text-gray-400
                  transition hover:bg-gray-100
                  hover:text-gray-700
                "
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Ответ студента
                </p>

                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {selectedItem.submission.answer_text ||
                    'Текстовый ответ отсутствует'}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Балл
                </label>

                <input
                  type="number"
                  min="0"
                  max={
                    selectedItem.homework?.max_score ??
                    100
                  }
                  value={score}
                  onChange={(event) =>
                    setScore(event.target.value)
                  }
                  disabled={!canReviewSelected}
                  placeholder={`От 0 до ${
                    selectedItem.homework?.max_score ??
                    100
                  }`}
                  className="
                    h-11 w-full rounded-xl border
                    border-gray-200 px-4 text-sm
                    outline-none focus:border-red-400
                    focus:ring-4 focus:ring-red-50
                  "
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Комментарий студенту
                </label>

                <textarea
                  value={teacherComment}
                  onChange={(event) =>
                    setTeacherComment(
                      event.target.value
                    )
                  }
                  disabled={!canReviewSelected}
                  rows={5}
                  placeholder="Напишите результат проверки или рекомендации"
                  className="
                    w-full resize-none rounded-xl border
                    border-gray-200 px-4 py-3 text-sm
                    outline-none focus:border-red-400
                    focus:ring-4 focus:ring-red-50
                  "
                />
              </div>

              {!canReviewSelected && (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  Проверка этой работы уже завершена. Результат доступен
                  только для просмотра.
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={
                  actionLoadingId ===
                    selectedItem.submission.id ||
                  !canReviewSelected
                }
                className="
                  h-11 rounded-xl border border-red-200
                  px-5 text-sm font-semibold text-red-600
                  transition hover:bg-red-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                Отклонить
              </button>

              <button
                type="button"
                onClick={() => void handleRevision()}
                disabled={
                  actionLoadingId ===
                    selectedItem.submission.id ||
                  !canReviewSelected
                }
                className="
                  h-11 rounded-xl border border-amber-200
                  px-5 text-sm font-semibold text-amber-700
                  transition hover:bg-amber-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                На доработку
              </button>

              <button
                type="button"
                onClick={() => void handleAccept()}
                disabled={
                  actionLoadingId ===
                    selectedItem.submission.id ||
                  !canReviewSelected
                }
                className="
                  inline-flex h-11 items-center justify-center
                  gap-2 rounded-xl bg-green-600 px-5
                  text-sm font-semibold text-white
                  transition hover:bg-green-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {actionLoadingId ===
                selectedItem.submission.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                Принять работу
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CounterCardProps {
  label: string;
  value: number;
  icon: typeof Clock3;
}

function CounterCard({
  label,
  value,
  icon: Icon,
}: CounterCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
          <Icon className="h-5 w-5 text-red-600" />
        </div>

        <div>
          <p className="text-xl font-bold text-gray-900">
            {value}
          </p>

          <p className="text-sm text-gray-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
