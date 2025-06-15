import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Truck, Phone, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    H: any;
  }
}

interface Location {
  lat: number;
  lng: number;
}

interface TrackingData {
  delivery: {
    deliveries: {
      id: number;
      status: string;
      pickupAddress: string;
      deliveryAddress: string;
      specialInstructions?: string;
    };
    orders: {
      id: number;
      customerName: string;
      phone: string;
      totalAmount: string;
    };
  };
  currentLocation?: {
    currentLatitude: string;
    currentLongitude: string;
    heading?: string;
    speed?: string;
    timestamp: string;
  };
  route?: {
    routeGeometry: string;
    distanceMeters: number;
    estimatedDurationSeconds: number;
  };
  statusHistory: Array<{
    status: string;
    description?: string;
    timestamp: string;
  }>;
}

interface RealTimeTrackingMapProps {
  deliveryId: number;
  userType: 'customer' | 'delivery_partner' | 'shopkeeper';
  userId: number;
}

export default function RealTimeTrackingMap({ deliveryId, userType, userId }: RealTimeTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [hereMapLoaded, setHereMapLoaded] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // Load HERE Maps API
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.api.here.com/v3/3.1/mapsjs-core.js';
    script.async = true;
    script.onload = () => {
      const uiScript = document.createElement('script');
      uiScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-ui.js';
      uiScript.async = true;
      uiScript.onload = () => {
        const behaviorScript = document.createElement('script');
        behaviorScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js';
        behaviorScript.async = true;
        behaviorScript.onload = () => setHereMapLoaded(true);
        document.head.appendChild(behaviorScript);
      };
      document.head.appendChild(uiScript);
    };
    document.head.appendChild(script);

    // CSS for HERE Maps
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';
    document.head.appendChild(link);

    return () => {
      script.remove();
      link.remove();
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (hereMapLoaded && mapRef.current && !map.current) {
      const platform = new window.H.service.Platform({
        'apikey': process.env.VITE_HERE_API_KEY || 'demo'
      });

      const defaultMapTypes = platform.createDefaultMapTypes();
      
      map.current = new window.H.Map(
        mapRef.current,
        defaultMapTypes.vector.normal.map,
        {
          zoom: 13,
          center: { lat: 26.6593, lng: 86.1924 } // Siraha, Nepal
        }
      );

      const behavior = new window.H.mapevents.Behavior();
      const ui = new window.H.ui.UI.createDefault(map.current);
    }
  }, [hereMapLoaded]);

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setWsConnected(true);
      // Authenticate
      ws.current?.send(JSON.stringify({
        type: 'auth',
        userId,
        userType,
        token: 'demo-token' // TODO: Use real authentication token
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'location_update' && data.deliveryId === deliveryId) {
          setLastUpdate(new Date());
          updateDeliveryLocation(data.data.location);
        }
        
        if (data.type === 'status_update' && data.deliveryId === deliveryId) {
          setLastUpdate(new Date());
          fetchTrackingData();
        }
        
        if (data.type === 'route_update' && data.deliveryId === deliveryId) {
          setLastUpdate(new Date());
          updateRoute(data.data);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.current.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [deliveryId, userId, userType]);

  // Fetch initial tracking data
  const fetchTrackingData = async () => {
    try {
      const response = await fetch(`/api/tracking/${deliveryId}`);
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
        
        if (map.current && data.currentLocation) {
          const location = {
            lat: parseFloat(data.currentLocation.currentLatitude),
            lng: parseFloat(data.currentLocation.currentLongitude)
          };
          updateDeliveryLocation(location);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [deliveryId]);

  // Update delivery location on map
  const updateDeliveryLocation = (location: Location) => {
    if (!map.current) return;

    // Remove existing delivery marker
    const existingMarker = map.current.getObjects().find((obj: any) => obj.getData()?.type === 'delivery');
    if (existingMarker) {
      map.current.removeObject(existingMarker);
    }

    // Add new delivery marker
    const deliveryIcon = new window.H.map.Icon(
      'data:image/svg+xml;base64,' + btoa(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="white" stroke-width="4"/>
          <path d="M12 16L14.5 18.5L20 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `),
      { size: { w: 32, h: 32 } }
    );

    const deliveryMarker = new window.H.map.Marker(location, { icon: deliveryIcon });
    deliveryMarker.setData({ type: 'delivery' });
    map.current.addObject(deliveryMarker);

    // Center map on delivery location
    map.current.getViewModel().setLookAtData({ position: location });
  };

  // Update route on map
  const updateRoute = (routeData: any) => {
    if (!map.current || !routeData.route) return;

    // Remove existing route
    const existingRoute = map.current.getObjects().find((obj: any) => obj.getData()?.type === 'route');
    if (existingRoute) {
      map.current.removeObject(existingRoute);
    }

    // Add new route
    const routeCoordinates = routeData.coordinates || [];
    if (routeCoordinates.length > 0) {
      const lineString = new window.H.geo.LineString();
      routeCoordinates.forEach((coord: Location) => {
        lineString.pushPoint(coord.lat, coord.lng);
      });

      const routeLine = new window.H.map.Polyline(lineString, {
        style: { strokeColor: '#3B82F6', lineWidth: 4 }
      });
      routeLine.setData({ type: 'route' });
      map.current.addObject(routeLine);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-500',
      'assigned': 'bg-blue-500',
      'en_route_pickup': 'bg-purple-500',
      'picked_up': 'bg-orange-500',
      'en_route_delivery': 'bg-indigo-500',
      'delivered': 'bg-green-500',
      'cancelled': 'bg-red-500'
    };
    return statusColors[status] || 'bg-gray-500';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const openGoogleMaps = () => {
    if (trackingData?.currentLocation) {
      const lat = trackingData.currentLocation.currentLatitude;
      const lng = trackingData.currentLocation.currentLongitude;
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const sendLocationUpdate = () => {
    if (userType === 'delivery_partner' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const locationUpdate = {
          deliveryId,
          deliveryPartnerId: userId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy
        };

        fetch('/api/tracking/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(locationUpdate)
        });
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Tracking Map
              {wsConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Live
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef}
              className="w-full h-96 bg-gray-100 rounded-lg"
              style={{ minHeight: '400px' }}
            />
            
            <div className="flex gap-2 mt-4">
              <Button onClick={openGoogleMaps} variant="outline" size="sm">
                <Navigation className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>
              
              {userType === 'delivery_partner' && (
                <Button onClick={sendLocationUpdate} size="sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  Update Location
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <div className="space-y-6">
        {/* Delivery Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackingData && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(trackingData.delivery.deliveries.status)}`} />
                  <span className="font-medium">
                    {formatStatus(trackingData.delivery.deliveries.status)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Order ID:</strong> #{trackingData.delivery.orders.id}</p>
                  <p><strong>Customer:</strong> {trackingData.delivery.orders.customerName}</p>
                  <p><strong>Amount:</strong> Rs. {trackingData.delivery.orders.totalAmount}</p>
                </div>

                {lastUpdate && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        {trackingData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer:</span>
                  <a 
                    href={`tel:${trackingData.delivery.orders.phone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {trackingData.delivery.orders.phone}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Addresses */}
        {trackingData && (
          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Pickup:</p>
                  <p>{trackingData.delivery.deliveries.pickupAddress}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Delivery:</p>
                  <p>{trackingData.delivery.deliveries.deliveryAddress}</p>
                </div>
                {trackingData.delivery.deliveries.specialInstructions && (
                  <div>
                    <p className="font-medium text-gray-600">Instructions:</p>
                    <p className="text-gray-800">{trackingData.delivery.deliveries.specialInstructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status History */}
        {trackingData && trackingData.statusHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trackingData.statusHistory.slice(0, 5).map((status, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{formatStatus(status.status)}</span>
                    <span className="text-gray-500">
                      {new Date(status.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}