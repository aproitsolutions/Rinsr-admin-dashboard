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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import GoogleMapPicker from '@/components/maps/GoogleMapPicker';

interface ServiceItem {
  service_id: string;
  name: string;
  price: number;
}

interface VendorFormData {
  company_name: string;
  location: string;
  phone_number: string;
  services: ServiceItem[];
  location_coordinates: string;
}

interface ApiService {
  _id: string;
  name: string;
  image?: string;
  is_active?: boolean;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function VendorForm() {
  const { register, handleSubmit, setValue, reset } = useForm<VendorFormData>();

  const [availableServices, setAvailableServices] = useState<ApiService[]>([]);
  // Use state for the dynamic services list
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([
    { service_id: '', name: '', price: 0 }
  ]);

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

  // Fetch Services
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success && Array.isArray(data.services)) {
          setAvailableServices(data.services);
        }
      } catch (error) {
        console.error('Failed to fetch services', error);
      }
    }
    fetchServices();
  }, []);

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
  const addServiceRow = () => {
    setSelectedServices([
      ...selectedServices,
      { service_id: '', name: '', price: 0 }
    ]);
  };

  const removeServiceRow = (index: number) => {
    const updated = selectedServices.filter((_, i) => i !== index);
    setSelectedServices(updated);
  };

  const updateServiceRow = (
    index: number,
    field: keyof ServiceItem,
    value: any
  ) => {
    const updated = [...selectedServices];
    if (field === 'service_id') {
      // When service_id changes, also find and update the name
      const serviceObj = availableServices.find((s) => s._id === value);
      updated[index] = {
        ...updated[index],
        service_id: value,
        name: serviceObj ? serviceObj.name : ''
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSelectedServices(updated);
  };

  // Submit
  const onSubmit = async (data: VendorFormData) => {
    // Filter out incomplete service entries
    const validServices = selectedServices.filter(
      (s) => s.service_id && s.price > 0
    );

    if (validServices.length === 0) {
      setDialog({
        open: true,
        title: '⚠️ Validation Error',
        message: 'Please select at least one service with a price.',
        success: false
      });
      return;
    }

    const payload = {
      ...data,
      services: validServices
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
        setSelectedServices([{ service_id: '', name: '', price: 0 }]);
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
        <h1 className='text-2xl font-bold'>Create Vendor</h1>

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
            <Label className='mb-2 block'>Services</Label>
            <div className='space-y-3'>
              {selectedServices.map((serviceItem, index) => (
                <div
                  key={index}
                  className='bg-muted/20 flex items-end gap-3 rounded-md border p-3'
                >
                  <div className='flex-1 space-y-1'>
                    <Label className='text-muted-foreground text-xs'>
                      Service Type
                    </Label>
                    <Select
                      value={serviceItem.service_id}
                      onValueChange={(val) =>
                        updateServiceRow(index, 'service_id', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select Service' />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map((s) => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='w-32 space-y-1'>
                    <Label className='text-muted-foreground text-xs'>
                      Price (₹)
                    </Label>
                    <Input
                      type='number'
                      min='0'
                      placeholder='Price'
                      value={serviceItem.price || ''}
                      onChange={(e) =>
                        updateServiceRow(
                          index,
                          'price',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  {selectedServices.length > 1 && (
                    <Button
                      type='button'
                      variant='destructive'
                      size='icon'
                      className='mb-0.5'
                      onClick={() => removeServiceRow(index)}
                    >
                      <span className='sr-only'>Remove</span>
                      <svg
                        width='15'
                        height='15'
                        viewBox='0 0 15 15'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-4 w-4'
                      >
                        <path
                          d='M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11.059L10.516 12.6917C10.4357 13.9765 9.36622 14.9622 8.07855 14.9622H6.92145C5.63378 14.9622 4.56425 13.9765 4.48398 12.6917L3.94098 4H3.5C3.22386 4 3 3.77614 3 3.5ZM5.43845 12.632C5.4652 13.0602 5.82172 13.3887 6.25055 13.3887H8.74945C9.17828 13.3887 9.5348 13.0602 9.56155 12.632L10.0988 4H4.90117L5.43845 12.632Z'
                          fill='currentColor'
                          fillRule='evenodd'
                          clipRule='evenodd'
                        ></path>
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type='button'
              onClick={addServiceRow}
              variant='outline'
              className='mt-3 w-full border-dashed'
            >
              + Add Another Service
            </Button>
          </div>

          <Button type='submit' className='w-full md:w-auto'>
            Create Vendor
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
