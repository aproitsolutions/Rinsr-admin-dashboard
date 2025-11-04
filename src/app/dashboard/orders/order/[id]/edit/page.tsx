'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [order, setOrder] = useState<any>(null);

  // Fetch order details
  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/order/${orderId}`);
        const data = await res.json();
        console.log('➡️ Order data:', JSON.stringify(data, null, 2));
        if (data.success) {
          setOrder(data.data || data.order);
        } else {
          setAlertMessage('Failed to load order.');
          setAlertOpen(true);
        }
      } catch (err) {
        console.error('Error loading order:', err);
        setAlertMessage('Error loading order.');
        setAlertOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  async function handleSave() {
    if (!order) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/orders/order/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setAlertMessage('Order updated successfully!');
      } else {
        setIsSuccess(false);
        setAlertMessage(data.message || 'Failed to update order.');
      }
    } catch (err) {
      console.error('Update error:', err);
      setIsSuccess(false);
      setAlertMessage('Something went wrong while updating.');
    } finally {
      setSaving(false);
      setAlertOpen(true);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <p className='p-6 text-gray-500'>Loading order...</p>
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer>
        <p className='p-6 text-red-500'>Order not found.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={false}>
      <div className='flex max-w-3xl flex-1 flex-col space-y-4 p-6'>
        <h1 className='text-2xl font-bold'>Edit Order</h1>

        {/* Pickup Date */}
        <div className='space-y-2'>
          <Label htmlFor='pickup_date'>Pickup Date</Label>
          <Input
            id='pickup_date'
            type='date'
            value={order.pickup_date?.split('T')[0] || ''}
            onChange={(e) =>
              setOrder({ ...order, pickup_date: e.target.value })
            }
          />
        </div>

        {/* Pickup Time Slot */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Start Time</Label>
            <Input
              type='time'
              value={order.pickup_time_slot?.start || ''}
              onChange={(e) =>
                setOrder({
                  ...order,
                  pickup_time_slot: {
                    ...order.pickup_time_slot,
                    start: e.target.value
                  }
                })
              }
            />
          </div>

          <div className='space-y-2'>
            <Label>End Time</Label>
            <Input
              type='time'
              value={order.pickup_time_slot?.end || ''}
              onChange={(e) =>
                setOrder({
                  ...order,
                  pickup_time_slot: {
                    ...order.pickup_time_slot,
                    end: e.target.value
                  }
                })
              }
            />
          </div>
        </div>

        {/* Address */}
        <div className='space-y-2'>
          <Label htmlFor='address_line'>Address Line</Label>
          <Input
            id='address_line'
            value={order.pickup_address?.address_line || ''}
            onChange={(e) =>
              setOrder({
                ...order,
                pickup_address: {
                  ...order.pickup_address,
                  address_line: e.target.value
                }
              })
            }
          />
        </div>

        {/* Heavy Items */}
        <div className='space-y-2'>
          <Label htmlFor='heavy_items'>Heavy Items</Label>
          <Input
            id='heavy_items'
            value={order.heavy_items || ''}
            onChange={(e) =>
              setOrder({ ...order, heavy_items: e.target.value })
            }
          />
        </div>

        {/* Status */}
        <div className='space-y-2'>
          <Label htmlFor='status'>Order Status</Label>
          <Select
            value={order.status}
            onValueChange={(value) => setOrder({ ...order, status: value })}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='scheduled'>Scheduled</SelectItem>
              <SelectItem value='in-progress'>In Progress</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <div className='flex gap-4 pt-4'>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/orders')}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* ✅ Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSuccess ? '✅ Success' : '❌ Error'}
            </AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setAlertOpen(false);
                if (isSuccess) router.push('/dashboard/orders');
              }}
            >
              {isSuccess ? 'Go to Orders' : 'Close'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
