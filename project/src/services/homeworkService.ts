import {
  getPublishedHomeworks,
  getStudentSubmissions,
  getVisibleHomeworkAttachments,
  type Homework,
  type HomeworkAttachment,
  type HomeworkSubmission,
} from '../api/homeworkApi';

import {
  getGroupLessons,
  type LessonSchedule,
} from '../api/scheduleApi';

export interface StudentHomeworkItem {
  homework: Homework;
  lesson: LessonSchedule;
  submission: HomeworkSubmission | null;
  attachments: HomeworkAttachment[];
  groupId: number;
  groupName: string;
}

export interface StudentHomeworkGroup {
  id: number;
  name: string;
}

export interface StudentHomeworkData {
  items: StudentHomeworkItem[];

  pendingCount: number;
  submittedCount: number;
  gradedCount: number;
  overdueCount: number;
}

function isGraded(
  submission: HomeworkSubmission | null
): boolean {
  return (
    submission?.status === 'accepted' ||
    submission?.status === 'rejected'
  );
}

function isSubmitted(
  submission: HomeworkSubmission | null
): boolean {
  return (
    submission?.status === 'submitted' ||
    submission?.status === 'in_review'
  );
}

function isOverdue(
  homework: Homework,
  submission: HomeworkSubmission | null
): boolean {
  if (!homework.due_at) {
    return false;
  }

  if (
    isGraded(submission) ||
    isSubmitted(submission)
  ) {
    return false;
  }

  return new Date(homework.due_at).getTime() <
    Date.now();
}

export async function loadStudentHomeworks(
  groups: StudentHomeworkGroup[],
  studentId: number
): Promise<StudentHomeworkData> {
  const [
    lessonsByGroup,
    homeworks,
    submissions,
  ] = await Promise.all([
    Promise.all(
      groups.map((group) =>
        getGroupLessons(group.id)
      )
    ),
    getPublishedHomeworks(),
    getStudentSubmissions(studentId),
  ]);

  const lessons = lessonsByGroup.flat();

  const lessonsById = new Map(
    lessons.map((lesson) => [
      lesson.id,
      lesson,
    ])
  );

  const groupNamesById = new Map(
    groups.map((group) => [
      group.id,
      group.name,
    ])
  );

  const submissionsByHomeworkId = new Map(
    submissions.map((submission) => [
      submission.homework_id,
      submission,
    ])
  );

  const groupHomeworks = homeworks.filter(
    (homework) =>
      lessonsById.has(homework.lesson_id)
  );

  const items = await Promise.all(
    groupHomeworks.map(
      async (
        homework
      ): Promise<StudentHomeworkItem> => {
        const lesson = lessonsById.get(
          homework.lesson_id
        );

        if (!lesson) {
          throw new Error(
            `Занятие №${homework.lesson_id} не найдено`
          );
        }

        let attachments: HomeworkAttachment[] =
          [];

        try {
          attachments =
            await getVisibleHomeworkAttachments(
              homework.id
            );
        } catch {
          attachments = [];
        }

        return {
          homework,
          lesson,
          submission:
            submissionsByHomeworkId.get(
              homework.id
            ) ?? null,
          attachments,
          groupId: lesson.group_id,
          groupName:
            groupNamesById.get(
              lesson.group_id
            ) ??
            `Группа №${lesson.group_id}`,
        };
      }
    )
  );

  items.sort((first, second) => {
    const firstDate =
      first.homework.due_at ??
      first.lesson.lesson_date;

    const secondDate =
      second.homework.due_at ??
      second.lesson.lesson_date;

    const dateComparison =
      firstDate.localeCompare(secondDate);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return first.groupName.localeCompare(
      second.groupName,
      'ru'
    );
  });

  return {
    items,

    pendingCount: items.filter(
      (item) =>
        !isGraded(item.submission) &&
        !isSubmitted(item.submission) &&
        !isOverdue(
          item.homework,
          item.submission
        )
    ).length,

    submittedCount: items.filter((item) =>
      isSubmitted(item.submission)
    ).length,

    gradedCount: items.filter((item) =>
      isGraded(item.submission)
    ).length,

    overdueCount: items.filter((item) =>
      isOverdue(
        item.homework,
        item.submission
      )
    ).length,
  };
}