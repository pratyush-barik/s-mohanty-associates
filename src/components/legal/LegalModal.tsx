import { useEffect } from 'react';

type LegalModalProps = {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
};

export default function LegalModal({ type, onClose }: LegalModalProps) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (type) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [type]);

  if (!type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up relative"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-[#0f2038]">
              {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Last Updated: August 2026</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 text-[#495057] space-y-8 leading-relaxed">
          {isPrivacy ? (
            <>
              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">1. Introduction</h3>
                <p>Welcome to S Mohanty Associates. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website (smohantyassociates.com) or use our Client Portal.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">2. Information We Collect</h3>
                <p className="mb-2">We may collect personal information that you provide directly to us when filling out forms, creating a portal account, or communicating with our team. This includes:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Contact Details:</strong> Name, email address, phone number, and physical address.</li>
                  <li><strong>Service Data:</strong> Details regarding properties, ownership documents, and other materials necessary for us to perform property valuation services.</li>
                  <li><strong>Technical Data:</strong> IP addresses, browser types, and usage data collected automatically through website analytics.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">3. How We Use Your Information</h3>
                <p className="mb-2">We use the collected information for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>To provide, operate, and maintain our property valuation and engineering services.</li>
                  <li>To process your service requests and deliver valuation reports.</li>
                  <li>To communicate with you, including sending project updates, portal notifications, and responses to your inquiries.</li>
                  <li>To comply with legal and regulatory obligations as Government Registered Valuers.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">4. Data Security</h3>
                <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. All client documents and valuation reports uploaded to our portal are stored securely and access is strictly limited to authorized personnel only.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">5. Information Sharing</h3>
                <p>We do not sell, trade, or rent your personal identification information to others. We may share your information with trusted third parties only to the extent necessary to assist us in operating our website, conducting our business, or providing services to you, so long as those parties agree to keep this information confidential.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">6. Your Rights</h3>
                <p>You have the right to request access to the personal data we hold about you and to ask that your personal data be corrected, updated, or deleted, subject to legal requirements for document retention.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">7. Contact Us</h3>
                <p className="mb-2">If you have questions or comments about this Privacy Policy, please contact us at:</p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="font-bold text-[#0f2038]">S Mohanty Associates</p>
                  <p>Plot No. 858(P) & 859(P), Near Astha Binodini Apartment,</p>
                  <p>Siba Nagar, Rajarani, Tankapani Road,</p>
                  <p>Bhubaneswar, Odisha 751018</p>
                  <p className="mt-2"><strong>Email:</strong> info@smohantyassociates.com</p>
                  <p><strong>Telephone:</strong> 06743155572</p>
                  <p><strong>Mobile:</strong> +91 9937023856, +91 9437074855</p>
                </div>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">1. Acceptance of Terms</h3>
                <p>By accessing our website and using our Client Portal, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our website or services.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">2. Description of Services</h3>
                <p>S Mohanty Associates provides professional property valuation and chartered engineering services. The valuations provided are based on the documents, property inspections, and information supplied by the client or their representatives.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">3. User Responsibilities</h3>
                <p className="mb-2">When submitting a service request or public inquiry through our website, you agree to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide true, accurate, current, and complete information.</li>
                  <li>Maintain the security of your Client Portal login credentials (if applicable).</li>
                  <li>Promptly notify us of any unauthorized access to your account.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">4. Accuracy of Valuation</h3>
                <p>While we employ rigorous standards as Government Registered Valuers, all valuations are professional opinions based on current market conditions and the data provided. S Mohanty Associates reserves the right to revise reports if critical, previously undisclosed information is brought to light after a report has been finalized.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">5. Intellectual Property</h3>
                <p>All content on this website, including but not limited to text, graphics, logos, and reports generated via the portal, are the property of S Mohanty Associates and are protected by applicable intellectual property laws.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">6. Limitation of Liability</h3>
                <p>To the maximum extent permitted by applicable law, S Mohanty Associates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of, or inability to access or use, the services or any content provided therein.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">7. Governing Law</h3>
                <p>These Terms shall be governed and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts in Bhubaneswar, Odisha.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#1a3a5c] mb-3">8. Changes to Terms</h3>
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide reasonable notice of any significant changes.</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
