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
import { getOrders } from '@/lib/api/orders';
import { Order } from '@/constants/data';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrdersPageProps {
  className?: string;
}

export default function OrdersPage({ className }: OrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const response = await getOrders({
          page: pageIndex,
          limit: perPage,
          search
        });

        if (response.success && Array.isArray(response.data)) {
          setOrders(response.data);
          setTotal(response.total ?? response.data.length);
        } else {
          setOrders([]);
          setTotal(0);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [search, pageIndex, perPage]);

  // Filter logic
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    return orders.filter(
      (o) =>
        o.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.plan_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.address_line?.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const start = (pageIndex - 1) * perPage;
  const end = start + perPage;
  const displayedOrders = filteredOrders.slice(start, end);
  const pageCount = Math.max(
    1,
    Math.ceil((filteredOrders.length || 0) / perPage)
  );

  // Cancel order function
  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/order/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        // Update state to remove the canceled order or refresh the list
        setOrders(orders.filter((order) => order.id !== orderId));
      } else {
        alert('Failed to cancel the order');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4 p-6'>
        {/* Header */}
        <div className='flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>Orders</h1>
          <input
            type='text'
            placeholder='Search orders...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='border-input bg-card text-foreground focus:ring-ring max-w-xs rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:ring-2 focus:outline-none'
          />
        </div>

        {/* Table */}
        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead className='text-foreground/80'>Plan Name</TableHead>
                <TableHead className='text-foreground/80'>Name</TableHead>
                <TableHead className='text-foreground/80'>Plan</TableHead>
                <TableHead className='text-foreground/80'>Address</TableHead>
                <TableHead className='text-foreground/80'>
                  Pickup Slot
                </TableHead>
                <TableHead className='text-foreground/80 pr-6 text-right'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/40 h-6 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayedOrders.length > 0 ? (
                displayedOrders.map((order, idx) => (
                  <TableRow
                    key={order.id ?? idx}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell className='font-medium'>
                      {order.plan_name || '—'}
                    </TableCell>

                    {/* ✅ Admin fallback */}
                    <TableCell>
                      {order.name && order.name !== 'N/A'
                        ? order.name
                        : 'Admin'}
                    </TableCell>

                    <TableCell>{order.plan_id_name || '—'}</TableCell>
                    <TableCell>{order.address_line || '—'}</TableCell>
                    <TableCell>
                      {typeof order.pickup_time_slot === 'string'
                        ? order.pickup_time_slot
                        : '—'}
                    </TableCell>

                    <TableCell className='pr-6 text-right'>
                      <Link href={`/dashboard/orders/order/${order.id}/edit`}>
                        <Button
                          variant='outline'
                          size='sm'
                          className='hover:bg-accent hover:text-accent-foreground'
                        >
                          <Pencil className='mr-2 h-4 w-4' />
                          Edit
                        </Button>
                      </Link>
                      {/* Cancel Button */}
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleCancelOrder(order.id)}
                        className='ml-2'
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-muted-foreground py-10 text-center text-sm'
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className='border-border bg-card text-foreground border-t p-3'>
          <div className='flex w-full flex-wrap items-center justify-between gap-4 sm:gap-8'>
            <div className='text-muted-foreground text-sm'>
              {filteredOrders.length} total orders found.
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
