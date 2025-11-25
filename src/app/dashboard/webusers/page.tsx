// src/app/dashboard/webusers/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

type WebUser = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  createdAt?: string;
  [k: string]: any;
};

export default function WebUsersPage() {
  const [users, setUsers] = useState<WebUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch registrations from our proxy API
  useEffect(() => {
    let mounted = true;

    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await fetch('/api/webusers', {
          cache: 'no-store',
          credentials: 'include'
        });
        const json = await res.json();

        // Extract registrations array (common shape from your backend)
        const regs = Array.isArray(json?.registrations)
          ? json.registrations
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : json?.users || [];

        if (mounted) {
          // normalize created_at -> createdAt
          const normalized = regs.map((r: any) => ({
            ...r,
            createdAt: r.createdAt || r.created_at || r.created_at?.toString()
          }));
          setUsers(normalized);
        }
      } catch (err) {
        console.error('Error fetching web users:', err);
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUsers();
    return () => {
      mounted = false;
    };
  }, []);

  // Delete (example) - you may adapt endpoint if available
  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/webusers/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok && data.success !== false) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      } else {
        console.error('Delete failed:', data);
        alert(data?.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Delete failed');
    } finally {
      setDeleting(false);
      setAlertOpen(false);
      setSelectedId(null);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4 p-6'>
        {/* Header */}
        <div className='flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>
            Web Registered Users
          </h1>

          <div className='flex items-center gap-2'>
            <Input
              placeholder='Search name, email or phone...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
            />

            <Link
              href='/dashboard/webusers/new'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <IconPlus className='mr-2 h-4 w-4' /> Add New
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm transition-colors'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                {/* <TableHead className='pr-6 text-right'>Actions</TableHead> */}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className='h-5 w-40' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-5 w-56' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-5 w-32' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-5 w-40' />
                    </TableCell>
                    <TableCell className='pr-6 text-right'>
                      <Skeleton className='inline-block h-6 w-24' />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((u, idx) => (
                  <TableRow
                    key={u._id}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell className='font-medium'>
                      {u.name || '—'}
                    </TableCell>
                    <TableCell>{u.email || '—'}</TableCell>
                    <TableCell>{u.phone || '—'}</TableCell>
                    <TableCell>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-muted-foreground py-10 text-center text-sm'
                  >
                    No registrations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the registration permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => selectedId && handleDelete(selectedId)}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
