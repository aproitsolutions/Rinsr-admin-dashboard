'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CurrentAdmin, UserRole } from '@/constants/data';
import { useRouter } from 'next/navigation';

interface UserContextType {
  admin: CurrentAdmin | null;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchAdminAndPermissions() {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me', { credentials: 'include' });

      if (!res.ok) {
        setAdmin(null);
        return;
      }

      const data = await res.json();
      if (!(data?.success && data?.admin)) {
        setAdmin(null);
        return;
      }

      const raw = data.admin;
      let allowedPages: string[] = [];

      // Logic to fetch permissions
      if (raw.role === 'super_admin') {
        allowedPages = ['*'];
      } else {
        try {
          // Add cache-busting timestamp to prevent caching issues
          const resPerm = await fetch(
            `/api/role-permissions/${raw.role}?t=${Date.now()}`,
            {
              credentials: 'include',
              headers: { 'Cache-Control': 'no-cache' }
            }
          );

          if (resPerm.ok) {
            const permData = await resPerm.json();
            allowedPages = permData.allowedPages || [];
          } else {
            console.warn('Permissions API returned error', resPerm.status);
            // If failed to fetch permissions, it's safer to default to empty
            allowedPages = [];
          }
        } catch (error) {
          console.error('Error fetching permissions:', error);
          allowedPages = [];
        }
      }

      setAdmin({
        id: raw._id,
        name: raw.name,
        email: raw.email,
        role: raw.role as UserRole,
        allowedPages,
        hub_id: raw.hub_id
      });
    } catch (err) {
      console.error('Failed to fetch admin or permissions:', err);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminAndPermissions();
  }, []);

  return (
    <UserContext.Provider
      value={{ admin, loading, refreshPermissions: fetchAdminAndPermissions }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
