import { NewsItem, Teacher, Review } from '../types';

export const news: NewsItem[] = [
  {
    id: 1,
    title: 'Новый набор на курс по искусственному интеллекту',
    category: 'Образование',
    date: '15 января 2026',
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'Открываем запись на новую программу по машинному обучению и нейросетям. Старт — 1 февраля.',
  },
  {
    id: 2,
    title: 'Команда ВШП победила в хакатоне Almaty Tech Cup',
    category: 'События',
    date: '10 января 2026',
    image: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'Наши студенты заняли первое место в крупнейшем IT-хакатоне года, представив решение для логистики.',
  },
  {
    id: 3,
    title: 'Партёрство с международной IT-компанией',
    category: 'Новости школы',
    date: '5 января 2026',
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'Подписан меморандум о сотрудничестве — стажировки и гарантированные собеседования для лучших выпускников.',
  },
];



export const teachers: Teacher[] = [
  {
    id: 1,
    name: 'Анна Петрова',
    specialization: 'Frontend & React',
    experience: '8 лет опыта',
    technologies: ['React', 'TypeScript', 'Next.js', 'Tailwind'],
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 2,
    name: 'Дмитрий Соколов',
    specialization: 'Backend & Node.js',
    experience: '10 лет опыта',
    technologies: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 3,
    name: 'Екатерина Лебедева',
    specialization: 'UI/UX Design',
    experience: '6 лет опыта',
    technologies: ['Figma', 'Webflow', 'Framer', 'Прототипирование'],
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 4,
    name: 'Игорь Волков',
    specialization: 'Game Development',
    experience: '12 лет опыта',
    technologies: ['Unity', 'C#', 'Unreal Engine', 'Blender'],
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 5,
    name: 'Мария Кузнецова',
    specialization: 'AI & Machine Learning',
    experience: '9 лет опыта',
    technologies: ['Python', 'TensorFlow', 'PyTorch', 'NLP'],
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 6,
    name: 'Сергей Морозов',
    specialization: 'Mobile Development',
    experience: '7 лет опыта',
    technologies: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

export const reviews: Review[] = [
  {
    id: 1,
    name: 'Алина Смирнова',
    course: 'Frontend разработка',
    rating: 5,
    text: 'За 9 месяцев я прошла путь от нуля до уверенного разработчика. Учителя всегда поддерживали, а реальные проекты в портфолио помогли мне устроиться в IT-компанию.',
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Тимур Жумабаев',
    course: 'Backend & Node.js',
    rating: 5,
    text: 'Практика с первого дня — это правда. Мы не просто слушали лекции, а сразу писали код и деплоили приложения. Сейчас работаю бэкенд-разработчиком.',
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 3,
    name: 'Дана Ахметова',
    course: 'UI/UX Design',
    rating: 5,
    text: 'Школа помогла мне собрать сильное портфолио и подготовиться к собеседованиям. Преподаватели практикующие дизайнеры, их фидбек бесценен.',
    photo: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];



export const whyChooseUs = [
  { icon: 'Rocket', title: 'Практика с первого дня', description: 'Учимся на реальных проектах, а не только по теории.' },
  { icon: 'GraduationCap', title: 'Опытные преподаватели', description: 'Практикующие специалисты из ведущих IT-компаний.' },
  { icon: 'FolderGit2', title: 'Реальные проекты', description: 'Каждый студент собирает портфолио из 5+ проектов.' },
  { icon: 'Briefcase', title: 'Помощь в трудоустройстве', description: 'Подготовка к собеседованиям и связь с партнёрами.' },
  { icon: 'Cpu', title: 'Современные технологии', description: 'Актуальный стек: React, Node.js, Python, AI и более.' },
  { icon: 'Users', title: 'Малые группы', description: 'До 12 человек в группе — максимум внимания каждому.' },
  { icon: 'Award', title: 'Сертификаты', description: 'Официальный сертификат по итогам обучения.' },
  { icon: 'TrendingUp', title: 'Современная образовательная платформа', description: 'Расписание, материалы и задания онлайн.' },
];
