import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Phone, Package } from 'lucide-react';

interface DeliveryTrackingMapProps {
  deliveryId: number;
  userType: 'customer' | 'shopkeeper' | 'delivery_partner';
  onStatusUpdate?: (status: string) => void;
}

interface TrackingData {
  delivery: any;
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  } | null;
  route: {
    pickupLocation: { lat: number; lng: number };
    deliveryLocation: { lat: number; lng: number };
    polyline: string;
    distance: number;
    estimatedDuration: number;
  } | null;
  statusHistory: any[];
}

export function DeliveryTrackingMap({ deliveryId, userType, onStatusUpdate }: DeliveryTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [platform, setPlatform] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize HERE Maps
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.api.here.com/v3/3.1/mapsjs-core.js';
    script.async = true;

    const uiScript = document.createElement('script');
    uiScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-ui.js';
    uiScript.async = true;

    const behaviorScript = document.createElement('script');
    behaviorScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js';
    behaviorScript.async = true;

    const serviceScript = document.createElement('script');
    serviceScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-service.js';
    serviceScript.async = true;

    script.onload = () => {
      uiScript.onload = () => {
        behaviorScript.onload = () => {
          serviceScript.onload = () => {
            initializeMap();
          };
          document.head.appendChild(serviceScript);
        };
        document.head.appendChild(behaviorScript);
      };
      document.head.appendChild(uiScript);
    };

    document.head.appendChild(script);

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.H) return;

    try {
      const platform = new window.H.service.Platform({
        'apikey': import.meta.env.VITE_HERE_API_KEY || 'YOUR_HERE_API_KEY'
      });

      const defaultMapTypes = platform.createDefaultMapTypes();
      const mapInstance = new window.H.Map(
        mapRef.current,
        defaultMapTypes.vector.normal.map,
        {
          zoom: 13,
          center: { lat: 26.4499, lng: 80.3319 } // Default center (Kanpur, India)
        }
      );

      const behavior = new window.H.mapevents.Behavior();
      const ui = window.H.ui.UI.createDefault(mapInstance);

      setPlatform(platform);
      setMap(mapInstance);

      // Load tracking data
      loadTrackingData();
    } catch (error) {
      console.error('Error initializing HERE Maps:', error);
      setError('Failed to load map. Please check your internet connection.');
    }
  };

  const loadTrackingData = async () => {
    try {
      if (userType === 'customer') {
        // For customers, get order details along with tracking
        const orderResponse = await fetch(`/api/orders/${deliveryId}/tracking`);
        if (!orderResponse.ok) throw new Error('Failed to fetch order data');
        const orderData = await orderResponse.json();

        // Also get delivery tracking if available
        const trackingResponse = await fetch(`/api/deliveries/${deliveryId}/tracking`);
        let trackingInfo = null;
        if (trackingResponse.ok) {
          trackingInfo = await trackingResponse.json();
        }

        setTrackingData({
          delivery: trackingInfo?.delivery,
          currentLocation: trackingInfo?.currentLocation,
          route: trackingInfo?.route,
          statusHistory: trackingInfo?.statusHistory
        });
      } else {
        const response = await fetch(`/api/tracking/${deliveryId}`);
        if (!response.ok) throw new Error('Failed to load tracking data');

        const data = await response.json();
        setTrackingData(data);

        if (map && data.route) {
          displayRoute(data);
        }
      }


      // Initialize WebSocket connection
      initializeWebSocket();

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading tracking data:', error);
      setError('Failed to load tracking data');
      setIsLoading(false);
    }
  };

  const initializeWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        userId: 1, // This should come from user context
        userType: userType,
        sessionId: `${Date.now()}_${Math.random()}`
      }));

      // Subscribe to tracking updates
      ws.send(JSON.stringify({
        type: 'subscribe_tracking',
        deliveryId: deliveryId
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (!websocket || websocket.readyState === WebSocket.CLOSED) {
          initializeWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWebsocket(ws);
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'location_update':
        if (message.deliveryId === deliveryId) {
          updateDeliveryPartnerLocation(message.latitude, message.longitude);
        }
        break;
      case 'status_update':
        if (message.deliveryId === deliveryId) {
          updateDeliveryStatus(message.status, message.description);
        }
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const displayRoute = (data: TrackingData) => {
    if (!map || !data.route) return;

    const group = new window.H.map.Group();

    // Add pickup marker (shop/store) - Enhanced for shopkeeper view
    const pickupIcon = new window.H.map.Icon(
      'data:image/svg+xml;base64,' + btoa(`
        <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="22" fill="#10B981" stroke="white" stroke-width="4"/>
          <g transform="translate(25,25)">
            <rect x="-10" y="-8" width="20" height="16" fill="white" rx="3"/>
            <rect x="-8" y="-10" width="16" height="6" fill="white" rx="2"/>
            <circle cx="0" cy="0" r="3" fill="#10B981"/>
            <text x="0" y="15" text-anchor="middle" font-size="8" fill="#10B981" font-weight="bold">STORE</text>
          </g>
        </svg>
      `),
      { size: { w: 50, h: 50 } }
    );

    const pickupMarker = new window.H.map.Marker(data.route.pickupLocation, { icon: pickupIcon });
    pickupMarker.setData({ type: 'pickup', address: data.delivery?.pickupAddress || 'Pickup Location' });

    // Add info bubble for pickup
    pickupMarker.addEventListener('tap', () => {
      const bubble = new window.H.ui.InfoBubble({
        content: `<div style="padding: 10px;"><strong>📦 Pickup Location</strong><br/>${data.delivery?.pickupAddress || 'Shop/Store Location'}</div>`
      }, { position: data.route.pickupLocation });
      map.getViewPort().getDefaultUI().getBubbles().addBubble(bubble);
    });

    group.addObject(pickupMarker);

    // Add delivery marker (customer) - Enhanced for shopkeeper view
    const deliveryIcon = new window.H.map.Icon(
      'data:image/svg+xml;base64,' + btoa(`
        <svg width="46" height="46" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
          <circle cx="23" cy="23" r="20" fill="#EF4444" stroke="white" stroke-width="4"/>
          <g transform="translate(23,23)">
            <rect x="-8" y="-10" width="16" height="12" fill="white" rx="2"/>
            <rect x="-6" y="-8" width="12" height="4" fill="#EF4444"/>
            <rect x="-7" y="2" width="14" height="8" fill="white" rx="2"/>
            <rect x="-4" y="4" width="3" height="3" fill="#EF4444"/>
            <rect x="1" y="4" width="3" height="3" fill="#EF4444"/>
            <text x="0" y="18" text-anchor="middle" font-size="7" fill="#EF4444" font-weight="bold">CUSTOMER</text>
          </g>
        </svg>
      `),
      { size: { w: 46, h: 46 } }
    );

    const deliveryMarker = new window.H.map.Marker(data.route.deliveryLocation, { icon: deliveryIcon });
    deliveryMarker.setData({ type: 'delivery', address: data.delivery?.deliveryAddress || 'Delivery Location' });

    // Add info bubble for delivery
    deliveryMarker.addEventListener('tap', () => {
      const bubble = new window.H.ui.InfoBubble({
        content: `<div style="padding: 10px;"><strong>🏠 Delivery Location</strong><br/>${data.delivery?.deliveryAddress || 'Customer Location'}</div>`
      }, { position: data.route.deliveryLocation });
      map.getViewPort().getDefaultUI().getBubbles().addBubble(bubble);
    });

    group.addObject(deliveryMarker);

    // Add delivery partner current location marker if available
    if (data.currentLocation) {
      const deliveryPartnerIcon = new window.H.map.Icon(
        'data:image/svg+xml;base64,' + btoa(`
          <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" fill="#3B82F6" stroke="white" stroke-width="4"/>
            <g transform="translate(24,24)">
              <circle cx="0" cy="-6" r="5" fill="white"/>
              <rect x="-8" y="0" width="16" height="10" fill="white" rx="3"/>
              <circle cx="-4" cy="8" r="3" fill="#3B82F6"/>
              <circle cx="4" cy="8" r="3" fill="#3B82F6"/>
              <path d="M-6 2 L6 2 L4 -4 L-4 -4 Z" fill="#3B82F6"/>
              ${userType === 'shopkeeper' ? '<text x="0" y="20" text-anchor="middle" font-size="7" fill="#3B82F6" font-weight="bold">PARTNER</text>' : ''}
              ${data.currentLocation.heading ? `<path d="M0 -18 L-3 -12 L3 -12 Z" fill="#FF4444" transform="rotate(${data.currentLocation.heading || 0})"/>` : ''}
            </g>
          </svg>
        `),
        { size: { w: 48, h: 48 } }
      );

      const deliveryPartnerMarker = new window.H.map.Marker(
        { lat: data.currentLocation.latitude, lng: data.currentLocation.longitude },
        { icon: deliveryPartnerIcon }
      );
      deliveryPartnerMarker.setData({ type: 'delivery_partner' });

      // Add info bubble for delivery partner
      deliveryPartnerMarker.addEventListener('tap', () => {
        const lastUpdate = new Date(data.currentLocation.timestamp).toLocaleTimeString();
        const bubble = new window.H.ui.InfoBubble({
          content: `<div style="padding: 10px;"><strong>🚴 Delivery Partner</strong><br/>Last update: ${lastUpdate}</div>`
        }, { position: { lat: data.currentLocation.latitude, lng: data.currentLocation.longitude } });
        map.getViewPort().getDefaultUI().getBubbles().addBubble(bubble);
      });

      group.addObject(deliveryPartnerMarker);
    }

    // Add route polyline if available
    if (data.route.polyline) {
      try {
        const routeCoordinates = decodePolyline(data.route.polyline);
        const lineString = new window.H.geo.LineString();

        routeCoordinates.forEach((coord: { lat: number; lng: number }) => {
          lineString.pushPoint(coord);
        });

        const routeLine = new window.H.map.Polyline(lineString, {
          style: { strokeColor: '#3B82F6', lineWidth: 4 }
        });

        group.addObject(routeLine);
      } catch (error) {
        console.error('Error displaying route:', error);
      }
    }

    map.addObject(group);
    map.getViewPort().resize();

    // Set view to show all markers
    const bbox = group.getBoundingBox();
    if (bbox) {
      map.getViewPort().setBounds(bbox, true);
    }
  };

  const updateDeliveryPartnerLocation = (latitude: number, longitude: number) => {
    if (!map) return;

    // Remove existing current location marker
    const objects = map.getObjects();
    objects.forEach((obj: any) => {
      if (obj instanceof window.H.map.Group) {
        const groupObjects = obj.getObjects();
        groupObjects.forEach((marker: any) => {
          if (marker.getData && marker.getData().type === 'current_location') {
            obj.removeObject(marker);
          }
        });
      }
    });

    // Add new current location marker
    const currentIcon = new window.H.map.Icon(
      'data:image/svg+xml;base64,' + btoa(`
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      `),
      { size: { w: 24, h: 24 } }
    );

    const currentMarker = new window.H.map.Marker(
      { lat: latitude, lng: longitude },
      { icon: currentIcon }
    );
    currentMarker.setData({ type: 'current_location' });

    const group = map.getObjects()[0];
    if (group instanceof window.H.map.Group) {
      group.addObject(currentMarker);
    }

    // Update tracking data
    setTrackingData(prev => prev ? {
      ...prev,
      currentLocation: { latitude, longitude, timestamp: new Date() }
    } : null);
  };

  const updateDeliveryStatus = (status: string, description?: string) => {
    setTrackingData(prev => {
      if (!prev) return null;

      return {
        ...prev,
        delivery: { ...prev.delivery, status },
        statusHistory: [
          {
            status,
            description,
            timestamp: new Date().toISOString()
          },
          ...prev.statusHistory
        ]
      };
    });

    if (onStatusUpdate) {
      onStatusUpdate(status);
    }
  };

  const decodePolyline = (polyline: string): Array<{ lat: number; lng: number }> => {
    // Simple polyline decoder - in production, use HERE's official decoder
    const coordinates: Array<{ lat: number; lng: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < polyline.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = polyline.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = polyline.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      coordinates.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return coordinates;
  };

  const openGoogleMapsNavigation = (destination: 'pickup' | 'delivery') => {
    if (!trackingData?.route) return;

    const { pickupLocation, deliveryLocation } = trackingData.route;
    const targetLocation = destination === 'pickup' ? pickupLocation : deliveryLocation;

    // Get current location for navigation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        const url = `https://www.google.com/maps/dir/${currentLat},${currentLng}/${targetLocation.lat},${targetLocation.lng}`;
        window.open(url, '_blank');
      }, () => {
        // Fallback without current location
        const url = `https://www.google.com/maps/search/?api=1&query=${targetLocation.lat},${targetLocation.lng}`;
        window.open(url, '_blank');
      });
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${targetLocation.lat},${targetLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  const openGoogleMapsRoute = () => {
    if (!trackingData?.route) return;

    const { pickupLocation, deliveryLocation } = trackingData.route;
    const url = `https://www.google.com/maps/dir/${pickupLocation.lat},${pickupLocation.lng}/${deliveryLocation.lat},${deliveryLocation.lng}`;
    window.open(url, '_blank');
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'en_route_pickup': return 'bg-orange-500';
      case 'picked_up': return 'bg-purple-500';
      case 'en_route_delivery': return 'bg-indigo-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'assigned': return 'Delivery Partner Assigned';
      case 'en_route_pickup': return 'En Route to Pickup';
      case 'picked_up': return 'Order Picked Up';
      case 'en_route_delivery': return 'En Route to Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading tracking information...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button onClick={loadTrackingData} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Delivery Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Delivery Tracking</span>
            {trackingData?.delivery && (
              <Badge className={`${getStatusColor(trackingData.delivery.status)} text-white`}>
                {getStatusText(trackingData.delivery.status)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trackingData?.route && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Distance</p>
                  <p className="text-sm text-gray-600">
                    {formatDistance(trackingData.route.distance)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Est. Time</p>
                  <p className="text-sm text-gray-600">
                    {formatDuration(trackingData.route.estimatedDuration)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Navigation className="h-4 w-4 text-gray-500" />
                <div className="flex flex-col gap-1">
                  {userType === 'delivery_partner' && (
                    <div className="flex gap-1">
                      <Button 
                        onClick={() => openGoogleMapsNavigation('pickup')}
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                      >
                        Navigate to Pickup
                      </Button>
                      <Button 
                        onClick={() => openGoogleMapsNavigation('delivery')}
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                      >
                        Navigate to Customer
                      </Button>
                    </div>
                  )}
                  <Button 
                    onClick={openGoogleMapsRoute}
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    View Full Route
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Card */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapRef} 
            className="w-full h-96 bg-gray-100"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>

      {/* Status History */}
      {trackingData?.statusHistory && trackingData.statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trackingData.statusHistory.map((status, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)} mt-1.5`}></div>
                  <div className="flex-1">
                    <p className="font-medium">{getStatusText(status.status)}</p>
                    {status.description && (
                      <p className="text-sm text-gray-600">{status.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(status.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}