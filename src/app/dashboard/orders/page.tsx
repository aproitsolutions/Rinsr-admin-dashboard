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
import { Input } from '@/components/ui/input';
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

interface OrdersPageProps {
  className?: string;
}

export default function OrdersPage({ className }: OrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

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
        } else {
          setOrders([]);
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
      console.log(data);

      if (data.success) {
        // Update the cancelled order status in state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: 'cancelled' } : order
          )
        );
        setAlertMessage('✅ Order cancelled successfully!');
      } else {
        setAlertMessage(`⚠️ ${data.message || 'Failed to cancel the order'}`);
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      setAlertMessage('❌ Something went wrong. Please try again.');
    }
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4 p-6'>
        {/* Header */}
        <div className='flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>Orders</h1>
          <Input
            type='text'
            placeholder='Search orders...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
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
                <TableHead className='text-foreground/80'>
                  Order Status
                </TableHead>
                <TableHead className='text-foreground/80'>Hub</TableHead>
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
                displayedOrders.map((order, idx) => {
                  const isCancelled = order.status === 'cancelled';
                  return (
                    <TableRow
                      key={order.id ?? idx}
                      className='hover:bg-accent hover:text-accent-foreground transition-colors'
                    >
                      <TableCell className='font-medium'>
                        {order.plan_name || '—'}
                      </TableCell>

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
                      <TableCell>{order.status || '—'}</TableCell>
                      <TableCell>
                        {(() => {
                          const hub = order.hub_id || order.hub;
                          if (typeof hub === 'object' && hub?.name) {
                            return hub.name;
                          }
                          if (typeof hub === 'string') {
                            return hub;
                          }
                          return '—';
                        })()}
                      </TableCell>

                      <TableCell className='space-x-2 pr-6 text-right'>
                        <Link href={`/dashboard/orders/order/${order.id}/edit`}>
                          <Button
                            variant='outline'
                            size='sm'
                            className='hover:bg-accent hover:text-accent-foreground cursor-pointer'
                          >
                            <Pencil className='mr-2 h-4 w-4' />
                            Edit
                          </Button>
                        </Link>

                        {/* Cancel Button */}
                        {isCancelled ? (
                          <Button
                            variant='secondary'
                            size='sm'
                            disabled
                            className='ml-2 cursor-not-allowed opacity-70'
                          >
                            Cancelled
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='destructive'
                                size='sm'
                                className='ml-2 cursor-pointer'
                              >
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Cancel Order
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this order?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Close</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelOrder(order.id)}
                                >
                                  Confirm Cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
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

        {/* ✅ Alert Dialog for messages */}
        {alertMessage && (
          <AlertDialog
            open={!!alertMessage}
            onOpenChange={() => setAlertMessage(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Notification</AlertDialogTitle>
                <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setAlertMessage(null)}>
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </PageContainer>
  );
}
