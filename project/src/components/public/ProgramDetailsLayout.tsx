import type { ElementType } from 'react';
import * as Icons from 'lucide-react';
import {ArrowLeft, CheckCircle2, Clock3, GraduationCap, Monitor, Users,} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProgramDetails } from '../../data/public/programDetails.types';

interface ProgramDetailsLayoutProps {program: ProgramDetails;}

export default function ProgramDetailsLayout({
  program,
}: ProgramDetailsLayoutProps) {
    const ProgramIcon =
    (Icons as unknown as Record<string, ElementType>)[program.icon] ||
    Icons.Code2;

  return (
    <>
      <section className="pt-32 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/programs"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Все направления
          </Link>

          <div className="max-w-4xl">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <ProgramIcon className="w-7 h-7 text-red-600" />
            </div>

            <p className="text-red-600 text-sm font-semibold mb-2">
              {program.eyebrow}
            </p>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
              {program.title}
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed max-w-3xl">
              {program.description}
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <InfoItem
              icon={Clock3}
              label="Продолжительность"
              value={program.duration}
            />

            <InfoItem
              icon={Monitor}
              label="Формат"
              value={program.format}
            />

            <InfoItem
              icon={GraduationCap}
              label="Уровень"
              value={program.level}
            />

            <InfoItem
              icon={Users}
              label="Возраст"
              value={program.age}
            />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-14">
              <ContentSection
                title={program.aboutTitle}
                text={program.aboutText}
              />

              <ListSection
                title={program.technologiesTitle}
                items={program.technologies}
                columns={2}
              />

              <ListSection
                title={program.topicsTitle}
                items={program.topics}
                columns={2}
              />

              <ListSection
                title={program.projectsTitle}
                items={program.projects}
                columns={1}
              />

              <ListSection
                title={program.resultsTitle}
                items={program.results}
                columns={1}
              />
            </div>

            <aside>
              <div className="bg-gray-50 rounded-2xl p-6 lg:sticky lg:top-28">
                <h2 className="text-xl font-bold text-gray-900 mb-5">
                  {program.audienceTitle}
                </h2>

                <ul className="space-y-4">
                  {program.audience.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/contacts"
                  className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Записаться на обучение
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

interface InfoItemProps {
  icon: ElementType;
  label: string;
  value: string;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-red-600" />
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

interface ContentSectionProps {
  title: string;
  text: string;
}

function ContentSection({ title, text }: ContentSectionProps) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">
        {title}
      </h2>

      <p className="text-gray-500 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

interface ListSectionProps {
  title: string;
  items: string[];
  columns: 1 | 2;
}

function ListSection({ title, items, columns }: ListSectionProps) {
  const gridClass =
    columns === 2
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
      : 'grid grid-cols-1 gap-4';

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        {title}
      </h2>

      <ul className={gridClass}>
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 bg-gray-50 rounded-xl p-4"
          >
            <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

            <span className="text-sm text-gray-700 leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}