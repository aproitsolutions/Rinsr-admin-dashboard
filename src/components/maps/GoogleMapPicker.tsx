'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Script from 'next/script';

interface GoogleMapPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleMapPicker({
  initialLocation,
  onLocationSelect
}: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleMapsScriptSrc = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;

  useEffect(() => {
    if (scriptLoaded && mapRef.current && !map && window.google) {
      const defaultLocation = { lat: 20.5937, lng: 78.9629 }; // India center
      const startLocation = initialLocation || defaultLocation;

      const newMap = new window.google.maps.Map(mapRef.current, {
        center: startLocation,
        zoom: initialLocation ? 15 : 5,
        mapTypeControl: false,
        streetViewControl: false
      });

      const newMarker = new window.google.maps.Marker({
        position: startLocation,
        map: newMap,
        draggable: true
      });

      // Click listener
      newMap.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updateMarkerPosition(newMarker, lat, lng);
      });

      // Drag listener
      newMarker.addListener('dragend', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        handleLocationSelect(lat, lng);
      });

      setMap(newMap);
      setMarker(newMarker);
    }
  }, [scriptLoaded, mapRef, initialLocation]);

  // Update marker when initialLocation changes (e.g. from autocomplete)
  useEffect(() => {
    if (map && marker && initialLocation) {
      marker.setPosition(initialLocation);
      map.panTo(initialLocation);
      map.setZoom(15);
    }
  }, [initialLocation, map, marker]);

  const updateMarkerPosition = (
    markerInstance: any,
    lat: number,
    lng: number
  ) => {
    const newPos = { lat, lng };
    markerInstance.setPosition(newPos);
    handleLocationSelect(lat, lng);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };

    geocoder.geocode({ location: latlng }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        onLocationSelect({
          lat,
          lng,
          address: results[0].formatted_address
        });
      } else {
        console.error('Geocoder failed due to: ' + status);
        // Fallback if geocoding fails
        onLocationSelect({
          lat,
          lng,
          address: ''
        });
      }
    });
  };

  return (
    <div className='space-y-2'>
      <Script
        src={googleMapsScriptSrc}
        onLoad={() => setScriptLoaded(true)}
        strategy='lazyOnload'
      />
      <div
        ref={mapRef}
        className='h-[300px] w-full rounded-md border shadow-sm'
      />
      <p className='text-muted-foreground text-xs'>
        Click on the map or drag the marker to select a location.
      </p>
    </div>
  );
}
