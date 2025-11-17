'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription
} from '@/components/ui/alert-dialog';

export default function EditVendorPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [alert, setAlert] = useState<null | {
    success: boolean;
    message: string;
  }>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    location: '',
    phone_number: '',
    services: [''],
    location_coordinates: ''
  });

  // Fetch vendor details
  useEffect(() => {
    async function fetchVendor() {
      setLoading(true);
      try {
        const res = await fetch(`/api/vendors/${id}`);
        const data = await res.json();

        if (data?.vendor) {
          setFormData({
            company_name: data.vendor.company_name || '',
            location: data.vendor.location || '',
            phone_number: data.vendor.phone_number || '',
            services: data.vendor.services?.length
              ? data.vendor.services
              : [''],
            location_coordinates: data.vendor.location_coordinates || ''
          });
        } else {
          setAlert({ success: false, message: 'Vendor not found' });
        }
      } catch {
        setAlert({ success: false, message: 'Failed to load vendor data' });
      } finally {
        setLoading(false);
      }
    }

    fetchVendor();
  }, [id]);

  // Submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setAlert({ success: true, message: 'Vendor updated successfully!' });

        setTimeout(() => {
          router.push('/dashboard/vendors');
        }, 1200);
      } else {
        setAlert({
          success: false,
          message: data.message || 'Update failed'
        });
      }
    } catch {
      setAlert({
        success: false,
        message: 'Something went wrong while updating vendor'
      });
    } finally {
      setSaving(false);
    }
  }

  const handleServiceChange = (index: number, value: string) => {
    const newServices = [...formData.services];
    newServices[index] = value;
    setFormData({ ...formData, services: newServices });
  };

  const addServiceField = () =>
    setFormData({ ...formData, services: [...formData.services, ''] });

  // --- UI ---
  if (loading) {
    return (
      <div className='mx-auto max-w-2xl space-y-6 p-6'>
        <Skeleton className='h-8 w-40' />
        <Card>
          <CardContent className='space-y-4 p-6'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-1/2' />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Alert Dialog */}
      <AlertDialog open={!!alert} onOpenChange={() => setAlert(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {alert?.success ? '✅ Success' : '❌ Error'}
          </AlertDialogTitle>
          <AlertDialogDescription className='pb-4'>
            {alert?.message}
          </AlertDialogDescription>
          <div className='flex justify-end'>
            <Button variant='outline' onClick={() => setAlert(null)}>
              Close
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Page */}
      <div className='bg-card flex max-w-3xl flex-1 flex-col space-y-6 rounded-lg p-6 shadow'>
        <h1 className='text-foreground text-2xl font-bold'>Edit Vendor</h1>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>
              Vendor Details
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-5'>
              {/* Company Name */}
              <div className='space-y-2'>
                <Label htmlFor='company_name'>Company Name</Label>
                <Input
                  id='company_name'
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Location */}
              <div className='space-y-2'>
                <Label htmlFor='location'>Location</Label>
                <Input
                  id='location'
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>

              {/* Coordinates */}
              <div className='space-y-2'>
                <Label htmlFor='coords'>Coordinates (lat, lng)</Label>
                <Input
                  id='coords'
                  value={formData.location_coordinates}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location_coordinates: e.target.value
                    })
                  }
                  placeholder='10.1234, 76.5678'
                />
              </div>

              {/* Phone Number */}
              <div className='space-y-2'>
                <Label htmlFor='phone_number'>Phone Number</Label>
                <Input
                  id='phone_number'
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  required
                />
              </div>

              {/* Services */}
              <div className='space-y-2'>
                <Label>Services</Label>
                {formData.services.map((service, i) => (
                  <Input
                    key={i}
                    value={service}
                    onChange={(e) => handleServiceChange(i, e.target.value)}
                    placeholder='e.g. Laundry, Ironing'
                    className='mb-2'
                  />
                ))}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addServiceField}
                >
                  + Add another service
                </Button>
              </div>

              {/* Submit Button */}
              <Button type='submit' disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
