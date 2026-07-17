'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Clients', href: '#clients' },
  { label: 'Qualifications', href: '#qualifications' },
  { label: 'Our Founder', href: '#ceo' },
  { label: 'Contact', href: '#contact' },
];

interface UserSession {
  name: string;
  role: string;
  projects?: { id: string; projectCode: string; status: string }[];
}

interface NavbarProps {
  user?: UserSession | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50);

    // Determine active section
    const sections = navLinks.map(link => link.href.replace('#', ''));
    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(sections[i]);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) {
          setActiveSection(sections[i]);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToSection = (href: string) => {
    setIsMobileMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Dynamic CTA logic
  const hasActiveProjects = user?.projects && user.projects.length > 0;
  const isEmployee = user && ['OWNER', 'MANAGER', 'FIELD_EMPLOYEE', 'REPORT_EMPLOYEE'].includes(user.role);

  const renderCTA = () => {


    if (user && hasActiveProjects) {
      return (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
          >
            Enquire About Service
            <svg className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#e9ecef] overflow-hidden z-50"
              >
                <div className="p-2">
                  <p className="px-3 py-2 text-[10px] font-semibold text-[#adb5bd] uppercase tracking-wider">
                    Active Projects
                  </p>
                  {user.projects!.map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0f2038] hover:bg-[#f8f9fa] transition-colors"
                    >
                      <span className="font-bold text-[#b8860b]">{project.projectCode}</span>
                      <span className="text-xs text-[#6c757d] block mt-0.5">
                        {project.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="border-t border-[#e9ecef] p-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-[#6c757d] hover:bg-[#f8f9fa] transition-colors"
                  >
                    Go to Dashboard →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (isEmployee) {
      return (
        <Link href="/auth/client-login" className="btn btn-primary text-sm px-5 py-2.5">
          Request a Service
        </Link>
      );
    }

    if (user) {
      return (
        <Link href="/dashboard/request" className="btn btn-primary text-sm px-5 py-2.5">
          Request a Service
        </Link>
      );
    }

    // Anonymous user
    return (
      <Link href="/auth/client-login" className="btn btn-primary text-sm px-5 py-2.5">
        Request a Service
      </Link>
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClick = () => setIsDropdownOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isDropdownOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-neutral-200/50'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto max-w-[1280px] px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                isScrolled
                  ? 'bg-gradient-to-br from-[#b8860b] to-[#c9952c] text-white'
                  : 'bg-white/10 backdrop-blur text-white border border-white/20'
              }`}>
                S
              </div>
              <div>
                <div className={`font-bold text-lg leading-tight transition-colors duration-300 ${
                  isScrolled ? 'text-[#0f2038]' : 'text-white'
                }`} style={{ fontFamily: 'var(--font-heading)' }}>
                  S Mohanty
                </div>
                <div className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 ${
                  isScrolled ? 'text-[#b8860b]' : 'text-[#ffcb47]'
                }`}>
                  Associates
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
                    activeSection === link.href.replace('#', '')
                      ? isScrolled
                        ? 'text-[#b8860b]'
                        : 'text-[#ffcb47]'
                      : isScrolled
                        ? 'text-[#495057] hover:text-[#0f2038]'
                        : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                  {activeSection === link.href.replace('#', '') && (
                    <motion.div
                      layoutId="activeNav"
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full ${
                        isScrolled ? 'bg-[#b8860b]' : 'bg-[#ffcb47]'
                      }`}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* CTA + Auth + Mobile */}
            <div className="flex items-center gap-3">
              {/* User indicator (when logged in) */}
              {user && !isEmployee && (
                <Link
                  href="/dashboard"
                  className={`hidden md:flex items-center gap-2 text-sm font-medium transition-colors ${
                    isScrolled ? 'text-[#495057] hover:text-[#0f2038]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  Dashboard
                </Link>
              )}

              {/* Dynamic CTA */}
              <div className="hidden md:block" onClick={(e) => e.stopPropagation()}>
                {renderCTA()}
              </div>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex flex-col gap-1.5 p-2"
                aria-label="Toggle menu"
              >
                <motion.span
                  animate={isMobileMenuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                  className={`block w-6 h-0.5 rounded-full transition-colors ${
                    isScrolled ? 'bg-[#0f2038]' : 'bg-white'
                  }`}
                />
                <motion.span
                  animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                  className={`block w-6 h-0.5 rounded-full transition-colors ${
                    isScrolled ? 'bg-[#0f2038]' : 'bg-white'
                  }`}
                />
                <motion.span
                  animate={isMobileMenuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                  className={`block w-6 h-0.5 rounded-full transition-colors ${
                    isScrolled ? 'bg-[#0f2038]' : 'bg-white'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[300px] bg-[#0a1628] p-8 pt-24"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link, i) => (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                    onClick={() => scrollToSection(link.href)}
                    className={`text-left px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      activeSection === link.href.replace('#', '')
                        ? 'bg-white/10 text-[#ffcb47]'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </motion.button>
                ))}

                {/* Mobile Auth Links */}
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  {user && !isEmployee ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      >
                        📊 Dashboard
                      </Link>
                      {hasActiveProjects && user.projects!.map((project) => (
                        <Link
                          key={project.id}
                          href={`/dashboard/projects/${project.id}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-2 rounded-xl text-sm text-white/50 hover:text-[#ffcb47] hover:bg-white/5 transition-all ml-4"
                        >
                          {project.projectCode}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      href="/auth/client-login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    >
                      🔐 Log In
                    </Link>
                  )}
                  <Link
                    href={user && !isEmployee ? '/dashboard/request' : '/auth/client-login'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-primary w-full text-sm mt-2"
                  >
                    Request a Service
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
