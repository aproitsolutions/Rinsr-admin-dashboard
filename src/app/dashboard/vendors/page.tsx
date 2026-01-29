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

interface Vendor {
  _id: string;
  companyName: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  phoneNumber: string;
  services: any[];
  createdAt?: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fetch vendors
  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      try {
        const res = await fetch('/api/vendors', { cache: 'no-store' });
        const data = await res.json();
        console.log('📦 Vendor response:', data);

        const rawVendors = data.data?.vendors || data.vendors || [];

        const normalized = rawVendors.map((v: any) => ({
          _id: v._id,
          companyName: v.company_name,
          location: v.location,
          phoneNumber: v.phone_number,
          services: v.services || [],
          coordinates: v.location_coordinates,
          createdAt: v.createdAt
        }));

        setVendors(normalized);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    }

    fetchVendors();
  }, []);

  // Filter vendors by search
  const filteredVendors = useMemo(() => {
    if (!search.trim()) return vendors;
    return vendors.filter(
      (v) =>
        v.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        v.location?.toLowerCase().includes(search.toLowerCase()) ||
        v.phoneNumber?.toLowerCase().includes(search.toLowerCase())
    );
  }, [vendors, search]);

  // Delete vendor
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Vendor deleted successfully');
        setVendors((prev) => prev.filter((v) => v._id !== id));
      } else {
        toast.error(data.message || 'Failed to delete vendor.');
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
          <h1 className='text-2xl font-bold'>Vendors</h1>
          <div className='flex items-center gap-2'>
            <Input
              placeholder='Search vendors...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
            />
            <Link
              href='/dashboard/vendors/new'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <IconPlus className='mr-2 h-4 w-4' /> Add Vendor
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm transition-colors'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Services</TableHead>
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
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((vendor, idx) => (
                  <TableRow
                    key={vendor._id}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell>{vendor.companyName}</TableCell>
                    <TableCell>{vendor.location}</TableCell>
                    <TableCell>{vendor.phoneNumber}</TableCell>
                    <TableCell>
                      {vendor.services?.length > 0
                        ? vendor.services
                            .map((s: any) => s.name || s)
                            .join(', ')
                        : '—'}
                    </TableCell>
                    <TableCell className='flex justify-end gap-2 pr-6'>
                      <Link href={`/dashboard/vendors/${vendor._id}`}>
                        <Button
                          variant='outline'
                          size='sm'
                          className='cursor-pointer'
                        >
                          <IconPencil className='mr-2 h-4 w-4' /> View
                        </Button>
                      </Link>

                      {/*   Delete with confirmation */}
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
                            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The vendor will be
                              permanently removed from your system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(vendor._id)}
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
                    colSpan={5}
                    className='text-muted-foreground py-10 text-center text-sm'
                  >
                    No vendors found.
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
