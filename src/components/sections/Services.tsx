'use client';

import { useState } from 'react';
import SectionWrapper, { StaggerContainer, StaggerItem } from '@/components/ui/SectionWrapper';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

const services = [
  {
    icon: '🏦',
    title: 'Mortgage & Loan Security Valuation',
    description: 'Home Loan Valuation, Loan Against Property (LAP), Commercial Property Valuation, Industrial Property Valuation, Construction Finance Valuation, Project Finance Valuation, Working Capital Security Valuation, Loan Renewal & Enhancement Valuation',
    details: '',
    iconColor: '#3b82f6', // blue
    hoverColor: '#1e3a8a', // dark blue
  },
  {
    icon: '🏢',
    title: 'Building Valuation',
    description: 'Residential Buildings, Apartments, Villas, Commercial Buildings, Office Spaces, Shopping Complexes, Warehouses, Industrial Buildings, Hotels, Hospitals, Schools, Colleges, Institutional Buildings',
    details: '',
    iconColor: '#06b6d4', // cyan
    hoverColor: '#164e63', // dark cyan
  },
  {
    icon: '🌍',
    title: 'Land Valuation',
    description: 'Residential Land, Commercial Land, Industrial Land, Agricultural Land, Institutional Land, Development Land, Freehold & Leasehold Land, Government Leasehold Properties',
    details: '',
    iconColor: '#a855f7', // purple
    hoverColor: '#581c87', // dark purple
  },
  {
    icon: '🏗️',
    title: 'Project & Construction Consultancy',
    description: 'Construction Stage Inspection, Progress Certification, Cost-to-Complete Assessment, Construction Cost Estimation, Fund Utilization Verification, Technical Monitoring',
    details: '',
    iconColor: '#f43f5e', // rose
    hoverColor: '#881337', // dark rose
  },
  {
    icon: '📈',
    title: 'Development & Investment Advisory',
    description: 'Highest & Best Use (HBU) Analysis, Residual Land Valuation, Development Feasibility, Joint Development Valuation, Investment Advisory, Marketability Assessment',
    details: '',
    iconColor: '#10b981', // emerald
    hoverColor: '#064e3b', // dark emerald
  },
  {
    icon: '💼',
    title: 'Banking & Financial Institution Services',
    description: 'Primary Security Valuation, Collateral Security Valuation, Periodic Revaluation, Security Monitoring, Consortium Lending Valuation',
    details: '',
    iconColor: '#eab308', // yellow
    hoverColor: '#713f12', // dark yellow
  },
  {
    icon: '⚖️',
    title: 'SARFAESI & Recovery Valuation',
    description: 'Reserve Price Determination, Distress Value, Forced Sale Value, Realizable Value, Auction Valuation, Recovery & Enforcement Valuation',
    details: '',
    iconColor: '#f97316', // orange
    hoverColor: '#7c2d12', // dark orange
  },
  {
    icon: '🏛️',
    title: 'Government & Statutory Valuation',
    description: 'Land Acquisition, Compensation Assessment, Municipal & Government Asset Valuation, Public Infrastructure Valuation, Property Tax Assessment Support',
    details: '',
    iconColor: '#ef4444', // red
    hoverColor: '#7f1d1d', // dark red
  },
  {
    icon: '⚡',
    title: 'Specialized Property Valuation',
    description: 'Petrol Pumps, Cold Storages, Rice Mills, Resorts, Data Centres, Renewable Energy Projects, Mixed-Use Developments, Heritage Properties',
    details: '',
    iconColor: '#8b5cf6', // violet
    hoverColor: '#4c1d95', // dark violet
  },
  {
    icon: '📊',
    title: 'Market Research & Advisory',
    description: 'Comparable Market Analysis, Rental Assessment, Market Trend Analysis, Demand–Supply Analysis, Circle Rate Study, Feasibility Studies',
    details: '',
    iconColor: '#ec4899', // pink
    hoverColor: '#831843', // dark pink
  },
  {
    icon: '🤝',
    title: 'Customized Valuation & Advisory',
    description: 'Tailor-made Valuation Reports, Investor Due Diligence, Asset Acquisition Advisory, Technical Audit Support, Independent Expert Opinion',
    details: '',
    iconColor: '#b8860b', // gold
    hoverColor: '#0a1f16', // dark green
  },
  {
    icon: '🏭',
    title: 'Corporate & Fixed Asset Valuation',
    description: 'Fixed Asset Valuation, Fair Market Value (FMV), Replacement Cost',
    details: '',
    iconColor: '#facc15', // yellow
    hoverColor: '#422006', // very dark yellow/brown
  },
  {
    icon: '📉',
    title: 'IBC & Insolvency Valuation Support',
    description: 'Fair Value, Liquidation Value, Resolution Professional Assistance',
    details: '',
    iconColor: '#3b82f6', // blue
    hoverColor: '#1e3a8a', // dark blue
  }
];

export default function Services() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="services" className="section section-dark relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#b8860b]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a5c3a]/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-[1920px] px-6 relative z-10">
        {/* Section Header */}
        <SectionWrapper animation="fadeUp" className="text-center mb-8">
          <span className="text-[#ffcb47] text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">What We Offer</span>
          <h2 className="section-title text-white">Our <span className="gradient-text">Services</span></h2>
          <div className="section-divider" />
          <p className="section-subtitle text-white/50">
            Comprehensive property valuation services tailored to meet the diverse needs of our clients across all sectors.
          </p>
        </SectionWrapper>

        {/* Service Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6" staggerDelay={0.08}>
          {services.map((service, index) => (
            <StaggerItem 
              key={service.title} 
              animation="scaleUp"
              className={index === 10 ? 'xl:col-start-2' : ''}
            >
              <SpotlightCard
                spotlightColor="rgba(255, 255, 255, 0.1)"
                className="group cursor-pointer relative overflow-hidden h-full rounded-2xl bg-[#e6ebe3] border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Solid Background color transition on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out" 
                  style={{ backgroundColor: service.hoverColor }}
                />

                <div className="relative z-10 flex flex-col items-start text-left h-full p-2">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 transform group-hover:scale-110 transition-transform duration-300 shadow-md"
                    style={{ backgroundColor: service.iconColor }}
                  >
                    {service.icon}
                  </div>
                  
                  <h3 className="text-lg font-bold text-[#0f2038] group-hover:text-white transition-colors duration-300 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                    {service.title}
                  </h3>
                  
                  <p className="text-sm text-[#4a5568] group-hover:text-white/90 transition-colors duration-300 leading-relaxed mb-3 flex-grow">
                    {service.description}
                  </p>

                  {/* Expanded Details on Hover */}
                  <div className={`overflow-hidden transition-all duration-500 w-full ${
                    hoveredIndex === index ? 'max-h-[100px] opacity-100 mt-auto pt-4 border-t border-white/20' : 'max-h-0 opacity-0'
                  }`}>
                    <p className="text-xs text-white/90 font-semibold leading-relaxed">
                      {service.details}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
