'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import PageContainer from '@/components/layout/page-container';
import { Checkbox } from '@/components/ui/checkbox';
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
  vendor_ids: string[];
  delivery_partner_ids: string[];
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function EditHubPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<VendorOption[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');

  const filteredVendors = vendors.filter((v) =>
    v.company_name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const filteredPartners = deliveryPartners.filter((p) =>
    p.company_name.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  const [alert, setAlert] = useState<null | {
    success: boolean;
    message: string;
  }>(null);

  const [formData, setFormData] = useState<HubFormData>({
    name: '',
    location: '',
    location_coordinates: '',
    primary_contact: '',
    secondary_contact: '',
    vendor_ids: [],
    delivery_partner_ids: []
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
  }, [scriptLoaded, loading]); // Re-run when loading finishes and input is available

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const coords = `${lat}, ${lng}`;

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

  // Fetch vendors and delivery partners
  useEffect(() => {
    async function fetchData() {
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
      }
    }

    fetchData();
  }, []);

  // Fetch hub details
  useEffect(() => {
    async function fetchHub() {
      setLoading(true);
      try {
        const res = await fetch(`/api/hubs/${id}`);
        const data = await res.json();

        if (data?.hub) {
          const hub = data.hub;
          setFormData({
            name: hub.name || '',
            location: hub.location || '',
            location_coordinates: hub.location_coordinates || '',
            primary_contact: hub.primary_contact || '',
            secondary_contact: hub.secondary_contact || '',
            // Normalize vendor_ids to string ids
            vendor_ids: Array.isArray(hub.vendor_ids)
              ? hub.vendor_ids.map((v: any) =>
                  typeof v === 'string' ? v : v?._id
                )
              : [],
            // Normalize delivery_partner_ids
            delivery_partner_ids: Array.isArray(hub.delivery_partner_ids)
              ? hub.delivery_partner_ids.map((p: any) =>
                  typeof p === 'string' ? p : p?._id
                )
              : []
          });

          // Set initial map location if coordinates exist
          if (hub.location_coordinates) {
            const [lat, lng] = hub.location_coordinates
              .split(',')
              .map((c: string) => parseFloat(c.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
              setMapLocation({ lat, lng });
            }
          }
        } else {
          setAlert({ success: false, message: 'Hub not found' });
        }
      } catch {
        setAlert({ success: false, message: 'Failed to load hub data' });
      } finally {
        setLoading(false);
      }
    }

    fetchHub();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/hubs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setAlert({ success: true, message: 'Hub updated successfully!' });
        setTimeout(() => {
          router.push('/dashboard/hubs');
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
        message: 'Something went wrong while updating hub'
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
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
      </PageContainer>
    );
  }

  return (
    <PageContainer>
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

      <div className='bg-card flex max-w-3xl flex-1 flex-col space-y-6 p-6'>
        <h1 className='text-foreground text-2xl font-bold'>Edit Hub</h1>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Hub Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-5'>
              {/* Name */}
              <div className='space-y-2'>
                <Label htmlFor='name'>Name</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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

              {/* Primary Contact */}
              <div className='space-y-2'>
                <Label htmlFor='primary_contact'>Primary Contact</Label>
                <Input
                  id='primary_contact'
                  value={formData.primary_contact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primary_contact: e.target.value
                    })
                  }
                  required
                />
              </div>

              {/* Secondary Contact */}
              <div className='space-y-2'>
                <Label htmlFor='secondary_contact'>Secondary Contact</Label>
                <Input
                  id='secondary_contact'
                  value={formData.secondary_contact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      secondary_contact: e.target.value
                    })
                  }
                />
              </div>

              {/* Vendors multi-select */}
              <div className='space-y-2'>
                <Label>Vendors (select one or more)</Label>

                {/* Search Input */}
                <Input
                  type='text'
                  placeholder='Search vendors...'
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className='mb-2'
                />

                <div className='grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2'>
                  {filteredVendors.length > 0 ? (
                    filteredVendors.map((vendor) => {
                      const isChecked = formData.vendor_ids.includes(
                        vendor._id
                      );

                      return (
                        <label
                          key={vendor._id}
                          className='flex cursor-pointer items-center space-x-2 rounded-md border p-2 text-sm'
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => {
                              setFormData((prev) => {
                                const current = prev.vendor_ids;

                                if (isChecked) {
                                  return {
                                    ...prev,
                                    vendor_ids: current.filter(
                                      (v) => v !== vendor._id
                                    )
                                  };
                                } else {
                                  return {
                                    ...prev,
                                    vendor_ids: [...current, vendor._id]
                                  };
                                }
                              });
                            }}
                          />
                          <span>{vendor.company_name}</span>
                        </label>
                      );
                    })
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      No vendors found.
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Partners multi-select */}
              <div className='space-y-2'>
                <Label>Delivery Partners (select one or more)</Label>

                {/* Search Input */}
                <Input
                  type='text'
                  placeholder='Search partners...'
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className='mb-2'
                />

                <div className='grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2'>
                  {filteredPartners.length > 0 ? (
                    filteredPartners.map((partner) => {
                      const isChecked = formData.delivery_partner_ids.includes(
                        partner._id
                      );

                      return (
                        <label
                          key={partner._id}
                          className='flex cursor-pointer items-center space-x-2 rounded-md border p-2 text-sm'
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => {
                              setFormData((prev) => {
                                const current = prev.delivery_partner_ids;

                                if (isChecked) {
                                  return {
                                    ...prev,
                                    delivery_partner_ids: current.filter(
                                      (id) => id !== partner._id
                                    )
                                  };
                                } else {
                                  return {
                                    ...prev,
                                    delivery_partner_ids: [
                                      ...current,
                                      partner._id
                                    ]
                                  };
                                }
                              });
                            }}
                          />
                          <span>{partner.company_name}</span>
                        </label>
                      );
                    })
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      No partners found.
                    </p>
                  )}
                </div>
              </div>

              <Button type='submit' disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
