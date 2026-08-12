'use client';

import SectionWrapper from '@/components/ui/SectionWrapper';

const featuredClients = [
  { name: 'State Bank of India', image: '/images/clients/state-bank-of-india.png' },
  { name: 'HDFC Bank', image: '/images/clients/hdfc-bank.png' },
  { name: 'Axis Bank', image: '/images/clients/axis-bank.png' },
  { name: 'Kotak Mahindra Bank', image: '/images/clients/kotak-mahindra-bank.png' },
  { name: 'IDBI Bank', image: '/images/clients/idbi-bank.png' },
  { name: 'LIC Housing Finance', image: '/images/clients/lic-housing-finance.png' },
];

const carouselClients = [
  { name: 'UCO Bank', image: '/images/clients/uco-bank.png' },
  { name: 'Punjab National Bank', image: '/images/clients/punjab-national-bank.png' },
  { name: 'Canara Bank', image: '/images/clients/canara-bank.png' },
  { name: 'Bank of India', image: '/images/clients/bank-of-india.png' },
  { name: 'Bank of Maharashtra', image: '/images/clients/bank-of-maharashtra.png' },
  { name: 'Punjab & Sindh Bank', image: '/images/clients/punjab-and-sindh-bank.png' },
  { name: 'Union Bank of India', image: '/images/clients/union-bank-of-india.png' },
  { name: 'Yes Bank', image: '/images/clients/yes-bank.png' },
  { name: 'ICICI Bank', image: '/images/clients/icici-bank.png' },
  { name: 'Tata Capital Ltd.', image: '/images/clients/tata-capital-ltd.png' },
];

export default function Clients() {
  return (
    <section id="clients" className="section relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#b8860b]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto max-w-[1280px] px-6 relative z-10">
        {/* Section Header */}
        <SectionWrapper animation="fadeUp" className="text-center mb-8">
          <span className="text-[#b8860b] text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Trusted By</span>
          <h2 className="section-title">Our <span className="gradient-text">Clients</span></h2>
          <div className="section-divider" />
          <p className="section-subtitle">
            Partnering with India&apos;s leading financial institutions and government organizations.
          </p>
        </SectionWrapper>

        {/* Featured Clients Grid */}
        <SectionWrapper animation="fadeUp" delay={0.1} className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {featuredClients.map((client, index) => (
              <div
                key={client.name}
                className="group card flex flex-col items-center justify-center py-6 px-4 text-center h-[140px]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Fallback to text if image is the transparent 1x1 placeholder */}
                <div className="w-full h-16 relative flex items-center justify-center mb-3">
                  <img
                    src={client.image}
                    alt={client.name}
                    className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  {/* Fallback text if image fails to load or is empty */}
                  <span className="hidden absolute inset-0 flex items-center justify-center text-[#0f2038] font-bold">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-[#0f2038]">{client.name}</h3>
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
            <div className="carousel-track flex gap-8 w-max items-center">
              {/* Duplicate items for infinite loop */}
              {[...carouselClients, ...carouselClients].map((client, index) => (
                <div
                  key={`${client.name}-${index}`}
                  className="flex-shrink-0 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] hover:border-[#b8860b]/30 hover:bg-[#b8860b]/5 transition-all duration-300 cursor-default overflow-hidden h-16 w-32 flex items-center justify-center"
                >
                  <img
                    src={client.image}
                    alt={client.name}
                    className="w-full h-full object-contain transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <span className="hidden text-sm font-semibold text-[#495057] whitespace-nowrap">
                    {client.name.split(' ').map(n => n[0]).join('')}
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
