'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const stats = [
  { target: 1000, suffix: '+', label: 'Projects Completed', prefix: '' },
  { target: 20, suffix: '+', label: 'Years Experience', prefix: '' },
  { target: 100, suffix: '+', label: 'Corporate Clients', prefix: '' },
  { target: 30, suffix: '+', label: 'Team Members', prefix: '' },
];

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!parallaxRef.current) return;
      const scrollY = window.scrollY;
      parallaxRef.current.style.transform = `translateY(${scrollY * 0.4}px)`;
      if (overlayRef.current) {
        overlayRef.current.style.opacity = `${Math.min(0.8, 0.4 + scrollY * 0.0005)}`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const scrollToAbout = () => {
    const el = document.getElementById('about');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax Background */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 -top-[10%] -bottom-[10%] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
              <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
           <stop offset="0%" style="stop-color:#0a1f16"/>
                   <stop offset="50%" style="stop-color:#0d3d24"/>
                   <stop offset="100%" style="stop-color:#1a5c3a"/>
                </linearGradient>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="1920" height="1080" fill="url(#bg)"/>
              <rect width="1920" height="1080" fill="url(#grid)"/>
              <circle cx="200" cy="300" r="200" fill="rgba(184,134,11,0.05)"/>
              <circle cx="1700" cy="600" r="300" fill="rgba(30,58,95,0.1)"/>
              <circle cx="900" cy="100" r="150" fill="rgba(184,134,11,0.03)"/>
            </svg>
          `)}')`,
        }}
      />

      {/* Gradient Overlay */}
       <div
         ref={overlayRef}
         className="absolute inset-0 bg-gradient-to-b from-[#0a1f16]/60 via-[#0a1f16]/40 to-[#0a1f16]/80"
       />

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-2 h-2 bg-[#ffcb47]/30 rounded-full animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-20 w-3 h-3 bg-[#ffcb47]/20 rounded-full animate-[float_8s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-[#b8860b]/40 rounded-full animate-[float_7s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/10 rounded-full animate-[float_5s_ease-in-out_infinite_0.5s]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-[1280px] px-6 text-center pt-28 md:pt-36">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Trusted Property{' '}
          <span className="gradient-text">Valuation</span>
          <br />
          Expertise Since 1995
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="text-lg md:text-xl text-white/60 max-w-[700px] mx-auto mb-10 leading-relaxed"
        >
          Delivering precise, reliable, and court-recognized property valuations for banks,
          government bodies, insurance companies, and private clients across India.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary text-base px-8 py-3.5 flex items-center gap-2">
            Submit Organisational Request
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <button onClick={scrollToAbout} className="btn btn-secondary text-base px-8 py-3.5">
            Learn More
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-[900px] mx-auto"
        >
          {stats.map((stat) => (
            <AnimatedCounter
              key={stat.label}
              target={stat.target}
              suffix={stat.suffix}
              prefix={stat.prefix}
              label={stat.label}
              duration={2.5}
            />
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 cursor-pointer"
          onClick={scrollToAbout}
        >
          <span className="text-white/40 text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-[#ffcb47]"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Email Client Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-xl font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Choose Email Client
            </h3>
            <p className="text-sm text-[#495057] mb-8">
              Select how you would like to send your organisational request.
            </p>
            
            <div className="flex flex-col gap-4">
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=smohantyassociates@gmail.com&su=New%20Case%3A%20Service%20Request&body=Service%20Category%3A%0AServices%20Offered%3A%0AProperty%20Details%3A%0AProperty%20Address%3A%0AContact%20Name%3A%0APhone%20Number%3A%0AContact%20Email%3A%0AAdditional%20Notes%3A%0A"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsModalOpen(false)}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-[#dee2e6] hover:border-[#EA4335] hover:bg-[#EA4335]/5 transition-all text-[#0f2038] font-medium"
              >
                <svg className="w-6 h-6 text-[#EA4335]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.728L12 16.636l-6.545-4.908v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                </svg>
                Open in Gmail Web
              </a>
              <a
                href="https://outlook.office.com/owa/?path=/mail/action/compose&to=smohantyassociates@gmail.com&subject=New%20Case%3A%20Service%20Request&body=Service%20Category%3A%0D%0AServices%20Offered%3A%0D%0AProperty%20Details%3A%0D%0AProperty%20Address%3A%0D%0AContact%20Name%3A%0D%0APhone%20Number%3A%0D%0AContact%20Email%3A%0D%0AAdditional%20Notes%3A"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsModalOpen(false)}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-[#dee2e6] hover:border-[#0078D4] hover:bg-[#0078D4]/5 transition-all text-[#0f2038] font-medium"
              >
                <svg className="w-6 h-6 text-[#0078D4]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.18 14.7c-2.3.96-4.96.9-6.85-.43l5.5-5.5v3.42c0 .94-.52 1.8-1.35 2.21-.18.1-.38.17-.58.21l3.28 3.28v-3.19zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                  <path d="M13 7h-2v5.41l4.29 4.29 1.41-1.41L13 11.59z" />
                </svg>
                Open in Outlook Web
              </a>
              <a
                href="mailto:smohantyassociates@gmail.com?subject=New%20Case%3A%20Service%20Request&body=Service%20Category%3A%0AServices%20Offered%3A%0AProperty%20Details%3A%0AProperty%20Address%3A%0AContact%20Name%3A%0APhone%20Number%3A%0AContact%20Email%3A%0AAdditional%20Notes%3A%0A"
                onClick={() => setIsModalOpen(false)}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-[#dee2e6] hover:border-[#495057] hover:bg-[#495057]/5 transition-all text-[#0f2038] font-medium"
              >
                <svg className="w-6 h-6 text-[#495057]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Open in Default Mail App
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
