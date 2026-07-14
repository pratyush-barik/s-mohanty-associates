'use client';

import SectionWrapper from '@/components/ui/SectionWrapper';

const featuredClients = [
  { name: 'State Bank of India', abbr: 'SBI' },
  { name: 'Punjab National Bank', abbr: 'PNB' },
  { name: 'LIC Housing Finance', abbr: 'LICHF' },
  { name: 'Union Bank of India', abbr: 'UBI' },
  { name: 'Bank of Baroda', abbr: 'BOB' },
  { name: 'Indian Overseas Bank', abbr: 'IOB' },
];

const carouselClients = [
  'SBI', 'PNB', 'LIC Housing', 'Union Bank', 'Bank of Baroda', 'IOB',
  'Canara Bank', 'HDFC Bank', 'Axis Bank', 'UCO Bank', 'Central Bank', 'Bank of India',
  'Indian Bank', 'IDBI Bank', 'Allahabad Bank', 'Syndicate Bank',
];

export default function Clients() {
  return (
    <section id="clients" className="section relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#b8860b]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto max-w-[1280px] px-6 relative z-10">
        {/* Section Header */}
        <SectionWrapper animation="fadeUp" className="text-center mb-16">
          <span className="text-[#b8860b] text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Trusted By</span>
          <h2 className="section-title">Our <span className="gradient-text">Clients</span></h2>
          <div className="section-divider" />
          <p className="section-subtitle">
            Partnering with India&apos;s leading financial institutions and government organizations.
          </p>
        </SectionWrapper>

        {/* Featured Clients Grid */}
        <SectionWrapper animation="fadeUp" delay={0.1} className="mb-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {featuredClients.map((client, index) => (
              <div
                key={client.name}
                className="group card flex flex-col items-center justify-center py-6 px-4 text-center h-[140px]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Placeholder Logo */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#b8860b]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-[#1e3a5f] font-bold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                    {client.abbr}
                  </span>
                </div>
                <p className="text-xs text-[#6c757d] font-medium leading-tight">
                  {client.name}
                </p>
              </div>
            ))}
          </div>
        </SectionWrapper>

        {/* Infinite Carousel */}
        <SectionWrapper animation="fadeUp" delay={0.2}>
          <div className="relative overflow-hidden py-4">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            {/* Scrolling Track */}
            <div className="carousel-track flex gap-8 w-max">
              {/* Duplicate items for infinite loop */}
              {[...carouselClients, ...carouselClients].map((client, index) => (
                <div
                  key={`${client}-${index}`}
                  className="flex-shrink-0 px-6 py-3 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] hover:border-[#b8860b]/30 hover:bg-[#b8860b]/5 transition-all duration-300 cursor-default"
                >
                  <span className="text-sm font-semibold text-[#495057] whitespace-nowrap">
                    {client}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionWrapper>
      </div>
    </section>
  );
}
