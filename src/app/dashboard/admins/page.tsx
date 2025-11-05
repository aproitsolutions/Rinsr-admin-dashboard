'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  createdAt?: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchAdmins() {
      setLoading(true);
      try {
        const res = await fetch('/api/admins', { cache: 'no-store' });
        const data = await res.json();

        if (data.success && Array.isArray(data.admins)) {
          setAdmins(data.admins);
        } else {
          setAdmins([]);
        }
      } catch {
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAdmins();
  }, []);

  const filteredAdmins = useMemo(() => {
    if (!search.trim()) return admins;
    return admins.filter(
      (a) =>
        a.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [admins, search]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to deactivate this admin?')) return;

    try {
      const res = await fetch(`/api/admins/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAdmins((prev) =>
          prev.map((a) => (a._id === id ? { ...a, is_active: false } : a))
        );
      } else {
        alert(data.message || 'Failed to deactivate admin.');
      }
    } catch {
      alert('Something went wrong.');
    }
  }

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4 p-6'>
        {/* Header */}
        <div className='flex w-full items-center justify-between gap-2'>
          <h1 className='text-2xl font-bold'>Admins</h1>
          <div className='flex items-center gap-2'>
            <Input
              placeholder='Search admins...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
            />
            <Link
              href='/dashboard/admins/new'
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
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='pr-6 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/50 h-5 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin, idx) => (
                  <TableRow
                    key={admin._id}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell>{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell className='capitalize'>{admin.role}</TableCell>
                    <TableCell>
                      {admin.is_active ? (
                        <span className='font-medium text-green-600'>
                          Active
                        </span>
                      ) : (
                        <span className='font-medium text-red-500'>
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='flex justify-end gap-2 pr-6'>
                      <Link href={`/dashboard/admins/${admin._id}/edit`}>
                        <Button variant='outline' size='sm'>
                          <IconPencil className='mr-2 h-4 w-4' /> Edit
                        </Button>
                      </Link>
                      <Button
                        variant='destructive'
                        size='sm'
                        disabled={!admin.is_active}
                        onClick={() => handleDelete(admin._id)}
                      >
                        <IconTrash className='mr-2 h-4 w-4' />
                        {admin.is_active ? 'Deactivate' : 'Inactive'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-muted-foreground py-10 text-center text-sm'
                  >
                    No admins found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageContainer>
  );
}
