'use client';

import SectionWrapper, { StaggerContainer, StaggerItem } from '@/components/ui/SectionWrapper';

const qualifications = [
  {
    category: 'Government Registration',
    items: [
      {
        title: 'Registered Valuer',
        subtitle: 'Ministry of Corporate Affairs, Govt. of India',
        detail: 'Registration No. IBBI/RV/02/2019/10594',
        icon: '🏛️',
      },
      {
        title: 'Approved Valuer',
        subtitle: 'Income Tax Department, Govt. of India',
        detail: 'Empanelled for Section 50C & 56 valuations',
        icon: '📋',
      },
    ],
  },
  {
    category: 'Professional Credentials',
    items: [
      {
        title: 'Chartered Engineer',
        subtitle: 'Institution of Engineers (India)',
        detail: 'Membership No. M-1560969',
        icon: '⚙️',
      },
      {
        title: 'Fellow Member — IOV',
        subtitle: 'Institution of Valuers, India',
        detail: 'Membership No. F-26377',
        icon: '🏅',
      },
    ],
  },
  {
    category: 'Academic Qualifications',
    items: [
      {
        title: 'B.E. (Civil Engineering)',
        subtitle: 'University College of Engineering',
        detail: 'Bachelor of Engineering — Civil',
        icon: '🎓',
      },
      {
        title: 'M.Tech (Structural Engineering)',
        subtitle: 'Post Graduate Studies',
        detail: 'Advanced Structural Analysis',
        icon: '📚',
      },
    ],
  },
  {
    category: 'Certifications & Memberships',
    items: [
      {
        title: 'RICS Certified',
        subtitle: 'Royal Institution of Chartered Surveyors',
        detail: 'International Valuation Standards',
        icon: '🌐',
      },
      {
        title: 'Member — IEI',
        subtitle: 'Institution of Engineers (India)',
        detail: 'Chartered Engineer Division',
        icon: '🔬',
      },
    ],
  },
];

export default function Qualifications() {
  return (
    <section id="qualifications" className="section section-light relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#b8860b]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-[1280px] px-6 relative z-10">
        {/* Section Header */}
        <SectionWrapper animation="fadeUp" className="text-center mb-16">
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
            <StaggerItem key={group.category} animation="scaleUp">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#0f2038] mb-4 flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
                  <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#b8860b]/10 to-[#b8860b]/5 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#b8860b]" />
                  </span>
                  {group.category}
                </h3>

                <div className="space-y-3">
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
