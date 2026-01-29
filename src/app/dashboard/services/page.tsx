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
import { Pencil, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Service {
  _id: string;
  name: string;
  price: string | number;
  createdAt?: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [perPage] = useState(10);

  // 🔹 Fetch all services
  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        const res = await fetch('/api/services', { cache: 'no-store' });
        const data = await res.json();

        if (data.success && Array.isArray(data.services)) {
          setServices(data.services);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setServices([]);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  // 🔍 Filter + Pagination
  const filteredServices = useMemo(() => {
    if (!search.trim()) return services;
    return services.filter((s) =>
      s.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [services, search]);

  const total = filteredServices.length;
  const start = (pageIndex - 1) * perPage;
  const end = start + perPage;
  const displayedServices = filteredServices.slice(start, end);
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-6'>
        {/*   Services Stats Section */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader>
              <CardDescription>Total Services</CardDescription>
              <CardTitle className='text-2xl font-semibold'>
                {loading ? '...' : services.length}
              </CardTitle>
              <Badge variant='outline'>
                <Package className='mr-1 h-4 w-4' /> Listed
              </Badge>
            </CardHeader>
          </Card>
        </div>

        <div className='mt-4 flex w-full items-center justify-between gap-2'>
          <div className='flex items-center gap-4'>
            <h1 className='text-foreground text-2xl font-bold'>Services</h1>
            <Link href='/dashboard/services/new'>
              <Button size='sm' className='cursor-pointer hover:pr-2'>
                <Package className='mr-2 h-4 w-4' /> Create Service
              </Button>
            </Link>
          </div>
          <Input
            placeholder='Search services...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(1);
            }}
            className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
          />
        </div>

        {/* 📋 Table */}
        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm transition-colors'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className='pr-6 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/50 h-5 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayedServices.length > 0 ? (
                displayedServices.map((service, idx) => (
                  <TableRow
                    key={service._id}
                    className={cn(
                      'hover:bg-accent transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell>{service.name}</TableCell>
                    <TableCell>₹{service.price}</TableCell>
                    <TableCell className='pr-6 text-right'>
                      <Link href={`/dashboard/services/${service._id}/edit`}>
                        <Button variant='outline' size='sm'>
                          <Pencil className='mr-2 h-4 w-4' /> Edit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className='text-muted-foreground py-10 text-center'
                  >
                    No services found.
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
