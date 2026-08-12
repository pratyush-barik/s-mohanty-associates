'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const quickLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Qualifications', href: '#qualifications' },
  { label: 'Contact', href: '#contact' },
];

const services = [
  'Property Valuation',
  'Land Valuation',
  'Building Valuation',
  'Industrial Valuation',
  'Bank Valuation',
  'Insurance Valuation',
];

export default function Footer() {
  const scrollToSection = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #030f08 0%, #0a1f16 50%, #0d3d24 100%)' }}>
      {/* Top gradient border */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#b8860b] to-transparent" />

      <div className="container mx-auto max-w-[1600px] px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="mb-5 inline-block bg-[#FAF9F2] rounded-full px-4 py-1.5">
              <Image
                src="/logo/smohantyassociate_logo.png"
                alt="S Mohanty Associates"
                width={800}
                height={200}
                className="h-12 w-auto object-contain opacity-100"
              />
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Government Registered Valuers and Chartered Engineers providing expert property valuation services across India since 2016.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-white/50 hover:text-[#ffcb47] transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#b8860b]/40 group-hover:bg-[#ffcb47] transition-colors" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Our Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-white/50 text-sm flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#b8860b]/40" />
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="text-[#ffcb47] mt-0.5 text-sm">📍</span>
                <p className="text-white/50 text-sm leading-relaxed">
                  Plot No. 858(P) & 859(P),<br />
                  Near Astha Binodini Apartment,<br />
                  Siba Nagar, Rajarani,<br />
                  Tankapani Road,<br />
                  Bhubaneswar-751018, Odisha
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#ffcb47] text-sm">📞</span>
                <div className="text-white/50 text-sm space-y-1">
                  <p>TELEPHONE: 06743155572</p>
                  <p>MOBILE: 9937023856, 9437074855</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-[#ffcb47] text-sm mt-1">✉️</span>
                <div className="text-white/50 text-sm space-y-3">
                  <p><span className="text-white/80 font-medium">General:</span><br /><a href="mailto:info@smohantyassociates.com" className="hover:text-white transition-colors">info@smohantyassociates.com</a></p>
                  <p><span className="text-white/80 font-medium">Tech Support:</span><br /><a href="mailto:admin@smohantyassociates.com" className="hover:text-white transition-colors">admin@smohantyassociates.com</a></p>
                  <p><span className="text-white/80 font-medium">Management:</span><br /><a href="mailto:manager@smohantyassociates.com" className="hover:text-white transition-colors">manager@smohantyassociates.com</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} S Mohanty Associates. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-white/30 hover:text-white/60 text-sm transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-white/30 hover:text-white/60 text-sm transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#b8860b]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#1a5c3a]/20 rounded-full blur-[100px] pointer-events-none" />
    </footer>
  );
}
