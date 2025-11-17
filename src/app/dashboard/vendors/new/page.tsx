'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PageContainer from '@/components/layout/page-container';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface VendorFormData {
  company_name: string;
  location: string;
  phone_number: string;
  services: string[];
  location_coordinates: string; // UPDATED
}

export default function VendorForm() {
  const { register, handleSubmit, reset } = useForm<VendorFormData>({
    defaultValues: { services: [''] }
  });

  const [services, setServices] = useState(['']);

  // NEW — manual coordinates string
  const [coordsString, setCoordsString] = useState('');

  // LocationIQ autocomplete states
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dialog state
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    success: boolean;
  }>({ open: false, title: '', message: '', success: false });

  const LOCATIONIQ_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;

  // Fetch autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!locationQuery || locationQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(
            locationQuery
          )}&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
      }
    };

    const delay = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(delay);
  }, [locationQuery]);

  const handleSelectSuggestion = (item: any) => {
    setLocationQuery(item.display_name);
    setShowSuggestions(false);

    // ❌ DO NOT auto-fill coordinates
    // ✔ User will enter manually
  };

  // Services Management
  const addService = () => setServices([...services, '']);
  const removeService = (i: number) =>
    setServices(services.filter((_, idx) => idx !== i));
  const updateService = (i: number, value: string) => {
    const updated = [...services];
    updated[i] = value;
    setServices(updated);
  };

  // Submit
  const onSubmit = async (data: VendorFormData) => {
    const payload = {
      ...data,
      location: locationQuery,
      services,
      location_coordinates: coordsString // ✔ saved as a string
    };

    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result.success) {
        setDialog({
          open: true,
          title: '✅ Success',
          message: 'Vendor created successfully!',
          success: true
        });

        reset();
        setServices(['']);
        setCoordsString('');
        setLocationQuery('');
      } else {
        setDialog({
          open: true,
          title: '❌ Error',
          message: result.message || 'Failed to create vendor.',
          success: false
        });
      }
    } catch (err) {
      setDialog({
        open: true,
        title: '⚠️ Error',
        message: 'Something went wrong!',
        success: false
      });
    }
  };

  return (
    <PageContainer scrollable>
      <div className='bg-card flex max-w-3xl flex-1 flex-col space-y-6 rounded-lg p-6 shadow'>
        <h1 className='text-2xl font-bold'>Create Admin</h1>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
          <div>
            <Label>Company Name</Label>
            <Input
              {...register('company_name', { required: true })}
              placeholder='e.g. CleanCo Laundry'
              className='mt-1'
            />
          </div>

          {/* LocationIQ Autocomplete */}
          <div className='relative'>
            <Label>Location</Label>
            <Input
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder='Search location...'
              autoComplete='off'
              className='mt-1'
            />

            {showSuggestions && suggestions.length > 0 && (
              <ul className='absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-md'>
                {suggestions.map((item) => (
                  <li
                    key={item.place_id}
                    onClick={() => handleSelectSuggestion(item)}
                    className='cursor-pointer p-2 text-sm hover:bg-gray-100'
                  >
                    {item.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Manual Coordinates Input */}
          <div>
            <Label>Coordinates (lat, lng)</Label>
            <Input
              value={coordsString}
              onChange={(e) => setCoordsString(e.target.value)}
              placeholder='10.1234, 76.5678'
              className='mt-1'
            />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input
              {...register('phone_number', { required: true })}
              placeholder='+91XXXXXXXXXX'
              className='mt-1'
            />
          </div>

          {/* Services */}
          <div>
            <Label>Services</Label>
            {services.map((service, index) => (
              <div key={index} className='mt-1 flex gap-2'>
                <Input
                  value={service}
                  onChange={(e) => updateService(index, e.target.value)}
                  placeholder={`Service ${index + 1}`}
                />
                {index > 0 && (
                  <Button
                    type='button'
                    variant='destructive'
                    onClick={() => removeService(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type='button'
              onClick={addService}
              variant='secondary'
              className='mt-2'
            >
              + Add Service
            </Button>
          </div>

          <Button type='submit' className='w-40'>
            Submit
          </Button>
        </form>
      </div>

      {/* Dialog */}
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
    </PageContainer>
  );
}
