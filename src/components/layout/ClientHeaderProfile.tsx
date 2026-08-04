'use client';

import React from 'react';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';

interface ClientHeaderProfileProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  handleLogout: () => Promise<void>;
}

export function ClientHeaderProfile({ user, handleLogout }: ClientHeaderProfileProps) {
  return <ProfileDropdown user={user} onLogout={handleLogout} />;
}
