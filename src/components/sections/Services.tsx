'use client';

import { useState } from 'react';
import SectionWrapper, { StaggerContainer, StaggerItem } from '@/components/ui/SectionWrapper';

const services = [
  {
    icon: '🏦',
    title: 'Mortgage & Loan Security Valuation',
    description: 'Home Loan Valuation, Loan Against Property (LAP), Commercial Property Valuation, Industrial Property Valuation, Construction Finance Valuation, Project Finance Valuation, Working Capital Security Valuation, Loan Renewal & Enhancement Valuation',
    details: '',
    gradient: 'from-blue-500/10 to-indigo-500/10',
    border: 'hover:border-blue-300',
  },
  {
    icon: '💼',
    title: 'Banking & Financial Institution Services',
    description: 'Primary Security Valuation, Collateral Security Valuation, Periodic Revaluation, Security Monitoring, Consortium Lending Valuation',
    details: '',
    gradient: 'from-green-500/10 to-emerald-500/10',
    border: 'hover:border-green-300',
  },
  {
    icon: '⚖️',
    title: 'SARFAESI & Recovery Valuation',
    description: 'Reserve Price Determination, Distress Value, Forced Sale Value, Realizable Value, Auction Valuation, Recovery & Enforcement Valuation',
    details: '',
    gradient: 'from-orange-500/10 to-amber-500/10',
    border: 'hover:border-orange-300',
  },
  {
    icon: '🌍',
    title: 'Land Valuation',
    description: 'Residential Land, Commercial Land, Industrial Land, Agricultural Land, Institutional Land, Development Land, Freehold & Leasehold Land, Government Leasehold Properties',
    details: '',
    gradient: 'from-purple-500/10 to-violet-500/10',
    border: 'hover:border-purple-300',
  },
  {
    icon: '🏢',
    title: 'Building Valuation',
    description: 'Residential Buildings, Apartments, Villas, Commercial Buildings, Office Spaces, Shopping Complexes, Warehouses, Industrial Buildings, Hotels, Hospitals, Schools, Colleges, Institutional Buildings',
    details: '',
    gradient: 'from-cyan-500/10 to-teal-500/10',
    border: 'hover:border-cyan-300',
  },
  {
    icon: '🏗️',
    title: 'Project & Construction Consultancy',
    description: 'Construction Stage Inspection, Progress Certification, Cost-to-Complete Assessment, Construction Cost Estimation, Fund Utilization Verification, Technical Monitoring',
    details: '',
    gradient: 'from-rose-500/10 to-pink-500/10',
    border: 'hover:border-rose-300',
  },
  {
    icon: '🏭',
    title: 'Corporate & Fixed Asset Valuation',
    description: 'Fixed Asset Valuation, Fair Market Value (FMV), Replacement Cost',
    details: '',
    gradient: 'from-yellow-500/10 to-[#b8860b]/10',
    border: 'hover:border-yellow-400',
  },
  {
    icon: '📉',
    title: 'IBC & Insolvency Valuation Support',
    description: 'Fair Value, Liquidation Value, Resolution Professional Assistance',
    details: '',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    border: 'hover:border-blue-400',
  },
  {
    icon: '📈',
    title: 'Development & Investment Advisory',
    description: 'Highest & Best Use (HBU) Analysis, Residual Land Valuation, Development Feasibility, Joint Development Valuation, Investment Advisory, Marketability Assessment',
    details: '',
    gradient: 'from-emerald-500/10 to-green-500/10',
    border: 'hover:border-emerald-400',
  },
  {
    icon: '🏛️',
    title: 'Government & Statutory Valuation',
    description: 'Land Acquisition, Compensation Assessment, Municipal & Government Asset Valuation, Public Infrastructure Valuation, Property Tax Assessment Support',
    details: '',
    gradient: 'from-orange-500/10 to-red-500/10',
    border: 'hover:border-orange-400',
  },
  {
    icon: '⚡',
    title: 'Specialized Property Valuation',
    description: 'Petrol Pumps, Cold Storages, Rice Mills, Resorts, Data Centres, Renewable Energy Projects, Mixed-Use Developments, Heritage Properties',
    details: '',
    gradient: 'from-violet-500/10 to-fuchsia-500/10',
    border: 'hover:border-violet-400',
  },
  {
    icon: '📊',
    title: 'Market Research & Advisory',
    description: 'Comparable Market Analysis, Rental Assessment, Market Trend Analysis, Demand–Supply Analysis, Circle Rate Study, Feasibility Studies',
    details: '',
    gradient: 'from-pink-500/10 to-rose-500/10',
    border: 'hover:border-pink-400',
  },
  {
    icon: '🤝',
    title: 'Customized Valuation & Advisory',
    description: 'Tailor-made Valuation Reports, Investor Due Diligence, Asset Acquisition Advisory, Technical Audit Support, Independent Expert Opinion',
    details: '',
    gradient: 'from-[#b8860b]/10 to-yellow-600/10',
    border: 'hover:border-[#b8860b]',
  }
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
