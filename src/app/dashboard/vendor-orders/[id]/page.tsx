'use client';

import React, { useEffect, useState, use } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

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
  createdAt: string;
  updatedAt: string;
}

export default function VendorOrderDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      try {
        const res = await fetch(`/api/vendor-orders/${id}`);
        const data = await res.json();
        console.log('Single Vendor Order Data:', data);

        // Handle varied response structures
        let foundOrder: VendorOrder | null = null;
        if (data && data._id) {
          foundOrder = data;
        } else if (data.data && data.data._id) {
          foundOrder = data.data;
        } else if (data.vendorOrder && data.vendorOrder._id) {
          foundOrder = data.vendorOrder;
        } else if (data.vendor_order && data.vendor_order._id) {
          foundOrder = data.vendor_order;
        }

        // If specific order not found in structure, assume it might be in a list if API returned array
        if (!foundOrder && Array.isArray(data)) {
          foundOrder = data.find((o: any) => o._id === id) || null;
        }

        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          console.error('Order not found in response:', data);
        }
      } catch (error) {
        console.error('Error fetching vendor order:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    setStatusUpdating(true);
    try {
      console.log(`Updating status to ${newStatus}`);
      const res = await fetch(`/api/vendor-orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_status: newStatus })
      });

      if (res.ok) {
        setOrder((prev: any) =>
          prev ? { ...prev, vendor_status: newStatus } : null
        );
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className='space-y-4 p-6'>
          <Skeleton className='h-10 w-1/3' />
          <Skeleton className='h-[200px] w-full' />
          <Skeleton className='h-[300px] w-full' />
        </div>
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer>
        <div className='flex flex-col items-center justify-center space-y-4 p-10'>
          <h2 className='text-xl font-semibold'>Vendor Order Not Found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='w-full space-y-6 p-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>
            Vendor Order Details
          </h1>
          <Button variant='outline' onClick={() => router.back()}>
            Back to List
          </Button>
        </div>

        <div className='grid w-full gap-4 md:grid-cols-2'>
          <Card className='w-full'>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='flex justify-between'>
                <span className='font-semibold'>Company Name:</span>
                <span>{order.vendor_id?.company_name || '—'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='font-semibold'>Phone Number:</span>
                <span>{order.vendor_id?.phone_number || '—'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='font-semibold'>Vendor ID:</span>
                <span className='text-muted-foreground text-sm'>
                  {order.vendor_id?._id}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className='w-full'>
            <CardHeader>
              <CardTitle>Order Group Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold'>Status:</span>
                <Select
                  value={order.vendor_status}
                  onValueChange={handleStatusChange}
                  disabled={statusUpdating}
                >
                  <SelectTrigger className='h-8 w-[180px]'>
                    {statusUpdating ? (
                      <div className='flex items-center gap-2'>
                        <Loader2 className='h-3 w-3 animate-spin' />
                        <span className='text-xs'>Updating...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder='Select status' />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='requested'>Requested</SelectItem>
                    <SelectItem value='picked_up'>Picked Up</SelectItem>
                    <SelectItem value='processing'>Processing</SelectItem>
                    <SelectItem value='washing_completed'>
                      Washing Completed
                    </SelectItem>
                    <SelectItem value='preparing_for_dispatch'>
                      Preparing for Dispatch
                    </SelectItem>
                    <SelectItem value='ready_to_deliver'>
                      Ready to Deliver
                    </SelectItem>
                    <SelectItem value='out_for_delivery'>
                      Out for Delivery
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex justify-between'>
                <span className='font-semibold'>Created At:</span>
                <span>
                  {order.createdAt
                    ? format(new Date(order.createdAt), 'PP p')
                    : '—'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='font-semibold'>Last Updated:</span>
                <span>
                  {order.updatedAt
                    ? format(new Date(order.updatedAt), 'PP p')
                    : '—'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='font-semibold'>Total Orders:</span>
                <span>{order.order_ids?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='w-full'>
          <CardHeader>
            <CardTitle>Included Orders</CardTitle>
            <CardDescription>
              List of individual orders in this vendor request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='relative h-[500px] overflow-y-auto rounded-md border'>
              <Table>
                <TableHeader className='bg-secondary sticky top-0 z-10'>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>User Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Pickup Time</TableHead>
                    <TableHead>Pickup Address</TableHead>
                    <TableHead className='text-right'>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_ids && order.order_ids.length > 0 ? (
                    order.order_ids.map((subOrder: any) => (
                      <TableRow key={subOrder._id}>
                        <TableCell className='font-mono text-xs'>
                          {subOrder._id}
                        </TableCell>
                        <TableCell>{subOrder.user_status || '—'}</TableCell>
                        <TableCell>{subOrder.payment_status || '—'}</TableCell>
                        <TableCell>
                          {subOrder.pickup_date
                            ? format(new Date(subOrder.pickup_date), 'PP')
                            : ''}{' '}
                          <br />
                          {subOrder.pickup_time_slot?.start} -{' '}
                          {subOrder.pickup_time_slot?.end}
                        </TableCell>
                        <TableCell>
                          <div
                            className='max-w-[200px] truncate'
                            title={subOrder.pickup_address?.address_line}
                          >
                            {subOrder.pickup_address?.address_line || '—'}
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          {subOrder.total_price}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className='py-4 text-center'>
                        No orders data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
