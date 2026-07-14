'use client';

import { useState } from 'react';
import SectionWrapper, { StaggerContainer, StaggerItem } from '@/components/ui/SectionWrapper';

const services = [
  {
    icon: '🏠',
    title: 'Property Valuation',
    description: 'Comprehensive valuation of residential and commercial properties for sale, purchase, mortgage, and investment purposes.',
    details: 'Market value assessment, fair value determination, distress sale value, and insurance replacement value calculations.',
    gradient: 'from-blue-500/10 to-indigo-500/10',
    border: 'hover:border-blue-300',
  },
  {
    icon: '🌍',
    title: 'Land Valuation',
    description: 'Accurate land assessment considering location, zoning, development potential, and market dynamics.',
    details: 'Agricultural land, industrial plots, residential plots, and mixed-use land parcels across urban and rural areas.',
    gradient: 'from-green-500/10 to-emerald-500/10',
    border: 'hover:border-green-300',
  },
  {
    icon: '🏗️',
    title: 'Building Valuation',
    description: 'Structural assessment and valuation of buildings including depreciation analysis and reconstruction cost estimates.',
    details: 'Depreciation calculation, remaining life assessment, cost of construction, and structural integrity evaluation.',
    gradient: 'from-orange-500/10 to-amber-500/10',
    border: 'hover:border-orange-300',
  },
  {
    icon: '🏭',
    title: 'Industrial Valuation',
    description: 'Specialized valuation of industrial facilities, machinery, plant equipment, and manufacturing units.',
    details: 'Factory premises, warehouses, plant & machinery, industrial estates, and special economic zone properties.',
    gradient: 'from-purple-500/10 to-violet-500/10',
    border: 'hover:border-purple-300',
  },
  {
    icon: '🏦',
    title: 'Bank Valuation',
    description: 'Valuations meeting regulatory requirements of nationalized and private banks for loan processing.',
    details: 'Mortgage valuations, collateral assessments, NPA property valuations, and SARFAESI Act compliance reports.',
    gradient: 'from-cyan-500/10 to-teal-500/10',
    border: 'hover:border-cyan-300',
  },
  {
    icon: '🛡️',
    title: 'Insurance Valuation',
    description: 'Determining insurable value of properties for adequate coverage and claim settlement.',
    details: 'Reinstatement value, indemnity value, agreed value assessments, and post-loss valuations for claim processing.',
    gradient: 'from-rose-500/10 to-pink-500/10',
    border: 'hover:border-rose-300',
  },
  {
    icon: '🏛️',
    title: 'Government Valuation',
    description: 'Valuations for government acquisitions, stamp duty assessment, and public infrastructure projects.',
    details: 'Land acquisition compensation, stamp duty valuation, court-directed valuations, and municipal property assessments.',
    gradient: 'from-yellow-500/10 to-[#b8860b]/10',
    border: 'hover:border-yellow-400',
  },
];

export default function Services() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="services" className="section section-dark relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#b8860b]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1e3a5f]/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-[1280px] px-6 relative z-10">
        {/* Section Header */}
        <SectionWrapper animation="fadeUp" className="text-center mb-16">
          <span className="text-[#ffcb47] text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">What We Offer</span>
          <h2 className="section-title text-white">Our <span className="gradient-text">Services</span></h2>
          <div className="section-divider" />
          <p className="section-subtitle text-white/50">
            Comprehensive property valuation services tailored to meet the diverse needs of our clients across all sectors.
          </p>
        </SectionWrapper>

        {/* Service Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" staggerDelay={0.08}>
          {services.map((service, index) => (
            <StaggerItem key={service.title} animation="scaleUp">
              <div
                className={`card-dark group cursor-pointer relative overflow-hidden h-full ${service.border}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                    {service.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-3">
                    {service.description}
                  </p>

                  {/* Expanded Details on Hover */}
                  <div className={`overflow-hidden transition-all duration-500 ${
                    hoveredIndex === index ? 'max-h-[100px] opacity-100 mt-3 pt-3 border-t border-white/10' : 'max-h-0 opacity-0'
                  }`}>
                    <p className="text-xs text-[#ffcb47]/80 leading-relaxed">
                      {service.details}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
