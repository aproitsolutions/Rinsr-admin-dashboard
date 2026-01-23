'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Truck,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Service {
  service_id: string;
  name: string;
  price: number;
  _id: string;
}

interface DailyStats {
  date: string;
  total_orders: number; // The JSON says "total_orders"
  amount: number;
  payment_status: string;
}

interface Vendor {
  _id: string;
  company_name: string;
  location: string;
  location_coordinates: string;
  phone_number: string;
  is_active: boolean;
  total_completed_orders: number;
  services: Service[];
  current_day_stats: DailyStats;
  daily_history: any[];
  createdAt: string;
  updatedAt: string;
}

export default function VendorDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    params.then((unwrap) => setId(unwrap.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchVendor() {
      setLoading(true);
      try {
        const res = await fetch(`/api/vendors/${id}`);
        const data = await res.json();
        if (data.success) {
          setVendor(data.vendor);
        } else {
          toast.error(data.message || 'Failed to fetch vendor details');
        }
      } catch (err) {
        console.error('Error fetching vendor:', err);
        toast.error('Error loading details');
      } finally {
        setLoading(false);
      }
    }
    fetchVendor();
  }, [id]);

  const handlePaymentStatusUpdate = async (date: string, newStatus: string) => {
    if (!vendor || !id) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: date,
          status: newStatus
        })
      });

      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(`Payment status updated to ${newStatus}`);
        setVendor((prev) => {
          if (!prev) return null;

          // Update current_day_stats if the date matches
          let newCurrentDayStats = prev.current_day_stats;
          if (
            prev.current_day_stats?.date &&
            new Date(prev.current_day_stats.date)
              .toISOString()
              .split('T')[0] === new Date(date).toISOString().split('T')[0]
          ) {
            newCurrentDayStats = {
              ...prev.current_day_stats,
              payment_status: newStatus
            };
          } else if (
            !prev.current_day_stats &&
            new Date().toISOString().split('T')[0] ===
              new Date(date).toISOString().split('T')[0]
          ) {
            // Edge case: if current stats were null but now exist
            newCurrentDayStats = {
              date,
              total_orders: 0,
              amount: 0,
              payment_status: newStatus
            };
          }

          // Update daily_history
          const newDailyHistory =
            prev.daily_history?.map((stat) => {
              if (
                new Date(stat.date).toISOString().split('T')[0] ===
                new Date(date).toISOString().split('T')[0]
              ) {
                return { ...stat, payment_status: newStatus };
              }
              return stat;
            }) || [];

          return {
            ...prev,
            current_day_stats: newCurrentDayStats,
            daily_history: newDailyHistory
          };
        });
      } else {
        toast.error(data.message || 'Failed to update payment status');
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      toast.error('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className='space-y-4 p-6'>
          <Skeleton className='h-8 w-1/3' />
          <Skeleton className='h-64 w-full' />
        </div>
      </PageContainer>
    );
  }

  if (!vendor) {
    return (
      <PageContainer>
        <div className='flex flex-col items-center justify-center space-y-4 p-10 text-center'>
          <h2 className='text-2xl font-bold'>Vendor Not Found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  const { current_day_stats, daily_history } = vendor;

  // For current day stats, if date is missing, assume today's date for display/logic fallback
  const todayDate = new Date().toISOString().split('T')[0];
  const currentStatDate = current_day_stats?.date || todayDate;

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='icon' onClick={() => router.back()}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>
              {vendor.company_name}
            </h1>
            <p className='text-muted-foreground flex items-center gap-2 text-sm'>
              <MapPin className='h-3 w-3' /> {vendor.location}
            </p>
          </div>
          <div className='ml-auto'>
            <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
              {vendor.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          {/* General Info */}
          <Card className='md:col-span-2'>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Phone Number
                  </p>
                  <div className='mt-1 flex items-center gap-2'>
                    <Phone className='text-primary h-4 w-4' />
                    <span>{vendor.phone_number}</span>
                  </div>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Total Completed Orders
                  </p>
                  <div className='mt-1 flex items-center gap-2'>
                    <Truck className='text-primary h-4 w-4' />
                    <span>{vendor.total_completed_orders}</span>
                  </div>
                </div>
              </div>

              <div className='mt-6'>
                <p className='text-muted-foreground mb-3 text-sm font-medium'>
                  Services Offered
                </p>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  {vendor.services?.map((service) => (
                    <div
                      key={service._id}
                      className='bg-muted/40 flex items-center justify-between rounded-md border p-3'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{service.name}</span>
                      </div>
                      <Badge variant='outline'>₹{service.price}</Badge>
                    </div>
                  ))}
                  {!vendor.services?.length && (
                    <p className='text-muted-foreground text-sm'>
                      No services listed.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Day Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Stats</CardTitle>
              <CardDescription>
                {current_day_stats?.date
                  ? new Date(current_day_stats.date).toDateString()
                  : 'No stats for today'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {current_day_stats ? (
                <>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Total Orders
                      </span>
                      <span className='flex items-center gap-2 font-medium'>
                        <ShoppingBag className='text-muted-foreground h-4 w-4' />
                        {current_day_stats.total_orders}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Total Amount
                      </span>
                      <span className='text-lg font-medium'>
                        ₹{current_day_stats.amount}
                      </span>
                    </div>
                  </div>

                  <div className='border-t pt-4'>
                    <p className='mb-3 flex items-center gap-2 text-sm font-medium'>
                      <Wallet className='h-4 w-4' /> Payment Status
                    </p>
                    <Select
                      disabled={updating}
                      value={current_day_stats.payment_status}
                      onValueChange={(val) =>
                        handlePaymentStatusUpdate(currentStatDate, val)
                      }
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select Status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='paid'>Paid</SelectItem>
                        {/* <SelectItem value="failed">Failed</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className='text-muted-foreground py-6 text-center'>
                  No stats available for the current day.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily History Table */}
          <Card className='md:col-span-3'>
            <CardHeader>
              <CardTitle>Daily History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daily_history && daily_history.length > 0 ? (
                    daily_history.map((stat, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {stat.date
                            ? new Date(stat.date).toDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{stat.total_orders}</TableCell>
                        <TableCell>₹{stat.amount}</TableCell>
                        <TableCell>
                          <Select
                            disabled={updating}
                            value={stat.payment_status}
                            onValueChange={(val) =>
                              handlePaymentStatusUpdate(stat.date, val)
                            }
                          >
                            <SelectTrigger className='h-8 w-[130px]'>
                              <SelectValue placeholder='Status' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='pending'>Pending</SelectItem>
                              <SelectItem value='paid'>Paid</SelectItem>
                              {/* <SelectItem value="failed">Failed</SelectItem> */}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className='text-muted-foreground h-24 text-center'
                      >
                        No daily history found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
