'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

import { useUser } from '@/components/layout/user-provider';

interface VendorRef {
  _id: string;
  company_name: string;
  phone_number: string;
}

interface VendorOrder {
  _id: string;
  vendor_id: VendorRef;
  order_ids: any[];
  vendor_status: string;
  total_weight?: number;
  total_price?: number;
  createdAt: string;
  updatedAt: string;
}

export default function VendorOrdersPage() {
  const { admin } = useUser();
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Fetch vendor orders
  useEffect(() => {
    async function fetchVendorOrders() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (admin?.role === 'hub_user' && admin?.hub_id) {
          queryParams.append('hub_id', admin.hub_id);
        }

        const res = await fetch(`/api/vendor-orders?${queryParams.toString()}`);
        const data = await res.json();
        console.log('Vendor Orders Data type:', typeof data);
        console.log('Is Array?', Array.isArray(data));

        let orders: VendorOrder[] = [];
        if (Array.isArray(data)) {
          orders = data;
        } else if (data.data && Array.isArray(data.data)) {
          orders = data.data;
        } else if (data.vendorOrders && Array.isArray(data.vendorOrders)) {
          orders = data.vendorOrders;
        } else if (data.vendor_orders && Array.isArray(data.vendor_orders)) {
          orders = data.vendor_orders;
        }

        setVendorOrders(orders);
      } catch (error) {
        console.error('Error fetching vendor orders:', error);
        setVendorOrders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchVendorOrders();
  }, [admin?.hub_id, admin?.role]);

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return vendorOrders;
    const lowerSearch = search.toLowerCase();
    return vendorOrders.filter((order) => {
      const vendorName = order.vendor_id?.company_name?.toLowerCase() || '';
      const vendorPhone = order.vendor_id?.phone_number?.toLowerCase() || '';
      const status = order.vendor_status?.toLowerCase() || '';

      return (
        vendorName.includes(lowerSearch) ||
        vendorPhone.includes(lowerSearch) ||
        status.includes(lowerSearch)
      );
    });
  }, [vendorOrders, search]);

  const start = (pageIndex - 1) * perPage;
  const end = start + perPage;
  const displayedOrders = filteredOrders.slice(start, end);
  const pageCount = Math.max(
    1,
    Math.ceil((filteredOrders.length || 0) / perPage)
  );

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4 p-6'>
        <div className='flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>Vendor Orders</h1>
          <Input
            type='text'
            placeholder='Search by vendor, status...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
          />
        </div>

        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead className='text-foreground/80'>Vendor</TableHead>
                <TableHead className='text-foreground/80'>Contact</TableHead>
                <TableHead className='text-foreground/80'>
                  Vendor Status
                </TableHead>
                <TableHead className='text-foreground/80'>
                  Orders Count
                </TableHead>
                <TableHead className='text-foreground/80'>
                  Total Weight
                </TableHead>
                <TableHead className='text-foreground/80'>
                  Total Price
                </TableHead>
                <TableHead className='text-foreground/80'>Created At</TableHead>
                <TableHead className='text-foreground/80 pr-6 text-right'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/40 h-6 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayedOrders.length > 0 ? (
                displayedOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className='font-medium'>
                      {order.vendor_id?.company_name || '—'}
                    </TableCell>
                    <TableCell>
                      {order.vendor_id?.phone_number || '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          order.vendor_status === 'new'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : order.vendor_status === 'accepted'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : order.vendor_status === 'dispatched'
                                ? 'bg-purple-100 text-purple-800 dark:bg-red-900 dark:text-purple-200'
                                : order.vendor_status === 'vendor_declined'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-red-900 dark:text-purple-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {order.vendor_status || '—'}
                      </span>
                    </TableCell>
                    <TableCell>{order.order_ids?.length || 0}</TableCell>
                    <TableCell>{order.total_weight || '—'}</TableCell>
                    <TableCell>
                      {order.total_price ? `₹${order.total_price}` : '—'}
                    </TableCell>
                    <TableCell>
                      {order.createdAt
                        ? format(new Date(order.createdAt), 'PP p')
                        : '—'}
                    </TableCell>
                    <TableCell className='space-x-2 pr-6 text-right'>
                      <Link href={`/dashboard/vendor-orders/${order._id}`}>
                        <Button variant='outline' size='sm'>
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='text-muted-foreground py-10 text-center text-sm'
                  >
                    No vendor orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className='border-border bg-card text-foreground border-t p-3'>
          <div className='flex w-full flex-wrap items-center justify-between gap-4 sm:gap-8'>
            <div className='text-muted-foreground text-sm'>
              {filteredOrders.length} total records found.
            </div>

            <div className='flex items-center gap-4 sm:gap-6 lg:gap-8'>
              <div className='flex items-center space-x-2'>
                <p className='text-sm font-medium whitespace-nowrap'>
                  Rows per page
                </p>
                <Select
                  value={`${perPage}`}
                  onValueChange={(value) => {
                    setPageIndex(1);
                    setPerPage(Number(value));
                  }}
                >
                  <SelectTrigger className='border-input bg-background text-foreground h-8 w-[4.5rem] border'>
                    <SelectValue placeholder={perPage} />
                  </SelectTrigger>
                  <SelectContent side='top' className='bg-card text-foreground'>
                    {[10, 20, 30, 40, 50].map((n) => (
                      <SelectItem key={n} value={`${n}`}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='text-sm font-medium'>
                Page {pageIndex} of {pageCount}
              </div>

              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setPageIndex(1)}
                  disabled={pageIndex <= 1}
                  className='hidden size-8 lg:flex'
                >
                  «
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  disabled={pageIndex <= 1}
                  className='size-8'
                >
                  ‹
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() =>
                    setPageIndex((p) => Math.min(pageCount, p + 1))
                  }
                  disabled={pageIndex >= pageCount}
                  className='size-8'
                >
                  ›
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setPageIndex(pageCount)}
                  disabled={pageIndex >= pageCount}
                  className='hidden size-8 lg:flex'
                >
                  »
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
