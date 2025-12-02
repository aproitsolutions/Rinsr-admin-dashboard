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
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Hub {
  _id: string;
  name: string;
  location: string;
  location_coordinates?: string;
  primary_contact: string;
  secondary_contact?: string;
  vendor_ids?: any[];
  delivery_partner_ids?: any[];
  createdAt?: string;
}

export default function HubsPage() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fetch hubs
  useEffect(() => {
    async function fetchHubs() {
      setLoading(true);
      try {
        const res = await fetch('/api/hubs', { cache: 'no-store' });
        const data = await res.json();
        console.log('📦 Hubs response:', data);

        const rawHubs =
          data.hubs ||
          data.data?.hubs ||
          (Array.isArray(data) ? data : []) ||
          [];

        const normalized: Hub[] = rawHubs.map((h: any) => ({
          _id: h._id,
          name: h.name,
          location: h.location,
          location_coordinates: h.location_coordinates,
          primary_contact: h.primary_contact,
          secondary_contact: h.secondary_contact,
          vendor_ids: h.vendor_ids,
          delivery_partner_ids: h.delivery_partner_ids,
          createdAt: h.createdAt
        }));

        setHubs(normalized);
      } catch (error) {
        console.error('Error fetching hubs:', error);
        setHubs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHubs();
  }, []);

  // Filter hubs by search
  const filteredHubs = useMemo(() => {
    if (!search.trim()) return hubs;
    const term = search.toLowerCase();
    return hubs.filter(
      (h) =>
        h.name?.toLowerCase().includes(term) ||
        h.location?.toLowerCase().includes(term) ||
        h.primary_contact?.toLowerCase().includes(term) ||
        h.secondary_contact?.toLowerCase().includes(term)
    );
  }, [hubs, search]);

  // Delete hub
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/hubs/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Hub deleted successfully');
        setHubs((prev) => prev.filter((h) => h._id !== id));
      } else {
        toast.error(data.message || 'Failed to delete hub.');
      }
    } catch {
      toast.error('Something went wrong while deleting.');
    }
  }

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4 p-6'>
        {/* Header */}
        <div className='flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>Hubs</h1>
          <div className='flex items-center gap-2'>
            <Input
              placeholder='Search hubs...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
            />
            <Link
              href='/dashboard/hubs/new'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <IconPlus className='mr-2 h-4 w-4' /> Add Hub
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm transition-colors'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Primary Contact</TableHead>
                <TableHead>Secondary Contact</TableHead>
                <TableHead>Vendors</TableHead>
                <TableHead>Delivery Partners</TableHead>
                <TableHead className='pr-6 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/50 h-5 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredHubs.length > 0 ? (
                filteredHubs.map((hub, idx) => (
                  <TableRow
                    key={hub._id}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell className='font-medium'>{hub.name}</TableCell>
                    <TableCell>{hub.location}</TableCell>
                    <TableCell>{hub.primary_contact}</TableCell>
                    <TableCell>{hub.secondary_contact || '—'}</TableCell>
                    <TableCell>
                      {Array.isArray(hub.vendor_ids) &&
                      hub.vendor_ids.length > 0
                        ? `${hub.vendor_ids.length} linked`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(hub.delivery_partner_ids) &&
                      hub.delivery_partner_ids.length > 0
                        ? `${hub.delivery_partner_ids.length} linked`
                        : '—'}
                    </TableCell>
                    <TableCell className='flex justify-end gap-2 pr-6'>
                      <Link href={`/dashboard/hubs/${hub._id}/edit`}>
                        <Button
                          variant='outline'
                          size='sm'
                          className='cursor-pointer'
                        >
                          <IconPencil className='mr-2 h-4 w-4' /> Edit
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='destructive'
                            size='sm'
                            className='cursor-pointer'
                          >
                            <IconTrash className='mr-2 h-4 w-4' /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Hub?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The hub will be
                              permanently removed from your system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(hub._id)}
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-muted-foreground py-10 text-center text-sm'
                  >
                    No hubs found.
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
