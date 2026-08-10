import { readFileSync } from 'node:fs';

const files = [
  'src/api/academicApi.ts',
  'src/api/attendanceApi.ts',
  'src/api/homeworkApi.ts',
  'src/api/scheduleApi.ts',
  'src/services/parentAttendanceService.ts',
  'src/services/parentHomeworkService.ts',
  'src/services/parentProgressService.ts',
  'src/services/parentScheduleService.ts',
];
const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
for (const endpoint of [
  '/api/v1/group-members/parent/children/',
  '/api/v1/attendance/parent/children/',
  '/api/v1/lessons/parent/children/',
  '/api/v1/homeworks/parent/children/',
  '/api/v1/homework-submissions/parent/children/',
]) {
  if (!source.includes(endpoint)) throw new Error(`Missing parent endpoint: ${endpoint}`);
}
for (const mock of ['Александр Иванов', 'Frontend-2026-A']) {
  if (source.includes(mock)) throw new Error(`Mock data leaked into parent integration: ${mock}`);
}
const parentServices = files.filter((file) => file.includes('/services/parent')).map((file) => readFileSync(file, 'utf8')).join('\\n');
if (parentServices.includes('getStudentAttendance(\\n      studentId') || parentServices.includes('getPublishedHomeworks()')) {
  throw new Error('Parent integration still uses a broad student-wide content query');
}
console.log('parent integration regression check passed');
