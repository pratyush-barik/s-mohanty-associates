'use client';

import { useState, type FormEvent } from 'react';
import SectionWrapper from '@/components/ui/SectionWrapper';
import { submitEnquiry } from '@/app/actions/enquiry';
import { serviceCategoryMap } from '@/lib/services';

export default function Contact() {
  const [senderType, setSenderType] = useState<'INDIVIDUAL' | 'ORGANISATION'>('INDIVIDUAL');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    organisationName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    fd.append('subject', formData.subject);
    fd.append('message', formData.message);
    fd.append('senderType', senderType);
    if (senderType === 'ORGANISATION') {
      fd.append('organisationName', formData.organisationName);
    }

    const result = await submitEnquiry(fd);

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', organisationName: '' });
      setSenderType('INDIVIDUAL');
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <section id="contact" className="section relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#b8860b]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-[1920px] px-6 relative z-10">
        {/* Section Header */}
        <SectionWrapper animation="fadeUp" className="text-center mb-8">
          <span className="text-[#b8860b] text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Get In Touch</span>
          <h2 className="section-title">Contact <span className="gradient-text">Us</span></h2>
          <div className="section-divider" />
          <p className="section-subtitle">
            Ready to discuss your valuation needs? Reach out to us and we&apos;ll respond within 24 hours.
          </p>
        </SectionWrapper>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Contact Information */}
          <SectionWrapper animation="fadeRight" delay={0.1} className="lg:col-span-2 space-y-6">
            {/* Office */}
            <div className="card p-6 group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#b8860b]/10 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  📍
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0f2038] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                    Office Address
                  </h4>
                  <p className="text-sm text-[#6c757d] leading-relaxed">
                    Plot No. 858(P) & 859(P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar - 751018, Odisha
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="card p-6 group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#b8860b]/10 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  📞
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0f2038] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                    Phone Numbers
                  </h4>
                  <p className="text-sm text-[#6c757d] space-y-1">
                    <a href="tel:06743155572" className="block hover:text-[#b8860b] transition-colors">TELEPHONE: 06743155572</a>
                    <a href="tel:+919937023856" className="block hover:text-[#b8860b] transition-colors">MOBILE: 9937023856, 9437074855</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="card p-6 group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#b8860b]/10 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  ✉️
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0f2038] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                    Email Support
                  </h4>
                  <ul className="text-sm text-[#6c757d] space-y-2 mt-2">
                    <li>
                      <span className="font-semibold block text-[#343a40]">General Queries:</span>
                      <a href="mailto:info@smohantyassociates.com" className="hover:text-[#b8860b] transition-colors">info@smohantyassociates.com</a>
                    </li>
                    <li>
                      <span className="font-semibold block text-[#343a40]">Technical Support:</span>
                      <a href="mailto:admin@smohantyassociates.com" className="hover:text-[#b8860b] transition-colors">admin@smohantyassociates.com</a>
                    </li>
                    <li>
                      <span className="font-semibold block text-[#343a40]">Details / Management:</span>
                      <a href="mailto:manager@smohantyassociates.com" className="hover:text-[#b8860b] transition-colors">manager@smohantyassociates.com</a>
                    </li>
                    <li>
                      <span className="font-semibold block text-[#343a40]">Organisational Queries:</span>
                      <a href="#home" className="hover:text-[#b8860b] transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }); }}>smohantyassociates@gmail.com</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="card p-6 group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#b8860b]/10 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  🕐
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0f2038] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                    Working Hours
                  </h4>
                  <p className="text-sm text-[#6c757d] space-y-1">
                    <span className="block">Mon - Sat: 9:00 AM - 6:00 PM</span>
                    <span className="block text-[#b8860b]">Sunday: Closed</span>
                  </p>
                </div>
              </div>
            </div>
          </SectionWrapper>

          {/* Contact Form + Map */}
          <SectionWrapper animation="fadeLeft" delay={0.2} className="lg:col-span-3 space-y-8">
            {/* Contact Form */}
            <div className="card p-8">
              <h3 className="text-xl font-bold text-[#0f2038] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
                Send Us a Message
              </h3>

              {submitted && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Thank you! Your message has been sent successfully. We&apos;ll get back to you within 24 hours.
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Individual / Organisation Dropdown */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-sender-type" className="block text-sm font-medium text-[#343a40] mb-1.5">
                      I am enquiring as *
                    </label>
                    <select
                      id="contact-sender-type"
                      required
                      value={senderType}
                      onChange={(e) => setSenderType(e.target.value as 'INDIVIDUAL' | 'ORGANISATION')}
                      className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                    >
                      <option value="INDIVIDUAL">Individual</option>
                      <option value="ORGANISATION">Organisation</option>
                    </select>
                  </div>
                  {senderType === 'ORGANISATION' && (
                    <div>
                      <label htmlFor="contact-org-name" className="block text-sm font-medium text-[#343a40] mb-1.5">
                        Organisation Name *
                      </label>
                      <input
                        id="contact-org-name"
                        type="text"
                        required
                        value={formData.organisationName}
                        onChange={(e) => setFormData({ ...formData, organisationName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-[#343a40] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-[#343a40] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium text-[#343a40] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium text-[#343a40] mb-1.5">
                      Subject *
                    </label>
                    <select
                      id="contact-subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                    >
                      <option value="">Select a subject</option>
                      {Object.keys(serviceCategoryMap).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                      <option value="other">Other Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-[#343a40] mb-1.5">
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all resize-none"
                    placeholder="Tell us about your valuation needs..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full sm:w-auto text-sm px-8 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Google Maps Embed */}
            <div className="card p-2 overflow-hidden">
              <div className="rounded-xl overflow-hidden">
                <iframe
                  title="S Mohanty Associates Office Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3743.4418929928997!2d85.8472821!3d20.240500200000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a19a1c36dbed11d%3A0x86767b9f9fd5c5df!2sS%20MOHANTY%20ASSOCIATES!5e0!3m2!1sen!2sin!4v1784043096555!5m2!1sen!2sin"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
          </SectionWrapper>
        </div>
      </div>
    </section>
  );
}
