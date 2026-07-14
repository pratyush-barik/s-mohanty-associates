'use client';

import SectionWrapper from '@/components/ui/SectionWrapper';

const achievements = [
  { label: 'Years of Practice', value: '28+' },
  { label: 'Valuations Completed', value: '2500+' },
  { label: 'Bank Empanelments', value: '15+' },
  { label: 'Court Appearances', value: '200+' },
];

const expertise = [
  'Property & Real Estate Valuation',
  'Land Acquisition & Compensation',
  'Plant & Machinery Assessment',
  'Insurance Claim Valuations',
  'Court-Directed Valuations',
  'SARFAESI Act Compliance',
];

export default function CEOProfile() {
  return (
    <section id="ceo" className="section section-dark relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#b8860b]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#1e3a5f]/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-[1280px] px-6 relative z-10">
        {/* Section Header */}
        <SectionWrapper animation="fadeUp" className="text-center mb-16">
          <span className="text-[#ffcb47] text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Leadership</span>
          <h2 className="section-title text-white">Our <span className="gradient-text">Founder</span></h2>
          <div className="section-divider" />
        </SectionWrapper>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start max-w-6xl mx-auto">
          {/* Profile Image */}
          <SectionWrapper animation="fadeRight" delay={0.1} className="lg:col-span-2">
            <div className="relative group">
              {/* Image Container */}
              <div className="relative overflow-hidden rounded-2xl aspect-[3/4] max-w-[360px] mx-auto">
                {/* Placeholder profile */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#162d4a] to-[#0f2038] flex flex-col items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center mb-4 border-2 border-white/10">
                    <svg className="w-16 h-16 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <p className="text-white/40 text-sm">Founder Photo</p>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent opacity-60" />
              </div>

              {/* Decorative Frame */}
              <div className="absolute -top-3 -right-3 w-full h-full rounded-2xl border-2 border-[#b8860b]/20 pointer-events-none" />

              {/* Name Badge */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass rounded-xl p-4 text-center">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    S. Mohanty
                  </h3>
                  <p className="text-[#ffcb47] text-sm font-medium">Founder & Chief Valuer</p>
                </div>
              </div>
            </div>
          </SectionWrapper>

          {/* Profile Content */}
          <SectionWrapper animation="fadeLeft" delay={0.2} className="lg:col-span-3">
            <div className="space-y-8">
              {/* Bio */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Mr. Sanjay Mohanty
                </h3>
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">B.E. (Civil)</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">M.Tech</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">Chartered Engineer</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">Registered Valuer</span>
                </div>
                <p className="text-white/60 leading-relaxed mb-4">
                  A visionary leader with nearly three decades of experience in property valuation and engineering consultancy. 
                  Mr. Mohanty founded S Mohanty Associates in 1995 with a mission to deliver the most accurate, 
                  ethical, and comprehensive valuation services in India.
                </p>
                <p className="text-white/60 leading-relaxed">
                  His expertise spans residential, commercial, industrial, and agricultural property valuations, 
                  with extensive experience in court-directed valuations and expert witness testimony. He has been 
                  instrumental in establishing the firm&apos;s reputation as a trusted partner for India&apos;s leading banks 
                  and financial institutions.
                </p>
              </div>

              {/* Achievement Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {achievements.map((item) => (
                  <div key={item.label} className="card-dark text-center p-4">
                    <div className="text-2xl font-bold gradient-text mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                      {item.value}
                    </div>
                    <p className="text-xs text-white/40 font-medium">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Expertise */}
              <div>
                <h4 className="text-base font-semibold text-white mb-4">Areas of Expertise</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {expertise.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b8860b] flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionWrapper>
        </div>
      </div>
    </section>
  );
}
