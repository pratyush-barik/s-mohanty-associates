'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const stats = [
  { target: 2500, suffix: '+', label: 'Projects Completed', prefix: '' },
  { target: 28, suffix: '+', label: 'Years Experience', prefix: '' },
  { target: 150, suffix: '+', label: 'Corporate Clients', prefix: '' },
  { target: 15, suffix: '+', label: 'Team Members', prefix: '' },
];

export default function Hero() {
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
                  <stop offset="0%" style="stop-color:#0a1628"/>
                  <stop offset="50%" style="stop-color:#162d4a"/>
                  <stop offset="100%" style="stop-color:#1e3a5f"/>
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
        className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/60 via-[#0a1628]/40 to-[#0a1628]/80"
      />

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-2 h-2 bg-[#ffcb47]/30 rounded-full animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-20 w-3 h-3 bg-[#ffcb47]/20 rounded-full animate-[float_8s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-[#b8860b]/40 rounded-full animate-[float_7s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/10 rounded-full animate-[float_5s_ease-in-out_infinite_0.5s]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-[1280px] px-6 text-center pt-32 md:pt-40">
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
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=smohantyassociates@gmail.com&su=New%20Case%3A%20Service%20Request&body=Organisation%3A%0AName%3A%0AEmail%3A%0APhone%3A%0ALocation%20%2F%20Address%3A%0ASubject%20%2F%20Property%20Type%3A%0AMessage%20%2F%20Details%3A%0A"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-base px-6 py-3.5 flex items-center gap-2"
          >
            Request via Gmail
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="mailto:smohantyassociates@gmail.com?subject=New%20Case%3A%20Service%20Request&body=Organisation%3A%0AName%3A%0AEmail%3A%0APhone%3A%0ALocation%20%2F%20Address%3A%0ASubject%20%2F%20Property%20Type%3A%0AMessage%20%2F%20Details%3A%0A"
            className="btn btn-primary text-base px-6 py-3.5 flex items-center gap-2"
          >
            Request via Mail App
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
          <button onClick={scrollToAbout} className="btn btn-secondary text-base px-6 py-3.5">
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
    </section>
  );
}
