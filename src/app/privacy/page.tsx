import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | S Mohanty Associates',
  description: 'Privacy Policy for S Mohanty Associates property valuation services.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans pt-20">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4 text-[#0f2038]">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last Updated: August 2026</p>
        
        <div className="space-y-8 text-[#495057] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">1. Introduction</h2>
            <p>Welcome to S Mohanty Associates. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website (smohantyassociates.com) or use our Client Portal.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">2. Information We Collect</h2>
            <p className="mb-2">We may collect personal information that you provide directly to us when filling out forms, creating a portal account, or communicating with our team. This includes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Contact Details:</strong> Name, email address, phone number, and physical address.</li>
              <li><strong>Service Data:</strong> Details regarding properties, ownership documents, and other materials necessary for us to perform property valuation services.</li>
              <li><strong>Technical Data:</strong> IP addresses, browser types, and usage data collected automatically through website analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">3. How We Use Your Information</h2>
            <p className="mb-2">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide, operate, and maintain our property valuation and engineering services.</li>
              <li>To process your service requests and deliver valuation reports.</li>
              <li>To communicate with you, including sending project updates, portal notifications, and responses to your inquiries.</li>
              <li>To comply with legal and regulatory obligations as Government Registered Valuers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">4. Data Security</h2>
            <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. All client documents and valuation reports uploaded to our portal are stored securely and access is strictly limited to authorized personnel only.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">5. Information Sharing</h2>
            <p>We do not sell, trade, or rent your personal identification information to others. We may share your information with trusted third parties only to the extent necessary to assist us in operating our website, conducting our business, or providing services to you, so long as those parties agree to keep this information confidential.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">6. Your Rights</h2>
            <p>You have the right to request access to the personal data we hold about you and to ask that your personal data be corrected, updated, or deleted, subject to legal requirements for document retention.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1a3a5c] mb-4">7. Contact Us</h2>
            <p className="mb-2">If you have questions or comments about this Privacy Policy, please contact us at:</p>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="font-bold text-[#0f2038]">S Mohanty Associates</p>
              <p>Plot No. 858(P) & 859(P), Near Astha Binodini Apartment,</p>
              <p>Siba Nagar, Rajarani, Tankapani Road,</p>
              <p>Bhubaneswar, Odisha 751018</p>
              <p className="mt-2"><strong>Email:</strong> info@smohantyassociates.com</p>
              <p><strong>Telephone:</strong> 06743155572</p>
              <p><strong>Mobile:</strong> +91 9937023856, +91 9437074855</p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
