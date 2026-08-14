import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | S Mohanty Associates',
  description: 'Terms of Service for S Mohanty Associates property valuation services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans pt-20">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4 text-[#0f2038]">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last Updated: August 2026</p>
        
        <div className="space-y-8 text-[#495057] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">1. Acceptance of Terms</h2>
            <p>By accessing our website and using our Client Portal, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our website or services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">2. Description of Services</h2>
            <p>S Mohanty Associates provides professional property valuation and chartered engineering services. The valuations provided are based on the documents, property inspections, and information supplied by the client or their representatives.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">3. User Responsibilities</h2>
            <p className="mb-2">When submitting a service request or public inquiry through our website, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide true, accurate, current, and complete information.</li>
              <li>Maintain the security of your Client Portal login credentials (if applicable).</li>
              <li>Promptly notify us of any unauthorized access to your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">4. Accuracy of Valuation</h2>
            <p>While we employ rigorous standards as Government Registered Valuers, all valuations are professional opinions based on current market conditions and the data provided. S Mohanty Associates reserves the right to revise reports if critical, previously undisclosed information is brought to light after a report has been finalized.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">5. Intellectual Property</h2>
            <p>All content on this website, including but not limited to text, graphics, logos, and reports generated via the portal, are the property of S Mohanty Associates and are protected by applicable intellectual property laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, S Mohanty Associates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of, or inability to access or use, the services or any content provided therein.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">7. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts in Bhubaneswar, Odisha.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">8. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide reasonable notice of any significant changes.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
