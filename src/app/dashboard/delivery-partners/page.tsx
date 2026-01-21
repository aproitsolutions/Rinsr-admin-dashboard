'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash, Plus, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { IconPencil, IconTrash } from '@tabler/icons-react';

interface DeliveryPartner {
  _id: string;
  company_name: string;
  location: string;
  phone_number: string;
  is_active: boolean;
  total_completed_orders: number;
}

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [perPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 🔹 Fetch all delivery partners
  useEffect(() => {
    async function fetchPartners() {
      setLoading(true);
      try {
        const res = await fetch('/api/delivery-partners', {
          cache: 'no-store'
        });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setPartners(data.data);
        } else {
          setPartners([]);
        }
      } catch (err) {
        console.error('Error fetching delivery partners:', err);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPartners();
  }, []);

  // 🔍 Filter + Pagination
  const filteredPartners = useMemo(() => {
    if (!search.trim()) return partners;
    return partners.filter(
      (p) =>
        p.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone_number?.includes(search)
    );
  }, [partners, search]);

  const total = filteredPartners.length;
  const start = (pageIndex - 1) * perPage;
  const end = start + perPage;
  const displayedPartners = filteredPartners.slice(start, end);

  const onDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/delivery-partners/${deleteId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setPartners(partners.filter((p) => p._id !== deleteId));
        toast.success('Delivery partner deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete delivery partner');
      }
    } catch (err) {
      toast.error('Error deleting delivery partner');
    } finally {
      setDeleteLoading(false);
      setOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-6'>
        <AlertModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={onDelete}
          loading={deleteLoading}
        />

        {/* ✅ Stats Section */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader>
              <CardDescription>Total Partners</CardDescription>
              <CardTitle className='text-2xl font-semibold'>
                {loading ? '...' : partners.length}
              </CardTitle>
              <Badge variant='outline'>
                <Truck className='mr-1 h-4 w-4' /> Active
              </Badge>
            </CardHeader>
          </Card>
        </div>

        {/* 🔍 Search + Header */}
        <div className='mt-4 flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>
            Delivery Partners
          </h1>
          <div className='flex items-center gap-2'>
            <Input
              placeholder='Search partners...'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(1);
              }}
              className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
            />
            <Link href='/dashboard/delivery-partners/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' /> Add New
              </Button>
            </Link>
          </div>
        </div>

        {/* 📋 Table */}
        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm transition-colors'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className='pr-6 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/50 h-5 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayedPartners.length > 0 ? (
                displayedPartners.map((partner, idx) => (
                  <TableRow
                    key={partner._id}
                    className={cn(
                      'hover:bg-accent transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell className='font-medium'>
                      {partner.company_name}
                    </TableCell>
                    <TableCell>{partner.location}</TableCell>
                    <TableCell>{partner.phone_number}</TableCell>
                    <TableCell>
                      <Badge
                        variant={partner.is_active ? 'default' : 'destructive'}
                        className='rounded-full'
                      >
                        {partner.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.total_completed_orders}</TableCell>
                    <TableCell className='pr-6 text-right'>
                      <div className='flex justify-end gap-2'>
                        <Link
                          href={`/dashboard/delivery-partners/${partner._id}`}
                        >
                          <Button
                            variant='outline'
                            size='sm'
                            className='cursor-pointer'
                          >
                            View
                          </Button>
                        </Link>

                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => {
                            setDeleteId(partner._id);
                            setOpen(true);
                          }}
                        >
                          <IconTrash className='mr-2 h-4 w-4' /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-muted-foreground py-10 text-center'
                  >
                    No delivery partners found.
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
