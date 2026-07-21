import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AlertCircle,
  BookOpen,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import {
  createHomeworkSubmission,
  submitHomeworkSubmission,
  updateHomeworkSubmission,
} from '../../../api/homeworkApi';

import { getPrimaryStudentGroupMembership } from '../../../api/academicApi';
import HomeworkCard from '../../../components/homework/HomeworkCard';
import HomeworkStats from '../../../components/homework/HomeworkStats';
import HomeworkSubmissionModal from '../../../components/homework/HomeworkSubmissionModal';
import { useAuth } from '../../../context/AuthContext';

import {
  loadStudentHomeworks,
  type StudentHomeworkData,
  type StudentHomeworkItem,
} from '../../../services/homeworkService';

const EMPTY_DATA: StudentHomeworkData = {
  items: [],
  pendingCount: 0,
  submittedCount: 0,
  gradedCount: 0,
  overdueCount: 0,
};

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить домашние задания';
}

export default function Homework() {
  const { user } = useAuth();

  const [data, setData] =
    useState<StudentHomeworkData>(
      EMPTY_DATA
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    selectedHomework,
    setSelectedHomework,
  ] = useState<StudentHomeworkItem | null>(
    null
  );

  const [
    isSubmissionSaving,
    setIsSubmissionSaving,
  ] = useState(false);

  const [
    submissionError,
    setSubmissionError,
  ] = useState<string | null>(null);

  const loadHomework = useCallback(
    async () => {
      if (!user?.id) {
        setData(EMPTY_DATA);
        setError(
          'Не удалось определить текущего пользователя'
        );
        setIsLoading(false);

        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const membership =
          await getPrimaryStudentGroupMembership(
            user.id
          );

        if (!membership?.group_id) {
          setData(EMPTY_DATA);
          setError(
            'Пользователь пока не добавлен в учебную группу'
          );

          return;
        }

        const homeworkData =
          await loadStudentHomeworks(
            membership.group_id,
            user.id
          );

        setData(homeworkData);
      } catch (loadError) {
        setData(EMPTY_DATA);
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void loadHomework();
  }, [loadHomework]);

  const openHomework = (
    item: StudentHomeworkItem
  ) => {
    setSelectedHomework(item);
    setSubmissionError(null);
  };

  const closeHomework = () => {
    if (isSubmissionSaving) {
      return;
    }

    setSelectedHomework(null);
    setSubmissionError(null);
  };

  const saveSubmissionDraft = async (
    answerText: string
  ) => {
    if (!user?.id || !selectedHomework) {
      return;
    }

    setIsSubmissionSaving(true);
    setSubmissionError(null);

    try {
      if (selectedHomework.submission) {
        await updateHomeworkSubmission(
          selectedHomework.submission.id,
          {
            student_id: user.id,
            answer_text:
              answerText.trim() || null,
          }
        );
      } else {
        await createHomeworkSubmission({
          homework_id:
            selectedHomework.homework.id,
          student_id: user.id,
          answer_text:
            answerText.trim() || null,
        });
      }

      setSelectedHomework(null);
      await loadHomework();
    } catch (saveError) {
      setSubmissionError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSubmissionSaving(false);
    }
  };

  const sendSubmission = async (
    answerText: string
  ) => {
    if (!user?.id || !selectedHomework) {
      return;
    }

    const normalizedAnswer =
      answerText.trim();

    if (!normalizedAnswer) {
      setSubmissionError(
        'Напишите ответ перед отправкой'
      );

      return;
    }

    setIsSubmissionSaving(true);
    setSubmissionError(null);

    try {
      let submissionId: number;

      if (selectedHomework.submission) {
        const updatedSubmission =
          await updateHomeworkSubmission(
            selectedHomework.submission.id,
            {
              student_id: user.id,
              answer_text: normalizedAnswer,
            }
          );

        submissionId =
          updatedSubmission.id;
      } else {
        const createdSubmission =
          await createHomeworkSubmission({
            homework_id:
              selectedHomework.homework.id,
            student_id: user.id,
            answer_text: normalizedAnswer,
          });

        submissionId =
          createdSubmission.id;
      }

      await submitHomeworkSubmission(
        submissionId,
        user.id
      );

      setSelectedHomework(null);
      await loadHomework();
    } catch (sendError) {
      setSubmissionError(
        getErrorMessage(sendError)
      );
    } finally {
      setIsSubmissionSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Домашние задания
          </h1>

          <p className="mt-1 text-gray-500">
            Все ваши задания и их статусы
          </p>
        </div>

        {!isLoading && !error && (
          <button
            type="button"
            onClick={() =>
              void loadHomework()
            }
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-red-200 hover:text-red-600"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>
        )}
      </div>

      {!isLoading && !error && (
        <HomeworkStats
          pendingCount={
            data.pendingCount
          }
          submittedCount={
            data.submittedCount
          }
          gradedCount={
            data.gradedCount
          }
          overdueCount={
            data.overdueCount
          }
        />
      )}

      {isLoading && (
        <div className="card flex min-h-72 items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />

            <p className="mt-3 text-sm text-gray-500">
              Загружаем домашние задания…
            </p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="card border border-red-100 bg-red-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <p className="font-semibold text-red-800">
                  Не удалось загрузить задания
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadHomework()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </button>
          </div>
        </div>
      )}

      {!isLoading &&
        !error &&
        data.items.length === 0 && (
          <div className="card flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <BookOpen className="h-7 w-7 text-gray-400" />
            </div>

            <h2 className="mt-4 font-semibold text-gray-900">
              Домашних заданий пока нет
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Когда преподаватель опубликует домашнее
              задание, оно появится на этой странице.
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        data.items.length > 0 && (
          <div className="card p-4 sm:p-6">
            <div className="space-y-3">
              {data.items.map((item) => (
                <HomeworkCard
                  key={item.homework.id}
                  item={item}
                  onOpen={openHomework}
                />
              ))}
            </div>
          </div>
        )}

      {selectedHomework && (
        <HomeworkSubmissionModal
          item={selectedHomework}
          isOpen={Boolean(
            selectedHomework
          )}
          isSaving={
            isSubmissionSaving
          }
          error={submissionError}
          onClose={closeHomework}
          onSaveDraft={
            saveSubmissionDraft
          }
          onSubmit={sendSubmission}
        />
      )}
    </div>
  );
}