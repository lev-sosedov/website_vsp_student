import { getGroup, getParentChildGroupMemberships } from '../api/academicApi';
import { getParentChildAttendance, type AttendanceRecord } from '../api/attendanceApi';
import { getParentChildHomeworks, getParentChildSubmissions, type Homework, type HomeworkSubmission } from '../api/homeworkApi';
import { getParentChildren, type ParentStudentWithStudent } from '../api/parentStudentApi';
import { getParentChildGroupLessons, type LessonSchedule } from '../api/scheduleApi';

export interface ParentProgressChild { id: number; name: string; phoneNumber: string; email: string | null; avatarUrl: string | null; }
export interface ParentProgressGroup { id: number; name: string; }
export interface ParentProgressHomeworkItem { homework: Homework; submission: HomeworkSubmission | null; lesson: LessonSchedule; groupId: number; groupName: string; }
export interface ParentProgressAttendanceItem { attendance: AttendanceRecord; lesson: LessonSchedule; groupId: number; groupName: string; }
export interface ParentProgressData { groups: ParentProgressGroup[]; homeworkItems: ParentProgressHomeworkItem[]; attendanceItems: ParentProgressAttendanceItem[]; hasActiveGroup: boolean; warnings: string[]; }
const EMPTY_DATA: ParentProgressData = { groups: [], homeworkItems: [], attendanceItems: [], hasActiveGroup: false, warnings: [] };
function childName(link: ParentStudentWithStudent): string { return [link.student.first_name, link.student.user_name, link.student.last_name].map((value) => value?.trim()).filter(Boolean).join(' ').trim() || `Студент №${link.student_id}`; }
export async function loadParentProgressChildren(parentId: number): Promise<ParentProgressChild[]> {
  if (!Number.isInteger(parentId) || parentId <= 0) throw new Error('Не удалось определить ID родителя');
  const links = await getParentChildren(parentId, true);
  return links.filter((link) => link.is_active && link.student.is_active).map((link) => ({ id: link.student_id, name: childName(link), phoneNumber: link.student.phone_number, email: link.student.email, avatarUrl: link.student.avatar_url })).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}
export async function loadParentChildProgress(studentId: number): Promise<ParentProgressData> {
  if (!Number.isInteger(studentId) || studentId <= 0) throw new Error('Не удалось определить ID ребёнка');
  const memberships = await getParentChildGroupMemberships(studentId);
  const groupIds = Array.from(new Set(memberships.map((membership) => membership.group_id)));
  if (groupIds.length === 0) return EMPTY_DATA;
  const warnings: string[] = [];
  const groupResults = await Promise.allSettled(groupIds.map((groupId) => getGroup(groupId)));
  const groups = groupResults.map((result, index) => ({ id: groupIds[index], name: result.status === 'fulfilled' ? (result.value.name?.trim() || `Группа №${groupIds[index]}`) : `Группа №${groupIds[index]}` })).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  if (groupResults.some((result) => result.status === 'rejected')) warnings.push('Не удалось получить названия некоторых групп.');
  const groupData = await Promise.all(groupIds.map(async (groupId) => {
    const [lessonsResponse, homeworkResponse, submissionsResponse, attendanceResponse] = await Promise.all([
      getParentChildGroupLessons(studentId, groupId),
      getParentChildHomeworks(studentId, groupId),
      getParentChildSubmissions(studentId, groupId),
      getParentChildAttendance(studentId, groupId),
    ]);
    return { groupId, lessons: lessonsResponse.items, homeworks: homeworkResponse.items, submissions: submissionsResponse.items, attendance: attendanceResponse.items };
  }));
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const homeworkItems: ParentProgressHomeworkItem[] = [];
  const attendanceItems: ParentProgressAttendanceItem[] = [];
  for (const data of groupData) {
    const lessons = new Map(data.lessons.map((lesson) => [lesson.id, lesson]));
    const submissions = new Map(data.submissions.map((submission) => [submission.homework_id, submission]));
    for (const homework of data.homeworks) {
      const lesson = lessons.get(homework.lesson_id);
      if (lesson) homeworkItems.push({ homework, submission: submissions.get(homework.id) ?? null, lesson, groupId: data.groupId, groupName: groupNames.get(data.groupId) ?? `Группа №${data.groupId}` });
    }
    for (const attendance of data.attendance) {
      const lesson = lessons.get(attendance.lesson_id);
      if (lesson) attendanceItems.push({ attendance, lesson, groupId: data.groupId, groupName: groupNames.get(data.groupId) ?? `Группа №${data.groupId}` });
    }
  }
  homeworkItems.sort((a, b) => (a.homework.due_at ?? a.lesson.lesson_date).localeCompare(b.homework.due_at ?? b.lesson.lesson_date));
  attendanceItems.sort((a, b) => b.lesson.lesson_date.localeCompare(a.lesson.lesson_date));
  return { groups, homeworkItems, attendanceItems, hasActiveGroup: groups.length > 0, warnings };
}