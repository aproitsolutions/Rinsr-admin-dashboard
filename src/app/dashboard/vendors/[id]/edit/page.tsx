'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Script from 'next/script';
import GoogleMapPicker from '@/components/maps/GoogleMapPicker';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription
} from '@/components/ui/alert-dialog';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

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

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleMapsScriptSrc = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (scriptLoaded && autocompleteInputRef.current && window.google) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        { types: ['geocode', 'establishment'] }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }
  }, [scriptLoaded, loading]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const coords = `${lat}, ${lng}`;

      console.log('📍 Selected Place:', place.formatted_address);
      console.log('📍 Coordinates:', coords);

      setFormData((prev) => ({
        ...prev,
        location: place.formatted_address || place.name,
        location_coordinates: coords
      }));
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
      setFormData((prev) => ({
        ...prev,
        location: location.address,
        location_coordinates: coords
      }));
      // Update autocomplete input value manually
      if (autocompleteInputRef.current) {
        autocompleteInputRef.current.value = location.address;
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        location_coordinates: coords
      }));
    }
    setMapLocation({ lat: location.lat, lng: location.lng });
  };

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

          // Set initial map location if coordinates exist
          if (data.vendor.location_coordinates) {
            const [lat, lng] = data.vendor.location_coordinates
              .split(',')
              .map((c: string) => parseFloat(c.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
              setMapLocation({ lat, lng });
            }
          }
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
      <Script
        src={googleMapsScriptSrc}
        onLoad={() => setScriptLoaded(true)}
        strategy='lazyOnload'
      />
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
                  ref={autocompleteInputRef}
                  placeholder='Search location...'
                  required
                />
                <input
                  type='hidden'
                  value={formData.location_coordinates}
                  name='location_coordinates'
                />

                <div className='mt-2'>
                  <Label>Select on Map</Label>
                  <GoogleMapPicker
                    initialLocation={mapLocation}
                    onLocationSelect={handleMapLocationSelect}
                  />
                </div>
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
