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
  Calendar,
  Wallet
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';

interface DailyStats {
  _id?: string;
  date: string;
  distance_km: number;
  amount: number;
  payment_status: string;
}

interface DeliveryPartner {
  _id: string;
  company_name: string;
  location: string;
  phone_number: string;
  is_active: boolean;
  total_completed_orders: number;
  current_day_stats: DailyStats;
  daily_history: DailyStats[];
  services: string[];
}

export default function DeliveryPartnerDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>('all');

  useEffect(() => {
    params.then((unwrap) => setId(unwrap.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchPartner() {
      setLoading(true);
      try {
        const res = await fetch(`/api/delivery-partners/${id}`);
        const data = await res.json();
        if (data.success) {
          setPartner(data.data);
        } else {
          toast.error(
            data.message || 'Failed to fetch delivery partner details'
          );
        }
      } catch (err) {
        console.error('Error fetching partner:', err);
        toast.error('Error loading details');
      } finally {
        setLoading(false);
      }
    }
    fetchPartner();
  }, [id]);

  const handlePaymentStatusUpdate = async (date: string, newStatus: string) => {
    if (!partner || !id) return;
    // Optimization: Don't set global updating state for table rows to avoid blocking the whole UI,
    // or use a more granular loading state. For now, we'll keep it simple but maybe acceptable.
    // Actually, let's keep it simple.
    setUpdating(true);

    try {
      const res = await fetch(`/api/delivery-partners/${id}`, {
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
        setPartner((prev) => {
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
            !prev.current_day_stats?.date &&
            new Date().toISOString().split('T')[0] ===
              new Date(date).toISOString().split('T')[0]
          ) {
            // Handle case where current stats exist but might not have a date explicitly set yet (edge case)
            newCurrentDayStats = {
              ...prev.current_day_stats,
              payment_status: newStatus
            };
          }

          // Update daily_history
          const newDailyHistory =
            prev.daily_history?.map((stat) => {
              // Compare dates (assuming YYYY-MM-DD or ISO strings)
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

  if (!partner) {
    return (
      <PageContainer>
        <div className='flex flex-col items-center justify-center space-y-4 p-10 text-center'>
          <h2 className='text-2xl font-bold'>Delivery Partner Not Found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  const { current_day_stats, daily_history } = partner;

  const filteredHistory = daily_history?.filter((stat) => {
    if (historyFilter === 'all') return true;
    return stat.payment_status === historyFilter;
  });

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
              {partner.company_name}
            </h1>
            <p className='text-muted-foreground flex items-center gap-2 text-sm'>
              <MapPin className='h-3 w-3' /> {partner.location}
            </p>
          </div>
          <div className='ml-auto'>
            <Badge variant={partner.is_active ? 'default' : 'secondary'}>
              {partner.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          {/* General Info */}
          <Card className='md:col-span-2'>
            <CardHeader>
              <CardTitle>Partner Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Phone Number
                  </p>
                  <div className='mt-1 flex items-center gap-2'>
                    <Phone className='text-primary h-4 w-4' />
                    <span>{partner.phone_number}</span>
                  </div>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Total Completed Orders
                  </p>
                  <div className='mt-1 flex items-center gap-2'>
                    <Truck className='text-primary h-4 w-4' />
                    <span>{partner.total_completed_orders}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className='text-muted-foreground mb-2 text-sm font-medium'>
                  Services
                </p>
                <div className='flex flex-wrap gap-2'>
                  {partner.services?.map((service, idx) => (
                    <Badge key={idx} variant='outline' className='capitalize'>
                      {service.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Day Stats & Payment Update */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Stats & Payment</CardTitle>
              <CardDescription>
                {current_day_stats?.date
                  ? new Date(current_day_stats.date).toDateString()
                  : 'No stats for today'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {current_day_stats ? (
                <>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Distance
                      </span>
                      <span className='font-medium'>
                        {current_day_stats.distance_km} km
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Amount
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
                        handlePaymentStatusUpdate(
                          current_day_stats.date ||
                            new Date().toISOString().split('T')[0],
                          val
                        )
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
              <div className='flex items-center justify-between'>
                <CardTitle>Daily History</CardTitle>
                <div className='w-[200px]'>
                  <Select
                    value={historyFilter}
                    onValueChange={setHistoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Filter by status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Statuses</SelectItem>
                      <SelectItem value='pending'>Pending</SelectItem>
                      <SelectItem value='paid'>Paid</SelectItem>
                      {/* <SelectItem value="failed">Failed</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Distance (km)</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory && filteredHistory.length > 0 ? (
                    filteredHistory.map((stat, idx) => (
                      <TableRow key={stat._id || idx}>
                        <TableCell>
                          {new Date(stat.date).toDateString()}
                        </TableCell>
                        <TableCell>{stat.distance_km.toFixed(2)}</TableCell>
                        <TableCell>₹{stat.amount.toFixed(2)}</TableCell>
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
