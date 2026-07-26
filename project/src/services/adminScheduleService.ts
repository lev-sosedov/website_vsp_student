import {
  type AcademicBranch,
  type AcademicDirection,
  type AcademicEducationPlan,
} from '../api/academicApi';
import {
  type UserProfile,
} from '../api/userApi';
import {
  getLessons,
  getRooms,
  getScheduleChanges,
  getScheduleTemplates,
  type LessonSchedule,
  type Room,
  type ScheduleChange,
  type ScheduleTemplate,
} from '../api/scheduleApi';
import {
  getAdminGroupBranchName,
  getAdminGroupTeacherName,
  loadAdminGroups,
  type AdminGroupItem,
} from './adminGroupsService';

export interface AdminScheduleData {
  groups: AdminGroupItem[];
  branches: AcademicBranch[];
  directions: AcademicDirection[];
  educationPlans: AcademicEducationPlan[];
  teachers: UserProfile[];
  rooms: Room[];
  lessons: LessonSchedule[];
  templates: ScheduleTemplate[];
  changes: ScheduleChange[];
}

export async function loadAdminSchedule(
  dateFrom: string,
  dateTo: string
): Promise<AdminScheduleData> {
  const [groupData, rooms, lessons, templates, changes] =
    await Promise.all([
      loadAdminGroups(),
      getRooms(undefined, null),
      getLessons({
        dateFrom,
        dateTo,
        limit: 500,
      }),
      getScheduleTemplates({
        limit: 500,
      }),
      getScheduleChanges({
        limit: 500,
      }),
    ]);

  lessons.sort(
    (first, second) =>
      first.lesson_date.localeCompare(
        second.lesson_date
      ) ||
      first.start_time.localeCompare(
        second.start_time
      )
  );

  templates.sort(
    (first, second) =>
      first.weekday - second.weekday ||
      first.start_time.localeCompare(
        second.start_time
      )
  );

  changes.sort((first, second) =>
    second.created_at.localeCompare(
      first.created_at
    )
  );

  return {
    groups: groupData.items,
    branches: groupData.branches,
    directions: groupData.directions,
    educationPlans: groupData.educationPlans,
    teachers: groupData.teachers,
    rooms,
    lessons,
    templates,
    changes,
  };
}

export function getScheduleGroupName(
  groupId: number,
  groups: AdminGroupItem[]
): string {
  return (
    groups.find(
      (item) => item.group.id === groupId
    )?.group.name ?? 'Группа не найдена'
  );
}

export function getScheduleTeacherName(
  teacherId: number,
  groups: AdminGroupItem[]
): string {
  const teacher = groups.find(
    (item) => item.teacher?.id === teacherId
  )?.teacher;

  if (teacher) {
    return getAdminGroupTeacherName(teacher);
  }

  const profile = groups
    .flatMap((item) =>
      item.teacher ? [item.teacher] : []
    )
    .find((item) => item.id === teacherId);

  return profile
    ? getAdminGroupTeacherName(profile)
    : 'Преподаватель не найден';
}

export function getScheduleRoomName(
  roomId: number,
  rooms: Room[]
): string {
  return (
    rooms.find((room) => room.id === roomId)
      ?.name ?? 'Кабинет не найден'
  );
}

export function getScheduleBranchName(
  item: AdminGroupItem
): string {
  return (
    item.branchName ||
    getAdminGroupBranchName(item.branch, [])
  );
}
