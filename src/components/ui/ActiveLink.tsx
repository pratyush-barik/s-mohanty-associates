'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface ActiveLinkProps {
  href: string;
  className: string;
  activeClassName: string;
  children: ReactNode;
}

export default function ActiveLink({ href, className, activeClassName, children }: ActiveLinkProps) {
  const pathname = usePathname();
  
  // Match path exactly for dashboard/portal roots, otherwise match prefix
  const isActive = href === '/portal' || href === '/dashboard'
    ? pathname === href
    : pathname.startsWith(href);

  return (
    <Link href={href} className={`${className} ${isActive ? activeClassName : ''}`}>
      {children}
    </Link>
  );
}
