'use client';

import Image from 'next/image';
import SectionWrapper from '@/components/ui/SectionWrapper';

const achievements = [
  { label: 'Years of Experience', value: '30+' },
  { label: 'Properties Valued', value: '10,000+' },
  { label: 'Buildings Designed', value: '500+' },
  { label: 'Bank Empanelments', value: '20+' },
];

const expertise = [
  'Property Valuation (Land & Building)',
  'Structural Design & Consultancy',
  'Structural Safety Audits & NDT',
  'Techno-Economic Feasibility Studies',
  'Project Management & Supervision',
  'Soil Investigation & Geotechnical Studies',
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
                {/* Founder Photo */}
                <Image
                  src="/images/founder.jpeg"
                  alt="Mr. Satyajit Mohanty - Founder & Managing Director"
                  fill
                  className="object-cover"
                  style={{ objectPosition: '47% center' }}
                  sizes="(max-width: 1024px) 100vw, 360px"
                  quality={100}
                  unoptimized={true}
                  priority
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent opacity-60" />
              </div>

              {/* Decorative Frame */}
              <div className="absolute -top-3 -right-3 w-full h-full rounded-2xl border-2 border-[#b8860b]/20 pointer-events-none" />

              {/* Name Badge */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass rounded-xl p-4 text-center">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Satyajit Mohanty
                  </h3>
                  <p className="text-[#ffcb47] text-sm font-medium">Founder & Managing Director</p>
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
                  Mr. Satyajit Mohanty
                </h3>
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">B.Sc. (Engg.) Civil</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">M.Tech (IIT Kharagpur)</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium" title="Membership No. M-1560969">Chartered Engineer (M-1560969)</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">Fellow - IE(I)</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium" title="Membership No. F-26377">Fellow - IOV (F-26377)</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium" title="Registration No. IBBI/RV/02/2019/10594">Registered Valuer (IBBI/RV/02/2019/10594)</span>
                </div>
                <p className="text-white/60 leading-relaxed mb-4">
                  A distinguished professional with over 30 years of experience in property valuation, structural design,
                  project management, and techno-economic feasibility studies. Mr. Mohanty founded S Mohanty &amp; Associates
                  in 1996 and has since valued over 10,000 properties across residential, commercial, industrial, and
                  agricultural categories for major banks, corporate houses, and government departments.
                </p>
                <p className="text-white/60 leading-relaxed">
                  A Registered Valuer under the Companies Act, 2013 (IBBI) and the Wealth Tax Act, 1957, he holds
                  fellowships with the Institution of Engineers (India) and the Institution of Valuers (India). He is
                  empanelled with leading nationalized and private banks including SBI, PNB, UCO Bank, Union Bank of India,
                  Bank of Baroda, Indian Bank, Canara Bank, and Bank of India.
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
