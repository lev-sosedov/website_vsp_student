import {
  AlertCircle,
  Loader2,
  Save,
  Send,
  X,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

import type {
  HomeworkSubmission,
} from '../../api/homeworkApi';

import type {
  StudentHomeworkItem,
} from '../../services/homeworkService';

interface HomeworkSubmissionModalProps {
  item: StudentHomeworkItem;
  isOpen: boolean;
  isSaving: boolean;
  error: string | null;

  onClose: () => void;

  onSaveDraft: (
    answerText: string
  ) => Promise<void>;

  onSubmit: (
    answerText: string
  ) => Promise<void>;
}

function getInitialAnswer(
  submission: HomeworkSubmission | null
): string {
  return submission?.answer_text ?? '';
}

export default function HomeworkSubmissionModal({
  item,
  isOpen,
  isSaving,
  error,
  onClose,
  onSaveDraft,
  onSubmit,
}: HomeworkSubmissionModalProps) {
  const [answerText, setAnswerText] =
    useState('');

  useEffect(() => {
    if (isOpen) {
      setAnswerText(
        getInitialAnswer(item.submission)
      );
    }
  }, [
    isOpen,
    item.submission,
  ]);

  if (!isOpen) {
    return null;
  }

  const normalizedAnswer =
    answerText.trim();

  const canSubmit =
    normalizedAnswer.length > 0 &&
    !isSaving;

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      event.target === event.currentTarget &&
      !isSaving
    ) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-5 sm:p-6">
          <div className="pr-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {item.homework.title}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {item.lesson.topic ??
                'Домашнее задание'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Закрыть"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
          <section>
            <h3 className="text-sm font-semibold text-gray-900">
              Задание
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {item.homework.description}
            </p>
          </section>

          {item.homework.instructions && (
            <section className="rounded-xl bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Инструкции
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {item.homework.instructions}
              </p>
            </section>
          )}

          <section>
            <label
              htmlFor="homework-answer"
              className="text-sm font-semibold text-gray-900"
            >
              Ваш ответ
            </label>

            <textarea
              id="homework-answer"
              value={answerText}
              onChange={(event) =>
                setAnswerText(
                  event.target.value
                )
              }
              disabled={isSaving}
              rows={10}
              maxLength={20000}
              placeholder="Напишите ответ на домашнее задание..."
              className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:ring-4 focus:ring-red-50 disabled:bg-gray-50"
            />

            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>
                Ответ можно сохранить как черновик
              </span>

              <span>
                {answerText.length}/20000
              </span>
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <p className="text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={() =>
              void onSaveDraft(answerText)
            }
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Сохранить черновик
          </button>

          <button
            type="button"
            onClick={() =>
              void onSubmit(answerText)
            }
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}

            Отправить преподавателю
          </button>
        </div>
      </div>
    </div>
  );
}