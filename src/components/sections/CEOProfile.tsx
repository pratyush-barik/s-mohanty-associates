'use client';

import Image from 'next/image';
import SectionWrapper from '@/components/ui/SectionWrapper';



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
    <section id="ceo" className="section section-dark relative overflow-hidden min-h-screen flex flex-col justify-center">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#b8860b]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#1e3a5f]/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-[1920px] px-6 relative z-10">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-stretch">
          {/* Profile Image */}
          <SectionWrapper animation="fadeRight" delay={0.1} className="lg:col-span-2 relative h-full">
            <div className="relative group w-full h-full min-h-[400px] lg:min-h-full rounded-2xl overflow-hidden">
              {/* Image Container */}
              <div className="relative w-full h-full">
                {/* Founder Photo */}
                <Image
                  src="/images/founder.jpeg"
                  alt="Mr. Satyajit Mohanty - Founder & Chief Executive"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 360px"
                  quality={100}
                  unoptimized={true}
                  priority
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/20 to-transparent opacity-80 pointer-events-none" />
              </div>

              {/* Name Badge */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass rounded-xl p-4 text-center">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Satyajit Mohanty
                  </h3>
                  <p className="text-[#ffcb47] text-sm font-medium">Founder & Chief Executive</p>
                </div>
              </div>
            </div>
          </SectionWrapper>

          {/* Profile Content */}
          <SectionWrapper animation="fadeLeft" delay={0.2} className="lg:col-span-3">
            <div className="space-y-8">
              {/* Section Header (Moved to right column) */}
              <div className="text-center mb-10">
                <span className="text-[#ffcb47] text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Leadership</span>
                <h2 className="section-title text-white">Our <span className="gradient-text">Founder</span></h2>
                <div className="section-divider" />
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Mr. Satyajit Mohanty
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-[#1e3a5f]/20 text-[#ffcb47] text-xs font-medium">M.Tech (Structural)</span>
                  <span className="px-3 py-1 rounded-full bg-[#1e3a5f]/20 text-[#ffcb47] text-xs font-medium">M.Tech (Highway)</span>
                  <span className="px-3 py-1 rounded-full bg-[#1e3a5f]/20 text-[#ffcb47] text-xs font-medium">M.Sc (Valuation)</span>
                  <span className="px-3 py-1 rounded-full bg-[#1e3a5f]/20 text-[#ffcb47] text-xs font-medium">MBA (HR)</span>
                  <span className="px-3 py-1 rounded-full bg-[#1e3a5f]/20 text-[#ffcb47] text-xs font-medium">B.E. (Civil)</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">Chartered Engineer</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">Fellow Member</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">Registered Valuer</span>
                  <span className="px-3 py-1 rounded-full bg-[#b8860b]/20 text-[#ffcb47] text-xs font-medium">Registered Technical Person</span>
                </div>
                <p className="text-white/60 leading-relaxed mb-4">
                  A seasoned Civil Engineering professional with over two decades of diverse experience in real estate valuation, technical due diligence, construction funding, project execution, feasibility studies, and infrastructure advisory. Specializing in mortgage valuation and technical consultancy for banks, NBFCs, financial institutions, and corporate clients. As the Founder of S Mohanty Associates, he leads a growing professional network delivering comprehensive and reliable land, building, and corporate valuation solutions across Pan India, with a strong focus on technical excellence, accuracy, and professional integrity.
                </p>

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
