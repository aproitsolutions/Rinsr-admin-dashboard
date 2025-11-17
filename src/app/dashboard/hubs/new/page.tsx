'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover';

import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from '@/components/ui/command';

import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

interface VendorOption {
  _id: string;
  company_name: string;
}

interface HubFormData {
  name: string;
  location: string;
  location_coordinates?: string;
  primary_contact: string;
  secondary_contact?: string;
}

export default function CreateHubPage() {
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<HubFormData>({
    defaultValues: {
      name: '',
      location: '',
      location_coordinates: '',
      primary_contact: '',
      secondary_contact: ''
    }
  });

  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    success: boolean;
  }>({ open: false, title: '', message: '', success: false });

  // Fetch vendors for multi-select
  useEffect(() => {
    async function fetchVendors() {
      setLoadingVendors(true);
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
      } finally {
        setLoadingVendors(false);
      }
    }

    fetchVendors();
  }, []);

  const onSubmit = async (data: HubFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        vendor_ids: selectedVendorIds
      };

      console.log('FINAL PAYLOAD:', payload);

      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result.success) {
        setDialog({
          open: true,
          title: '✅ Hub Created',
          message: 'The hub has been created successfully.',
          success: true
        });

        reset();
        setSelectedVendorIds([]);

        setTimeout(() => router.push('/dashboard/hubs'), 1200);
      } else {
        setDialog({
          open: true,
          title: '❌ Error',
          message: result.message || 'Failed to create hub.',
          success: false
        });
      }
    } catch (err) {
      setDialog({
        open: true,
        title: '⚠️ Error',
        message: 'Something went wrong while creating the hub.',
        success: false
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVendor = (vendorId: string) => {
    setSelectedVendorIds((current) =>
      current.includes(vendorId)
        ? current.filter((id) => id !== vendorId)
        : [...current, vendorId]
    );
  };

  return (
    <PageContainer>
      <AlertDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog({ ...dialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setDialog({ ...dialog, open: false })}
              className={dialog.success ? 'bg-green-600' : 'bg-red-600'}
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className='bg-card flex max-w-3xl flex-1 flex-col space-y-6 rounded-lg p-6 shadow'>
        <h1 className='text-foreground text-2xl font-bold'>Create Hub</h1>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Hub Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Name</Label>
                <Input
                  id='name'
                  {...register('name', { required: true })}
                  placeholder='eg. Central Hub'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='location'>Location</Label>
                <Input
                  id='location'
                  {...register('location', { required: true })}
                  placeholder='City, Area'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='coords'>Location Coordinates</Label>
                <Input
                  id='coords'
                  {...register('location_coordinates')}
                  placeholder='10.1234, 76.5678'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='primary_contact'>Primary Contact</Label>
                <Input
                  id='primary_contact'
                  {...register('primary_contact', { required: true })}
                  placeholder='+911234567890'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='secondary_contact'>Secondary Contact</Label>
                <Input
                  id='secondary_contact'
                  {...register('secondary_contact')}
                  placeholder='+911234567891'
                />
              </div>

              <div className='space-y-2'>
                <Label>Vendors</Label>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-between'
                    >
                      {selectedVendorIds.length > 0
                        ? `${selectedVendorIds.length} vendor(s) selected`
                        : 'Select vendors'}
                      <Icons.cheverondown className='h-4 w-4 opacity-50' />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className='w-full p-0'>
                    <Command>
                      <CommandInput placeholder='Search vendors...' />
                      <CommandEmpty>No vendors found.</CommandEmpty>

                      <CommandGroup>
                        {vendors.map((vendor) => {
                          const isSelected = selectedVendorIds.includes(
                            vendor._id
                          );

                          return (
                            <CommandItem
                              key={vendor._id}
                              value={vendor.company_name}
                              onSelect={() => toggleVendor(vendor._id)}
                            >
                              <Checkbox checked={isSelected} className='mr-2' />
                              {vendor.company_name}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected badges */}
                <div className='mt-2 flex flex-wrap gap-2'>
                  {selectedVendorIds.map((id) => {
                    const vendor = vendors.find((v) => v._id === id);
                    return (
                      <Badge key={id} variant='secondary' className='px-2 py-1'>
                        {vendor?.company_name || 'Vendor'}
                        <span
                          className='ml-1 cursor-pointer text-red-500'
                          onClick={() => toggleVendor(id)}
                        >
                          ×
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <Button type='submit' className='w-32' disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Hub'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
