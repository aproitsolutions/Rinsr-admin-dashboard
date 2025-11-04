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

  // Search filter
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

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        {/* Header */}
        <div className='flex w-full items-center justify-between gap-2 p-3'>
          <input
            type='text'
            placeholder='Search orders...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='focus:ring-primary w-60 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none'
          />
        </div>

        {/* Table + Pagination */}
        <div className='flex flex-1 flex-col rounded-lg border bg-white'>
          <div
            className={`relative flex-1 ${
              perPage > 20
                ? 'max-h-[500px] overflow-y-auto'
                : 'overflow-visible'
            }`}
          >
            <div className='flex h-full flex-1 flex-col rounded-lg border bg-white'>
              <Table className='w-full border-collapse'>
                <TableHeader className='bg-muted sticky top-0 z-10'>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Pickup Slot</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    Array.from({ length: perPage }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className='h-6 w-full' />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : displayedOrders.length > 0 ? (
                    displayedOrders.map((order, idx) => (
                      <TableRow
                        key={order.id ?? idx}
                        className={idx % 2 ? 'bg-gray-50' : ''}
                      >
                        <TableCell className='font-medium'>
                          {order.plan_name || '—'}
                        </TableCell>

                        {/* ✅ Display Admin if user_id is null */}
                        <TableCell>
                          {order.name && order.name !== 'N/A'
                            ? order.name
                            : 'Admin'}
                        </TableCell>

                        <TableCell>{order.plan_id_name || '—'}</TableCell>
                        <TableCell>{order.address_line || '—'}</TableCell>
                        <TableCell>{order.pickup_time_slot || '—'}</TableCell>

                        {/* ✅ New Actions column */}
                        <TableCell className='text-right'>
                          <Link
                            href={`/dashboard/orders/order/${order.id}/edit`}
                          >
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex items-center gap-2'
                            >
                              <Pencil className='h-4 w-4' />
                              Edit
                            </Button>
                          </Link>
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
          </div>

          {/* Pagination */}
          <div className='border-t bg-white p-2 sm:p-3'>
            <div className='flex w-full items-center justify-between gap-4 sm:gap-8'>
              <div className='text-muted-foreground flex-1 text-sm whitespace-nowrap'>
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
                    <SelectTrigger className='h-8 w-[4.5rem]'>
                      <SelectValue placeholder={perPage} />
                    </SelectTrigger>
                    <SelectContent side='top'>
                      {[10, 20, 30, 40, 50].map((n) => (
                        <SelectItem key={n} value={`${n}`}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex items-center justify-center text-sm font-medium'>
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
      </div>
    </PageContainer>
  );
}
