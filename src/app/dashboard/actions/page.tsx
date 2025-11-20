'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { navItems } from '@/constants/data';

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'vendor_user', label: 'Vendor User' },
  { value: 'hub_user', label: 'Hub User' }
];

type NavItem = {
  title: string;
  url?: string;
  items?: NavItem[];
};

// Build page options from navItems (real app routes)
function getPageOptionsFromNav(items: NavItem[]) {
  const seen = new Set<string>();
  const result: { id: string; label: string }[] = [];

  const walk = (nodes: NavItem[]) => {
    nodes.forEach((item) => {
      if (item.url && !seen.has(item.url)) {
        seen.add(item.url);
        result.push({ id: item.url, label: item.title });
      }

      if (Array.isArray(item.items) && item.items.length > 0) {
        walk(item.items as NavItem[]);
      }
    });
  };

  walk(items);
  return result;
}

const PAGE_OPTIONS = getPageOptionsFromNav(navItems as unknown as NavItem[]);

export default function PermissionManager() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('admin');
  const [allowedPages, setAllowedPages] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Load permissions for selected role
  async function loadPermissions(selectedRole: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/role-permissions/${selectedRole}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch permissions');
      }

      setAllowedPages(data.allowedPages || []);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setAllowedPages([]);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadPermissions(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When role dropdown changes
  function handleRoleChange(newRole: string) {
    setRole(newRole);
    loadPermissions(newRole);
  }

  // Toggle one checkbox
  function togglePage(pageId: string) {
    setAllowedPages((prev) => {
      const s = new Set(prev);
      if (s.has(pageId)) s.delete(pageId);
      else s.add(pageId);
      return Array.from(s);
    });
  }

  // Save updated permissions
  async function savePermissions() {
    try {
      setSaving(true);

      const res = await fetch(`/api/role-permissions/${role}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedPages })
      });

      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setAlertMessage('Permissions updated successfully');
      } else {
        setIsSuccess(false);
        setAlertMessage(data.message || 'Failed to update permissions');
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setAlertMessage('Something went wrong');
    } finally {
      setSaving(false);
      setAlertOpen(true);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <p className='text-muted-foreground p-6'>Loading...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-6'>
        <header>
          <h1 className='text-2xl font-bold'>Role Permission Manager</h1>
          <p className='text-muted-foreground text-sm'>
            Assign dashboard access permissions based on user roles.
          </p>
        </header>

        <section className='w-full max-w-xl space-y-4'>
          {/* Role selector */}
          <div>
            <label className='mb-2 block font-medium'>Select Role</label>
            <select
              className='block w-full rounded-md border px-3 py-2 text-sm'
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Allowed pages */}
          <div>
            <label className='mb-2 block font-medium'>Allowed Pages</label>
            <div className='space-y-2 rounded-md border p-3'>
              {PAGE_OPTIONS.map((page) => (
                <label
                  key={page.id}
                  className='flex items-center gap-2 text-sm'
                >
                  <input
                    type='checkbox'
                    className='h-4 w-4'
                    checked={allowedPages.includes(page.id)}
                    onChange={() => togglePage(page.id)}
                  />
                  <span>{page.label}</span>
                  <span className='text-muted-foreground text-xs'>
                    {page.id}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Button onClick={savePermissions} disabled={saving}>
              {saving ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        </section>

        {/* Alert */}
        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isSuccess ? 'Success' : 'Error'}
              </AlertDialogTitle>
              <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setAlertOpen(false);
                  if (isSuccess) router.refresh();
                }}
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageContainer>
  );
}
