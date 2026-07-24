import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Authentication | S Mohanty Associates',
  description: 'Login or register to access S Mohanty Associates valuation services.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #060e1a 0%, #0a1628 40%, #162d4a 100%)',
      }}
    >
      {/* Decorative */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[#b8860b]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-[#1e3a5f]/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block transition-all hover:scale-105">
            <img
              src="/logo/smohantyassociate_logo.png"
              alt="S Mohanty Associates"
              className="h-[96px] sm:h-[120px] w-auto object-contain mx-auto"
            />
          </a>
        </div>

        {children}
      </div>
    </div>
  );
}
