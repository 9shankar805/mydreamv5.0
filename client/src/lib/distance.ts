// Distance calculation utilities for delivery fee estimation

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryZone {
  id: number;
  name: string;
  minDistance: string;
  maxDistance: string;
  baseFee: string;
  perKmRate: string;
  isActive: boolean;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate delivery fee based on distance and delivery zones
 */
export function calculateDeliveryFee(
  distance: number,
  deliveryZones: DeliveryZone[]
): { fee: number; zone: DeliveryZone | null } {
  // Find the appropriate zone for this distance
  const applicableZone = deliveryZones
    .filter(zone => zone.isActive)
    .find(zone => {
      const minDist = parseFloat(zone.minDistance);
      const maxDist = parseFloat(zone.maxDistance);
      return distance >= minDist && distance <= maxDist;
    });

  if (!applicableZone) {
    // Default fee if no zone found (fallback to furthest zone)
    const furthestZone = deliveryZones
      .filter(zone => zone.isActive)
      .sort((a, b) => parseFloat(b.maxDistance) - parseFloat(a.maxDistance))[0];

    if (furthestZone) {
      const baseFee = parseFloat(furthestZone.baseFee);
      const perKmRate = parseFloat(furthestZone.perKmRate);
      const fee = baseFee + (distance * perKmRate);
      return { fee: Math.round(fee * 100) / 100, zone: furthestZone };
    }

    return { fee: 100, zone: null }; // Default fallback fee
  }

  const baseFee = parseFloat(applicableZone.baseFee);
  const perKmRate = parseFloat(applicableZone.perKmRate);
  const fee = baseFee + (distance * perKmRate);

  return { fee: Math.round(fee * 100) / 100, zone: applicableZone };
}

// Get coordinates from address using HERE Maps Geocoding API
export async function getCoordinatesFromAddress(address: string): Promise<{latitude: number, longitude: number} | null> {
  if (!address.trim()) return null;

  try {
    const apiKey = import.meta.env.VITE_HERE_API_KEY;
    if (!apiKey) {
      console.warn('HERE Maps API key not configured');
      return null;
    }

    const response = await fetch(
      `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to geocode address');
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const location = data.items[0].position;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Enhanced geocoding with address validation and Google Maps fallback
export async function geocodeAddressWithValidation(address: string): Promise<{
  coordinates: {latitude: number, longitude: number} | null;
  formattedAddress: string | null;
  confidence: 'high' | 'medium' | 'low';
  googleMapsLink: string;
} | null> {
  if (!address.trim()) return null;

  const googleMapsLink = `https://www.google.com/maps/search/${encodeURIComponent(address)}`;

  try {
    const apiKey = import.meta.env.VITE_HERE_API_KEY;
    if (!apiKey) {
      console.warn('HERE Maps API key not configured, providing Google Maps fallback');
      return {
        coordinates: null,
        formattedAddress: null,
        confidence: 'low',
        googleMapsLink
      };
    }

    const response = await fetch(
      `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apikey=${apiKey}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`HERE Maps API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const location = item.position;

      // Determine confidence based on scoring and match quality
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (item.scoring && item.scoring.queryScore) {
        if (item.scoring.queryScore >= 0.8) confidence = 'high';
        else if (item.scoring.queryScore >= 0.6) confidence = 'medium';
      }

      return {
        coordinates: {
          latitude: location.lat,
          longitude: location.lng
        },
        formattedAddress: item.title || item.address?.label || null,
        confidence,
        googleMapsLink: `https://www.google.com/maps/search/${location.lat},${location.lng}`
      };
    }

    return {
      coordinates: null,
      formattedAddress: null,
      confidence: 'low',
      googleMapsLink
    };
  } catch (error) {
    console.error('Enhanced geocoding error:', error);
    return {
      coordinates: null,
      formattedAddress: null,
      confidence: 'low',
      googleMapsLink
    };
  }
}

/**
 * Estimate delivery time based on distance
 * Returns estimated time in minutes
 */
export function estimateDeliveryTime(distance: number): number {
  // Base time: 30 minutes
  // Additional time: 10 minutes per km
  const baseTime = 30;
  const timePerKm = 10;

  return Math.round(baseTime + (distance * timePerKm));
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

/**
 * Get current user location using browser geolocation API
 */
export function getCurrentUserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}