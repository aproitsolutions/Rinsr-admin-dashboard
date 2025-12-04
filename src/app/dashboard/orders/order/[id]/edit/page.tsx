'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [vendors, setVendors] = useState<
    { _id: string; company_name: string }[]
  >([]);
  const [orderImage, setOrderImage] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      pickup_date: '',
      pickup_time_slot_start: '',
      pickup_time_slot_end: '',
      address_label: '',
      address_line: '',
      heavy_items: '',
      status: '',
      vendor_status: '',
      vendor_id: ''
    }
  });

  // ✅ Fetch vendors
  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetch('/api/vendors');
        const data = await res.json();

        const raw =
          data.vendors ||
          data.data?.vendors ||
          (Array.isArray(data) ? data : []) ||
          [];

        setVendors(
          raw.map((v: any) => ({
            _id: v._id,
            company_name: v.company_name || v.companyName || 'Unnamed Vendor'
          }))
        );
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
      }
    }

    fetchVendors();
  }, []);

  // ✅ Fetch order details
  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/order/${orderId}`);
        const data = await res.json();

        if (data.success) {
          const order = data.data || data.order || {};
          const pickup_address = order.pickup_address || {};
          const pickup_time_slot = order.pickup_time_slot || {};
          const vendor_status = order.vendor_status || '';
          // ✅ Helper to convert "08:00 PM" → "20:00"
          const convertTo24Hr = (time12h: string) => {
            if (!time12h) return '';
            const [time, modifier] = time12h.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            return `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}`;
          };

          // Extract vendor_id (can be string or object)
          const vendorId =
            typeof order.vendor_id === 'string'
              ? order.vendor_id
              : typeof order.vendor_id === 'object'
                ? order.vendor_id?._id
                : typeof order.vendor === 'string'
                  ? order.vendor
                  : typeof order.vendor === 'object'
                    ? order.vendor?._id
                    : '';

          setOrderImage(order.image || null);

          form.reset({
            pickup_date: order.pickup_date
              ? order.pickup_date.split('T')[0]
              : '',
            pickup_time_slot_start: convertTo24Hr(pickup_time_slot.start),
            pickup_time_slot_end: convertTo24Hr(pickup_time_slot.end),
            address_label: pickup_address.label || 'Home',
            address_line: pickup_address.address_line || '',
            heavy_items: order.heavy_items || '',
            status: order.status || 'scheduled',
            vendor_id: vendorId || '',
            vendor_status: vendor_status || ''
          });
        } else {
          setAlertMessage('Failed to load order.');
          setAlertOpen(true);
        }
      } catch (err) {
        // console.error('Error loading order:', err);
        setAlertMessage('Error loading order.');
        setAlertOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, form]);

  // ✅ Handle Save
  async function onSubmit(values: any) {
    setSaving(true);
    try {
      const payload: any = {
        pickup_date: values.pickup_date,
        pickup_time_slot: {
          start: values.pickup_time_slot_start,
          end: values.pickup_time_slot_end
        },
        pickup_address: {
          label: values.address_label || 'Home', // ✅ new field added
          address_line: values.address_line
        },
        heavy_items: values.heavy_items,
        status: values.status
      };

      // Only include vendor_id if it's not empty
      if (
        values.vendor_id &&
        values.vendor_id !== 'none' &&
        values.vendor_id !== ''
      ) {
        payload.vendor_id = values.vendor_id;
        payload.vendorId = values.vendor_id; // Try camelCase as well
      }

      console.log(
        '📤 Updating order with payload:',
        JSON.stringify(payload, null, 2)
      );

      const res = await fetch(`/api/orders/order/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
        <p className='text-muted-foreground p-6'>Loading order...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='bg-card flex max-w-3xl flex-1 flex-col space-y-6 rounded-lg p-6 shadow'>
        <h1 className='text-foreground text-2xl font-bold'>Edit Order</h1>

        {/* ✅ Display Order Image */}
        {orderImage && (
          <div className='mb-4'>
            <p className='mb-2 text-sm font-medium'>Order Image</p>
            <div className='relative h-64 w-full max-w-md overflow-hidden rounded-md border'>
              <img
                src={
                  orderImage.startsWith('http') ? orderImage : `/${orderImage}`
                }
                alt='Order'
                className='h-full w-full object-cover'
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-4'>
            {/* Pickup Date */}
            <FormField
              control={form.control}
              name='pickup_date'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Date</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pickup Time Slot */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='pickup_time_slot_start'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type='time' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='pickup_time_slot_end'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type='time' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ✅ Address Label */}
            <FormField
              control={form.control}
              name='address_label'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Label</FormLabel>
                  <FormControl>
                    <Input placeholder='Home / Office / Other' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ Address Line */}
            <FormField
              control={form.control}
              name='address_line'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line</FormLabel>
                  <FormControl>
                    <Input placeholder='123 Main Street' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Heavy Items */}
            <FormField
              control={form.control}
              name='heavy_items'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heavy Items</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Bedsheets, Curtains' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {/* Status */}
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='scheduled'>Scheduled</SelectItem>
                        <SelectItem value='picked_up'>Picked Up</SelectItem>
                        <SelectItem value='processing'>Processing</SelectItem>
                        <SelectItem value='ready'>Ready</SelectItem>
                        <SelectItem value='out_for_delivery'>
                          Out for Delivery
                        </SelectItem>
                        <SelectItem value='delivered'>Delivered</SelectItem>
                        <SelectItem value='cancelled'>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vendor Status */}
              <FormField
                control={form.control}
                name='vendor_status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Status</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled
                        className='bg-muted w-fit cursor-not-allowed'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Vendor */}
            <FormField
              control={form.control}
              name='vendor_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === 'none' ? '' : value)
                    }
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select vendor' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>No Vendor</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor._id} value={vendor._id}>
                          {vendor.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Buttons */}
          <div className='flex gap-4 pt-6'>
            <Button type='submit' disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/orders')}
            >
              Cancel
            </Button>
          </div>
        </Form>
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
