import React, { useEffect, useRef, useState } from 'react';

const DeliveryTrackingMap = ({
  vehicleLocation,
  destinationCoords,
  pickupCoords,
  locationText,
}) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Determine effective coordinates
  const vehiclePos = vehicleLocation?.latitude && vehicleLocation?.longitude
    ? { lat: Number(vehicleLocation.latitude), lng: Number(vehicleLocation.longitude) }
    : null;

  const destPos = destinationCoords?.latitude && destinationCoords?.longitude
    ? { lat: Number(destinationCoords.latitude), lng: Number(destinationCoords.longitude) }
    : null;

  const pickupPos = pickupCoords?.latitude && pickupCoords?.longitude
    ? { lat: Number(pickupCoords.latitude), lng: Number(pickupCoords.longitude) }
    : null;

  useEffect(() => {
    if (!apiKey) {
      setMapError(true);
      return;
    }

    // Load Google Maps script dynamically if not already present
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => setMapError(true);
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => setMapLoaded(true));
    }
  }, [apiKey]);

  // Initialize and update Map markers when script loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google || mapError) return;

    try {
      const center = vehiclePos || destPos || pickupPos || { lat: 17.385, lng: 78.4867 }; // Default fallback center
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        disableDefaultUI: false,
        zoomControl: true,
      });

      const bounds = new window.google.maps.LatLngBounds();
      let hasMarkers = false;

      // Add Destination Marker
      if (destPos) {
        new window.google.maps.Marker({
          position: destPos,
          map,
          title: `Destination: ${locationText || 'Customer'}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          },
        });
        bounds.extend(destPos);
        hasMarkers = true;
      }

      // Add Pickup Marker
      if (pickupPos) {
        new window.google.maps.Marker({
          position: pickupPos,
          map,
          title: 'Pickup Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          },
        });
        bounds.extend(pickupPos);
        hasMarkers = true;
      }

      // Add Vehicle Marker
      if (vehiclePos) {
        new window.google.maps.Marker({
          position: vehiclePos,
          map,
          title: 'Assigned Delivery Vehicle',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          },
        });
        bounds.extend(vehiclePos);
        hasMarkers = true;
      }

      // Draw polyline if both vehicle & destination exist
      if (vehiclePos && destPos) {
        new window.google.maps.Polyline({
          path: [vehiclePos, destPos],
          geodesic: true,
          strokeColor: '#10b981',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        });
      }

      if (hasMarkers) {
        map.fitBounds(bounds);
      }
    } catch (err) {
      console.error('[DeliveryTrackingMap] Map init error:', err);
    }
  }, [mapLoaded, mapError, vehiclePos, destPos, pickupPos, locationText]);

  // Graceful Fallback UI when Google Maps Key or Coordinates are unavailable
  if (!apiKey || mapError || (!vehiclePos && !destPos)) {
    return (
      <div
        style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          marginTop: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
          Interactive Map Unavailable
        </h4>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 auto', maxWidth: '460px', lineHeight: '1.5' }}>
          {!apiKey
            ? 'Google Maps API key is not configured (VITE_GOOGLE_MAPS_API_KEY). Live location text updates remain active.'
            : 'GPS location coordinates are not currently provided for this delivery route.'}
        </p>

        {/* Display Text Coordinates / Address when available */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#4b5563' }}>
          <div>
            <strong>Destination:</strong> {locationText || 'Saved Customer Address'}
          </div>
          {vehiclePos && (
            <div>
              <strong>Vehicle GPS:</strong> {vehiclePos.lat.toFixed(4)}, {vehiclePos.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '340px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        }}
      />
    </div>
  );
};

export default DeliveryTrackingMap;
