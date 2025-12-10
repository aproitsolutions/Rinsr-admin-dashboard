'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Script from 'next/script';
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

import GoogleMapPicker from '@/components/maps/GoogleMapPicker';

interface VendorFormData {
  company_name: string;
  location: string;
  phone_number: string;
  services: string[];
  location_coordinates: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function VendorForm() {
  const { register, handleSubmit, setValue, reset } = useForm<VendorFormData>({
    defaultValues: { services: [''] }
  });

  const [services, setServices] = useState(['']);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [mapLocation, setMapLocation] = useState<
    | {
        lat: number;
        lng: number;
      }
    | undefined
  >(undefined);

  // Dialog state
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    success: boolean;
  }>({ open: false, title: '', message: '', success: false });

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (scriptLoaded && autocompleteInputRef.current && window.google) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        { types: ['geocode', 'establishment'] }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }
  }, [scriptLoaded]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const coords = `${lat}, ${lng}`;

      console.log('📍 Selected Place:', place.formatted_address);
      console.log('📍 Coordinates:', coords);

      setValue('location', place.formatted_address || place.name);
      setValue('location_coordinates', coords);
      setMapLocation({ lat, lng });
    } else {
      console.warn('Place details not found for input: ', place.name);
    }
  };

  const handleMapLocationSelect = (location: {
    lat: number;
    lng: number;
    address: string;
  }) => {
    const coords = `${location.lat}, ${location.lng}`;
    if (location.address) {
      setValue('location', location.address);
      // Update autocomplete input value manually
      if (autocompleteInputRef.current) {
        autocompleteInputRef.current.value = location.address;
      }
    }
    setValue('location_coordinates', coords);
    setMapLocation({ lat: location.lat, lng: location.lng });
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
      services
    };

    console.log('📤 Submitting Vendor:', payload);

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
        setMapLocation(undefined);
        if (autocompleteInputRef.current) {
          autocompleteInputRef.current.value = '';
        }
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

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleMapsScriptSrc = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;

  useEffect(() => {
    // console.log('🗺️ Google Maps API Key:', googleMapsApiKey ? 'Loaded' : 'Missing');
    // console.log('🔗 Script Source:', googleMapsScriptSrc);
  }, [googleMapsApiKey, googleMapsScriptSrc]);

  return (
    <PageContainer scrollable>
      <Script
        src={googleMapsScriptSrc}
        onLoad={() => setScriptLoaded(true)}
        strategy='lazyOnload'
      />

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

          {/* Google Maps Autocomplete */}
          <div>
            <Label>Location</Label>
            <Input
              {...register('location', { required: true })}
              ref={(e) => {
                register('location').ref(e);
                // @ts-ignore
                autocompleteInputRef.current = e;
              }}
              placeholder='Search location...'
              className='mt-1'
            />
            {/* Hidden input for coordinates to ensure it's registered */}
            <input type='hidden' {...register('location_coordinates')} />

            <div className='mt-2'>
              <Label>Select on Map</Label>
              <GoogleMapPicker
                initialLocation={mapLocation}
                onLocationSelect={handleMapLocationSelect}
              />
            </div>
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input
              {...register('phone_number', { required: true })}
              placeholder='+91'
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
