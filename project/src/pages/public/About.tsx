import { CheckCircle2 } from 'lucide-react';
import { stats } from '../../data/public/statsData';
import { aboutData } from '../../data/public/aboutData';
import aboutSchoolImage from '../../assets/images/about/about-school.webp';

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-red-600 text-sm font-semibold mb-2">
              {aboutData.eyebrow}
            </p>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
              {aboutData.title}
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed">
              {aboutData.description}
            </p>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-red-600">
                  {stat.value}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src={aboutSchoolImage}
                alt="Высшая школа программирования"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                {aboutData.missionTitle}
              </h2>

              <p className="text-gray-500 leading-relaxed mb-6">
                {aboutData.missionText}
              </p>

              <ul className="space-y-3">
                {aboutData.missionFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0" />

                    <span className="text-gray-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}