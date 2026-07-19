export const todaysLessons = [
  { id: 1, time: '09:00', subject: 'React & Frontend', teacher: 'Анна Петрова', room: 'Ауд. 201', type: 'Лекция' },
  { id: 2, time: '11:00', subject: 'JavaScript Advanced', teacher: 'Дмитрий Соколов', room: 'Ауд. 105', type: 'Практика' },
  { id: 3, time: '14:00', subject: 'UI/UX Основы', teacher: 'Екатерина Лебедева', room: 'Ауд. 302', type: 'Семинар' },
];

export const homework = [
  { id: 1, subject: 'React & Frontend', title: 'Создать Todo App с хуками', due: 'Завтра, 23:59', status: 'pending' },
  { id: 2, subject: 'JavaScript Advanced', title: 'Реализовать debounce и throttle', due: '20 января, 23:59', status: 'pending' },
  { id: 3, subject: 'UI/UX Основы', title: 'Дизайн-макет мобильного приложения', due: '18 января, 23:59', status: 'submitted' },
  { id: 4, subject: 'Python', title: 'Скрипт для парсинга данных', due: '15 января, 23:59', status: 'graded' },
];

export const notifications = [
  { id: 1, title: 'Новое домашнее задание', text: 'По курсу React & Frontend добавлено задание', time: '5 мин назад', type: 'homework' },
  { id: 2, title: 'Оценка получена', text: 'Работа «Скрипт для парсинга данных» оценена на 95/100', time: '1 час назад', type: 'grade' },
  { id: 3, title: 'Расписание изменено', text: 'Занятие по UI/UX перенесено на 14:00', time: '3 часа назад', type: 'schedule' },
  { id: 4, title: 'Новое сообщение', text: 'Анна Петрова отправила вам сообщение', time: 'Вчера', type: 'message' },
];

export const upcomingEvents = [
  { id: 1, title: 'Защита проектов Frontend', date: '25 января', time: '10:00', location: 'Главный зал' },
  { id: 2, title: 'IT-встреча с компанией Kaspi', date: '28 января', time: '15:00', location: 'Ауд. 101' },
  { id: 3, title: 'Хакатон Almaty Tech', date: '5 февраля', time: '09:00', location: 'Офлайн' },
];

export const progressData = [
  { subject: 'Frontend', value: 85 },
  { subject: 'JavaScript', value: 78 },
  { subject: 'UI/UX', value: 92 },
  { subject: 'Python', value: 65 },
  { subject: 'Database', value: 70 },
];

export const weeklyActivity = [
  { day: 'Пн', value: 65 },
  { day: 'Вт', value: 80 },
  { day: 'Ср', value: 45 },
  { day: 'Чт', value: 90 },
  { day: 'Пт', value: 70 },
  { day: 'Сб', value: 55 },
  { day: 'Вс', value: 30 },
];

export const attendanceData = [
  { month: 'Сен', present: 18, absent: 2 },
  { month: 'Окт', present: 20, absent: 0 },
  { month: 'Ноя', present: 17, absent: 3 },
  { month: 'Дек', present: 19, absent: 1 },
  { month: 'Янв', present: 15, absent: 1 },
];

export const messages = [
  { id: 1, name: 'Анна Петрова', role: 'Преподаватель', preview: 'Отличная работа над последним заданием!', time: '10:30', unread: true },
  { id: 2, name: 'Дмитрий Соколов', role: 'Преподаватель', preview: 'Не забудьте про дедлайн завтра', time: 'Вчера', unread: true },
  { id: 3, name: 'Администрация', role: 'Школа', preview: 'Расписание на следующую неделю обновлено', time: 'Пн', unread: false },
];

export const schedule = [
  { day: 'Понедельник', lessons: [{ time: '09:00', subject: 'React & Frontend', room: '201', teacher: 'Петрова А.' }, { time: '11:00', subject: 'JavaScript', room: '105', teacher: 'Соколов Д.' }] },
  { day: 'Вторник', lessons: [{ time: '10:00', subject: 'UI/UX', room: '302', teacher: 'Лебедева Е.' }] },
  { day: 'Среда', lessons: [{ time: '09:00', subject: 'Python', room: '201', teacher: 'Кузнецова М.' }, { time: '13:00', subject: 'Database', room: '105', teacher: 'Соколов Д.' }] },
  { day: 'Четверг', lessons: [{ time: '11:00', subject: 'JavaScript', room: '105', teacher: 'Соколов Д.' }] },
  { day: 'Пятница', lessons: [{ time: '14:00', subject: 'React & Frontend', room: '201', teacher: 'Петрова А.' }] },
];

export const materials = [
  { id: 1, subject: 'React & Frontend', title: 'Хуки useState и useEffect', type: 'PDF', size: '2.4 MB' },
  { id: 2, subject: 'JavaScript Advanced', title: 'Асинхронный JavaScript', type: 'Видео', size: '145 MB' },
  { id: 3, subject: 'UI/UX Основы', title: 'Принципы дизайна — презентация', type: 'PDF', size: '8.1 MB' },
  { id: 4, subject: 'Python', title: 'Работа с библиотекой Pandas', type: 'Ноутбук', size: '1.2 MB' },
];

export const teacherGroups = [
  { id: 1, name: 'Frontend-2026-A', students: 12, course: 'React & Frontend', schedule: 'Пн, Ср, Пт' },
  { id: 2, name: 'Frontend-2026-B', students: 10, course: 'React & Frontend', schedule: 'Вт, Чт' },
  { id: 3, name: 'JavaScript-Pro', students: 8, course: 'JavaScript Advanced', schedule: 'Пн, Ср' },
];

export const teacherStudents = [
  { id: 1, name: 'Александр Иванов', group: 'Frontend-2026-A', progress: 85, attendance: 95 },
  { id: 2, name: 'Алина Смирнова', group: 'Frontend-2026-A', progress: 92, attendance: 100 },
  { id: 3, name: 'Тимур Жумабаев', group: 'Frontend-2026-B', progress: 78, attendance: 88 },
  { id: 4, name: 'Дана Ахметова', group: 'Frontend-2026-B', progress: 88, attendance: 92 },
  { id: 5, name: 'Ербол Тлеугабылов', group: 'JavaScript-Pro', progress: 72, attendance: 85 },
];

export const adminStats = {
  totalStudents: 1247,
  totalTeachers: 47,
  totalParents: 892,
  totalGroups: 38,
  totalBranches: 5,
  totalCourses: 11,
};

export const adminStudents = [
  { id: 1, name: 'Александр Иванов', email: 'student@vshp.kz', group: 'Frontend-2026-A', branch: 'Алматы-1', status: 'active' },
  { id: 2, name: 'Алина Смирнова', email: 'alina@example.kz', group: 'Frontend-2026-A', branch: 'Алматы-1', status: 'active' },
  { id: 3, name: 'Тимур Жумабаев', email: 'timur@example.kz', group: 'Frontend-2026-B', branch: 'Астана', status: 'active' },
  { id: 4, name: 'Дана Ахметова', email: 'dana@example.kz', group: 'UIUX-2026', branch: 'Алматы-2', status: 'paused' },
];

export const parentChildData = {
  name: 'Александр Иванов',
  group: 'Frontend-2026-A',
  attendance: 95,
  averageGrade: 85,
  courses: [
    { name: 'React & Frontend', grade: 88, teacher: 'Анна Петрова' },
    { name: 'JavaScript Advanced', grade: 82, teacher: 'Дмитрий Соколов' },
    { name: 'UI/UX Основы', grade: 90, teacher: 'Екатерина Лебедева' },
  ],
  recentHomework: [
    { id: 1, subject: 'React & Frontend', title: 'Создать Todo App', status: 'pending', due: 'Завтра' },
    { id: 2, subject: 'JavaScript', title: 'Debounce и throttle', status: 'submitted', due: '20 января' },
    { id: 3, subject: 'UI/UX', title: 'Дизайн-макет приложения', status: 'graded', due: '15 января' },
  ],
};
