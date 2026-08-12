'use client';

import SectionWrapper, { StaggerContainer, StaggerItem } from '@/components/ui/SectionWrapper';

const values = [
  {
    icon: '🎯',
    title: 'Accuracy',
    description: 'Every valuation is backed by thorough research, market analysis, and adherence to recognized standards.',
  },
  {
    icon: '🤝',
    title: 'Integrity',
    description: 'We uphold the highest ethical standards, delivering unbiased and transparent valuation reports.',
  },
  {
    icon: '⚡',
    title: 'Efficiency',
    description: 'Timely delivery without compromising quality — our streamlined processes ensure rapid turnaround.',
  },
  {
    icon: '🏛️',
    title: 'Compliance',
    description: 'Full compliance with government regulations, banking norms, and industry best practices.',
  },
];

const timeline = [
  { year: '2016', title: 'Foundation', description: 'S Mohanty Associates established in Bhubaneswar, Odisha as a registered valuation firm.' },
  { year: '2017', title: 'Banking Partnerships', description: 'Empaneled with major private sector and nationalized banks, including: State Bank of India (SBI), HDFC Bank, ICICI Bank, Axis Bank, Punjab National Bank (PNB), UCO Bank, and Canara Bank.' },
  { year: '2021', title: 'Regional Expansion', description: 'Expanded operations across Odisha and Eastern India with a growing team of qualified engineers.' },
  { year: '2023', title: 'Digital Transformation', description: 'Adopted digital workflows and modern valuation methodologies for enhanced precision.' },
  { year: '2024', title: 'Industry Leadership', description: 'Over 75000+ completed valuations with recognition as a trusted valuation partner across India.' },
];

export default function About() {
  return (
    <section id="about" className="section relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#b8860b]/5 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#1a5c3a]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-[1280px] px-6 relative z-10">
        {/* Section Header */}
        <SectionWrapper animation="fadeUp" className="text-center mb-8">
          <span className="text-[#b8860b] text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Who We Are</span>
          <h2 className="section-title">About <span className="gradient-text">S Mohanty Associates</span></h2>
          <div className="section-divider" />
          <p className="section-subtitle">
            A legacy of trust, precision, and professional excellence in property valuation spanning nearly three decades.
          </p>
        </SectionWrapper>

        {/* Company Overview */}
        <SectionWrapper animation="fadeUp" delay={0.1} className="mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="glass-light rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-[#0d3d24] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                    Our Vision
                  </h3>
                  <p className="text-[#4a6f4a] leading-relaxed">
                    To be the most trusted and technologically advanced property valuation firm in India, 
                    setting industry benchmarks for accuracy, transparency, and client satisfaction.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#0d3d24] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                    Our Mission
                  </h3>
                  <p className="text-[#4a6f4a] leading-relaxed">
                    To deliver comprehensive, court-recognized property valuations that empower informed 
                    decision-making for financial institutions, government bodies, and private clients through 
                    expertise, innovation, and unwavering ethical standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionWrapper>

        {/* Core Values */}
        <SectionWrapper animation="fadeUp" delay={0.15} className="mb-20">
          <h3 className="text-2xl font-bold text-center text-[#0d3d24] mb-10" style={{ fontFamily: 'var(--font-heading)' }}>
            Core Values
          </h3>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
            {values.map((value) => (
              <StaggerItem key={value.title} animation="scaleUp">
                <div className="card text-center h-full">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h4 className="text-lg font-bold text-[#0d3d24] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    {value.title}
                  </h4>
                  <p className="text-sm text-[#6b8f6b] leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </SectionWrapper>

        {/* Timeline */}
        <SectionWrapper animation="fadeUp" delay={0.2}>
          <h3 className="text-2xl font-bold text-center text-[#0d3d24] mb-12" style={{ fontFamily: 'var(--font-heading)' }}>
            Our Journey
          </h3>
          <div className="relative max-w-3xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-[20px] md:left-1/2 md:-translate-x-[1px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#b8860b]/20 via-[#b8860b]/40 to-[#b8860b]/20" />
            
            <StaggerContainer className="space-y-10" staggerDelay={0.15}>
              {timeline.map((item, index) => (
                <StaggerItem key={item.year} animation={index % 2 === 0 ? 'fadeRight' : 'fadeLeft'}>
                  <div className={`relative flex items-start gap-6 md:gap-0 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}>
                    {/* Timeline dot */}
                    <div className="absolute left-[14px] md:left-1/2 md:-translate-x-1/2 w-3 h-3 rounded-full bg-[#b8860b] border-4 border-white shadow-md z-10 mt-2" />
                    
                    {/* Content */}
                    <div className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${
                      index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'
                    }`}>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#b8860b]/10 text-[#b8860b] text-sm font-bold mb-2">
                        {item.year}
                      </span>
                      <h4 className="text-lg font-bold text-[#0d3d24] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                        {item.title}
                      </h4>
                      <p className="text-sm text-[#6b8f6b] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </SectionWrapper>
      </div>
    </section>
  );
}
