'use client';

import PageContainer from '@/components/layout/page-container';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<{ _id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ _id: string; name: string }[]>([]);

  //   AlertDialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    plan_id: '',
    plan_name: '',
    address_line: '',
    pickup_label: '',
    pickup_start: '',
    pickup_end: '',
    pickup_date: '',
    service_id: '',
    service_name: '',
    total_weight_kg: '',
    heavy_items: '',
    payment_status: 'paid',
    status: 'scheduled'
  });

  //   Fetch plans securely via /api/plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/plans', { cache: 'no-store' });
        const data = await res.json();

        if (data.success && Array.isArray(data.plans)) {
          setPlans(data.plans);
        } else {
          console.error('Failed to load plans:', data.message);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
    }

    fetchPlans();
  }, []);

  //   Fetch services securely via /api/services
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/services', { cache: 'no-store' });
        const data = await res.json();

        if (data.success && Array.isArray(data.services)) {
          setServices(data.services);
        } else {
          console.error('Failed to load services:', data.message);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    }

    fetchServices();
  }, []);

  //   Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        pickup_time_slot: {
          start: formData.pickup_start,
          end: formData.pickup_end
        },
        pickup_address: {
          label: formData.pickup_label?.trim() || 'Home',
          address_line: formData.address_line
        },
        subscription_snapshot: {
          plan_name: formData.plan_name
        },
        plan_id: formData.plan_id,
        pickup_date: formData.pickup_date,
        service_id: {
          _id: formData.service_id,
          name: formData.service_name,
          price: 0
        },
        total_weight_kg: formData.total_weight_kg,
        heavy_items: formData.heavy_items,
        payment_status: formData.payment_status,
        status: formData.status
      };

      const response = await createOrder(payload);

      if (response.success) {
        setIsSuccess(true);
        setAlertMessage('Order created successfully!');
        setAlertOpen(true);
      } else {
        setIsSuccess(false);
        setAlertMessage(response.message || 'Failed to create order.');
        setAlertOpen(true);
      }
    } catch (error) {
      console.error('Create order error:', error);
      setIsSuccess(false);
      setAlertMessage('Something went wrong while creating the order.');
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4 p-6'>
        <h1 className='text-2xl font-bold'>Create New Order</h1>

        <form onSubmit={handleSubmit} className='max-w-3xl space-y-4'>
          {/* Plan Selection */}
          <div className='space-y-2'>
            <Label htmlFor='plan_id'>Select Plan *</Label>
            <Select
              value={formData.plan_id}
              onValueChange={(value) => {
                const selected = plans.find((p) => p._id === value);
                setFormData({
                  ...formData,
                  plan_id: value,
                  plan_name: selected?.name || ''
                });
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select a plan' />
              </SelectTrigger>
              <SelectContent>
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value='none' disabled>
                    Loading plans...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Service Selection */}
          <div className='space-y-2'>
            <Label htmlFor='service_id'>Select Service *</Label>
            <Select
              value={formData.service_id}
              onValueChange={(value) => {
                const selected = services.find((s) => s._id === value);
                setFormData({
                  ...formData,
                  service_id: value,
                  service_name: selected?.name || ''
                });
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select a service' />
              </SelectTrigger>
              <SelectContent>
                {services.length > 0 ? (
                  services.map((service) => (
                    <SelectItem key={service._id} value={service._id}>
                      {service.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value='none' disabled>
                    Loading services...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Pickup Label */}
          <div className='space-y-2'>
            <Label htmlFor='pickup_label'>Pickup Label *</Label>
            <Input
              id='pickup_label'
              value={formData.pickup_label}
              onChange={(e) =>
                setFormData({ ...formData, pickup_label: e.target.value })
              }
              required
            />
          </div>

          {/* Address */}
          <div className='space-y-2'>
            <Label htmlFor='address_line'>Address Line</Label>
            <Input
              id='address_line'
              value={formData.address_line}
              onChange={(e) =>
                setFormData({ ...formData, address_line: e.target.value })
              }
            />
          </div>

          {/* Pickup Date & Time */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor='pickup_date'>Pickup Date *</Label>
              <Input
                id='pickup_date'
                type='date'
                value={formData.pickup_date}
                onChange={(e) =>
                  setFormData({ ...formData, pickup_date: e.target.value })
                }
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='pickup_start'>Pickup Start Time *</Label>
              <Input
                id='pickup_start'
                type='time'
                value={formData.pickup_start}
                onChange={(e) =>
                  setFormData({ ...formData, pickup_start: e.target.value })
                }
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='pickup_end'>Pickup End Time *</Label>
              <Input
                id='pickup_end'
                type='time'
                value={formData.pickup_end}
                onChange={(e) =>
                  setFormData({ ...formData, pickup_end: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Weight & Heavy Items */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor='total_weight_kg'>Total Weight (kg)</Label>
              <Input
                id='total_weight_kg'
                type='number'
                value={formData.total_weight_kg}
                onChange={(e) =>
                  setFormData({ ...formData, total_weight_kg: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='heavy_items'>Heavy Items</Label>
              <Input
                id='heavy_items'
                value={formData.heavy_items}
                onChange={(e) =>
                  setFormData({ ...formData, heavy_items: e.target.value })
                }
              />
            </div>
          </div>

          {/* Status & Payment */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='w-full space-y-2'>
              <Label htmlFor='status'>Order Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='scheduled'>Scheduled</SelectItem>
                  <SelectItem value='in-progress'>In Progress</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='cancelled'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='payment_status'>Payment Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='paid'>Paid</SelectItem>
                  <SelectItem value='unpaid'>Unpaid</SelectItem>
                  <SelectItem value='refunded'>Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-4'>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create Order'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/*   ShadCN Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSuccess ? '  Order Created' : '❌ Error'}
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
