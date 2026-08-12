'use client';

import SectionWrapper, { StaggerContainer, StaggerItem } from '@/components/ui/SectionWrapper';

const qualifications = [
  {
    category: 'Government Registration',
    items: [
      {
        title: 'Registered Valuer (Land & Building)',
        subtitle: 'IBBI',
        detail: 'Regd. No: IBBI/RV/02/2019/10594',
        icon: '🏛️',
      },
      {
        title: 'Registered Valuer (Wealth Tax Act)',
        subtitle: 'Income Tax Department',
        detail: 'Regd. No: 107/2016-17',
        icon: '📋',
      },
      {
        title: 'Registered Technical Person',
        subtitle: 'Town Planning Department, Govt. of Odisha',
        detail: 'RTP/DTP(C.ER)-310/2021',
        icon: '📝',
      },
    ],
  },
  {
    category: 'Professional Credentials',
    items: [
      {
        title: 'Corporate Member & Chartered Engineer',
        subtitle: 'Institution of Engineers (India), Civil Division',
        detail: 'M-1560969',
        icon: '⚙️',
      },
      {
        title: 'Fellow Member — IOV',
        subtitle: 'Institution of Valuers (IOV), Delhi',
        detail: 'F-26377',
        icon: '🏅',
      },
      {
        title: 'Fellow Member — IIV',
        subtitle: 'Indian Institution of Valuers (IIV), Pune',
        detail: 'F-4443',
        icon: '🏅',
      },
    ],
  },
  {
    category: 'Academic Qualifications',
    items: [
      {
        title: 'M. Tech in Civil Engineering (Structural & Foundation)',
        subtitle: 'Biju Patnaik University of Technology',
        detail: '(2022-2024)',
        icon: '🎓',
      },
      {
        title: 'M.Sc. in Real Estate Valuation (Land & Building)',
        subtitle: 'Annamalai University',
        detail: '(2018–2020)',
        icon: '🎓',
      },
      {
        title: 'M. Tech in Civil Engineering (Highway Engineering)',
        subtitle: 'Karnataka State Open University',
        detail: '(2012-2014)',
        icon: '🎓',
      },
      {
        title: 'MBA (Finance)',
        subtitle: 'Bijupattnaik university-BPUT',
        detail: '(2026-2028)',
        icon: '📚',
      },
      {
        title: 'MBA (Human Resource)',
        subtitle: 'Punjab Technical University',
        detail: '(2009–2011)',
        icon: '📚',
      },
      {
        title: 'B.E. in Civil Engineering',
        subtitle: 'Utkal University, KIIT',
        detail: '(1998–2002)',
        icon: '🎓',
      },
    ],
  },
];

export default function Qualifications() {
  return (
    <section id="qualifications" className="section section-light relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#b8860b]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-[1600px] px-6 relative z-10">
        {/* Section Header */}
        <SectionWrapper animation="fadeUp" className="text-center mb-8">
          <span className="text-[#b8860b] text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Credentials</span>
          <h2 className="section-title">Qualifications & <span className="gradient-text">Certifications</span></h2>
          <div className="section-divider" />
          <p className="section-subtitle">
            Recognized credentials that underscore our commitment to professional excellence and regulatory compliance.
          </p>
        </SectionWrapper>

        {/* Qualification Groups */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8" staggerDelay={0.15}>
          {qualifications.map((group) => (
            <StaggerItem key={group.category} animation="scaleUp" className={group.category === 'Academic Qualifications' ? 'md:col-span-2' : ''}>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#0f2038] mb-4 flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
                  <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#b8860b]/10 to-[#b8860b]/5 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#b8860b]" />
                  </span>
                  {group.category}
                </h3>

                <div className={group.category === 'Academic Qualifications' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'}>
                  {group.items.map((item) => (
                    <div
                      key={item.title}
                      className="card group flex items-start gap-4 p-5"
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#b8860b]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-[#0f2038] mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>
                          {item.title}
                        </h4>
                        <p className="text-sm text-[#6c757d] mb-1">{item.subtitle}</p>
                        <p className="text-xs text-[#b8860b] font-medium">{item.detail}</p>
                      </div>

                      {/* Badge */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
