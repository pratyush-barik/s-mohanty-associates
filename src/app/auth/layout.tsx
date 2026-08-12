import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Authentication | S Mohanty Associates',
  description: 'Login or register to access S Mohanty Associates valuation services.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F6F7F6]">

      
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block transition-all hover:scale-105">
            <img
              src="/logo/smohantyassociate_logo.svg"
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
