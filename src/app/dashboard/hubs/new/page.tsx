'use client';

import { useEffect, useState, useRef } from 'react';
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
import Script from 'next/script';
import GoogleMapPicker from '@/components/maps/GoogleMapPicker';

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

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function CreateHubPage() {
  const router = useRouter();
  const { register, handleSubmit, reset, setValue } = useForm<HubFormData>({
    defaultValues: {
      name: '',
      location: '',
      location_coordinates: '',
      primary_contact: '',
      secondary_contact: ''
    }
  });

  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<VendorOption[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    success: boolean;
  }>({ open: false, title: '', message: '', success: false });

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

  // Fetch vendors and delivery partners
  useEffect(() => {
    async function fetchData() {
      setLoadingVendors(true);
      try {
        const [vendorsRes, partnersRes] = await Promise.all([
          fetch('/api/vendors'),
          fetch('/api/delivery-partners')
        ]);

        const vendorsData = await vendorsRes.json();
        const partnersData = await partnersRes.json();

        // Process Vendors
        const rawVendors =
          vendorsData.vendors ||
          vendorsData.data?.vendors ||
          (Array.isArray(vendorsData) ? vendorsData : []) ||
          [];

        setVendors(
          rawVendors.map((v: any) => ({
            _id: v._id,
            company_name: v.company_name || v.companyName || 'Unnamed Vendor'
          }))
        );

        // Process Delivery Partners
        const rawPartners =
          partnersData.data ||
          partnersData.deliveryPartners ||
          (Array.isArray(partnersData) ? partnersData : []) ||
          [];

        setDeliveryPartners(
          rawPartners.map((p: any) => ({
            _id: p._id,
            company_name: p.company_name || 'Unnamed Partner'
          }))
        );
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingVendors(false);
      }
    }

    fetchData();
  }, []);

  const onSubmit = async (data: HubFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        vendor_ids: selectedVendorIds,
        delivery_partner_ids: selectedPartnerIds
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
          title: '  Hub Created',
          message: 'The hub has been created successfully.',
          success: true
        });

        reset();
        setSelectedVendorIds([]);
        setSelectedPartnerIds([]);
        setMapLocation(undefined);
        if (autocompleteInputRef.current) {
          autocompleteInputRef.current.value = '';
        }

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

  const togglePartner = (partnerId: string) => {
    setSelectedPartnerIds((current) =>
      current.includes(partnerId)
        ? current.filter((id) => id !== partnerId)
        : [...current, partnerId]
    );
  };

  return (
    <PageContainer>
      <Script
        src={googleMapsScriptSrc}
        onLoad={() => setScriptLoaded(true)}
        strategy='lazyOnload'
      />
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
                  ref={(e) => {
                    register('location').ref(e);
                    // @ts-ignore
                    autocompleteInputRef.current = e;
                  }}
                  placeholder='Search location...'
                />
                <input type='hidden' {...register('location_coordinates')} />

                <div className='mt-2'>
                  <Label>Select on Map</Label>
                  <GoogleMapPicker
                    initialLocation={mapLocation}
                    onLocationSelect={handleMapLocationSelect}
                  />
                </div>
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

              {/* Vendors Selection */}
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

              {/* Delivery Partners Selection */}
              <div className='space-y-2'>
                <Label>Delivery Partners</Label>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-between'
                    >
                      {selectedPartnerIds.length > 0
                        ? `${selectedPartnerIds.length} partner(s) selected`
                        : 'Select delivery partners'}
                      <Icons.cheverondown className='h-4 w-4 opacity-50' />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className='w-full p-0'>
                    <Command>
                      <CommandInput placeholder='Search partners...' />
                      <CommandEmpty>No partners found.</CommandEmpty>

                      <CommandGroup>
                        {deliveryPartners.map((partner) => {
                          const isSelected = selectedPartnerIds.includes(
                            partner._id
                          );

                          return (
                            <CommandItem
                              key={partner._id}
                              value={partner.company_name}
                              onSelect={() => togglePartner(partner._id)}
                            >
                              <Checkbox checked={isSelected} className='mr-2' />
                              {partner.company_name}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected badges */}
                <div className='mt-2 flex flex-wrap gap-2'>
                  {selectedPartnerIds.map((id) => {
                    const partner = deliveryPartners.find((p) => p._id === id);
                    return (
                      <Badge key={id} variant='secondary' className='px-2 py-1'>
                        {partner?.company_name || 'Partner'}
                        <span
                          className='ml-1 cursor-pointer text-red-500'
                          onClick={() => togglePartner(id)}
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
