'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  User,
  Shield,
  MapPin,
  Check
} from 'lucide-react';
import { format } from 'date-fns';

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🧠 Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();

        if (data.success) {
          setUser(data.data?.user || data.data);
        } else {
          setError('Failed to load user details.');
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Error loading user details.');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center p-8'>
          <p className='text-muted-foreground'>Loading user details...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer>
        <div className='p-6'>
          <div className='bg-destructive/10 text-destructive rounded-lg p-4'>
            {error || 'User not found'}
          </div>
          <Button
            variant='outline'
            className='mt-4'
            onClick={() => router.push('/dashboard/users')}
          >
            Back to Users
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-8'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>User Details</h1>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/users')}
          >
            Back to Users
          </Button>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* 👤 User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Full Name
                  </p>
                  <p className='font-medium'>{user.name || '—'}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Login Method
                  </p>
                  <Badge variant='secondary' className='capitalize'>
                    {user.login_method || 'Unknown'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Mail className='text-muted-foreground h-4 w-4' />
                    <span className='text-sm'>{user.email || '—'}</span>
                  </div>
                  {/* {user.email_verified ? (
                    <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>Verified</Badge>
                  ) : (
                    <Badge variant='outline' className='text-muted-foreground'>Unverified</Badge>
                  )} */}
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Phone className='text-muted-foreground h-4 w-4' />
                    <span className='text-sm'>{user.phone || '—'}</span>
                  </div>
                  {user.phone_verified ? (
                    <Badge
                      variant='outline'
                      className='border-green-200 bg-green-50 text-green-700'
                    >
                      <CheckCircle2 className='mr-1 h-3 w-3' /> Verified
                    </Badge>
                  ) : (
                    <Badge variant='outline' className='text-muted-foreground'>
                      <XCircle className='mr-1 h-3 w-3' /> Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 💎 Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5' />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.subscription ? (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-muted-foreground text-sm font-medium'>
                        Plan Name
                      </p>
                      <p className='text-lg font-bold'>
                        {user.subscription.plan_id?.name || 'Unknown Plan'}
                      </p>
                    </div>
                    <Badge
                      className={
                        user.subscription.status === 'active'
                          ? 'bg-green-600'
                          : 'bg-gray-500'
                      }
                    >
                      {user.subscription.status?.toUpperCase() || 'INACTIVE'}
                    </Badge>
                  </div>

                  <Separator />

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-1'>
                      <p className='text-muted-foreground text-sm'>
                        Used Weight
                      </p>
                      <p className='text-2xl font-semibold'>
                        {user.subscription.used_weight_kg}
                        <span className='text-muted-foreground text-sm font-normal'>
                          {' '}
                          kg
                        </span>
                      </p>
                    </div>
                    <div className='space-y-1'>
                      <p className='text-muted-foreground text-sm'>
                        Used Pickups
                      </p>
                      <p className='text-2xl font-semibold'>
                        {user.subscription.used_pickups}
                      </p>
                    </div>
                  </div>

                  <div className='bg-muted/50 mt-2 flex items-center justify-between rounded-md p-3'>
                    <span className='text-sm font-medium'>Auto Renew</span>
                    <Badge
                      variant={
                        user.subscription.auto_renew ? 'default' : 'outline'
                      }
                    >
                      {user.subscription.auto_renew ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className='flex h-[180px] flex-col items-center justify-center space-y-3 text-center'>
                  <div className='bg-muted rounded-full p-3'>
                    <Shield className='text-muted-foreground h-6 w-6' />
                  </div>
                  <div className='space-y-1'>
                    <p className='font-medium'>No Active Subscription</p>
                    <p className='text-muted-foreground text-sm'>
                      This user has not subscribed to any plan.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 📍 Addresses Details */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='h-5 w-5' />
              Saved Addresses
            </CardTitle>
            <CardDescription>
              List of delivery addresses saved by the user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.addresses && user.addresses.length > 0 ? (
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {user.addresses.map((addr: any, idx: number) => (
                  <div
                    key={idx}
                    className='bg-muted/30 relative rounded-lg border p-4'
                  >
                    {addr.is_default && (
                      <Badge
                        variant='secondary'
                        className='bg-primary/10 text-primary absolute top-2 right-2'
                      >
                        Default
                      </Badge>
                    )}
                    <div className='mb-2 flex items-center gap-2'>
                      <Badge variant='outline' className='capitalize'>
                        {addr.label || 'Home'}
                      </Badge>
                    </div>
                    <p className='text-sm leading-relaxed'>
                      {addr.address_line}
                    </p>
                    {addr.coordinates && (
                      <p className='text-muted-foreground mt-2 font-mono text-xs'>
                        {addr.coordinates}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex h-[120px] flex-col items-center justify-center space-y-3 text-center'>
                <div className='bg-muted rounded-full p-3'>
                  <MapPin className='text-muted-foreground h-5 w-5' />
                </div>
                <p className='text-muted-foreground text-sm'>
                  No saved addresses found.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 📦 Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              History of orders placed by this user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.orders && user.orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Created At</TableHead>
                    {/* Add more columns if order object has more data in this view */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.orders.map((order: any) => (
                    <TableRow key={order._id}>
                      <TableCell className='font-mono text-sm'>
                        {order._id}
                      </TableCell>

                      {order.status == 'service_completed' ? (
                        <TableCell>
                          <Badge variant='default'>{order.status}</Badge>
                        </TableCell>
                      ) : (
                        <TableCell>
                          <Badge variant='outline'>{order.status}</Badge>
                        </TableCell>
                      )}
                      {order.payment_status == 'paid' ? (
                        <TableCell>
                          <Badge variant='default'>Paid</Badge>
                        </TableCell>
                      ) : (
                        <TableCell>
                          <Badge variant='destructive'>
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        {order.createdAt
                          ? format(new Date(order.createdAt), 'PPpp')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className='text-muted-foreground py-8 text-center text-sm'>
                No orders found for this user.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
