import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Phone, Star, Loader2, Target, Map } from "lucide-react";
import type { Store } from "@shared/schema";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different marker types
const storeIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzM5ODRmZiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
});

interface StoreWithDistance extends Store {
  distance: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface StoreMapProps {
  storeType?: 'retail' | 'restaurant';
}

export default function StoreMap({ storeType = 'retail' }: StoreMapProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreWithDistance | null>(null);
  const [manualLocation, setManualLocation] = useState({ lat: "", lon: "" });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showNearbyStores, setShowNearbyStores] = useState(false);

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setShowNearbyStores(true);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Failed to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Set manual location
  const setManualLocationHandler = () => {
    const lat = parseFloat(manualLocation.lat);
    const lon = parseFloat(manualLocation.lon);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      setUserLocation({ latitude: lat, longitude: lon });
      setShowNearbyStores(true);
      setLocationError(null);
    } else {
      setLocationError("Please enter valid latitude and longitude values");
    }
  };

  // Find nearby stores manually
  const findNearbyStores = () => {
    if (userLocation) {
      setShowNearbyStores(true);
    } else {
      getUserLocation();
    }
  };

  // Fetch nearby stores when user location is available
  const { data: nearbyStores, isLoading } = useQuery<StoreWithDistance[]>({
    queryKey: ["/api/stores/nearby", userLocation?.latitude, userLocation?.longitude, storeType],
    queryFn: async () => {
      if (!userLocation) return [];
      
      const url = `/api/stores/nearby?lat=${userLocation.latitude}&lon=${userLocation.longitude}&storeType=${storeType}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch nearby stores");
      return response.json();
    },
    enabled: !!userLocation && showNearbyStores,
  });

  // Generate Google Maps URL for directions
  const getDirectionsUrl = (store: StoreWithDistance) => {
    if (!userLocation) return "#";
    
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${store.latitude},${store.longitude}`;
    
    return `https://www.google.com/maps/dir/${origin}/${destination}`;
  };

  // Center coordinates for the map (Siraha, Nepal)
  const defaultCenter: [number, number] = [26.6586, 86.2003];

  // Dynamic content based on store type
  const getStoreTypeContent = () => {
    if (storeType === 'restaurant') {
      return {
        title: 'Restaurant Locations & Directions',
        description: 'Find nearby restaurants and get directions to them',
        buttonText: 'Find Nearby Restaurants',
        subtitle: 'Click to track your location and discover restaurants near you',
        cardTitle: 'Nearby Restaurants',
        cardDescription: 'Restaurants sorted by distance from closest to farthest'
      };
    }
    return {
      title: 'Store Locations & Directions',
      description: 'Find nearby retail stores and get directions to them',
      buttonText: 'Find Nearby Stores',
      subtitle: 'Click to track your location and discover stores near you',
      cardTitle: 'Nearby Stores',
      cardDescription: 'Stores sorted by distance from closest to farthest'
    };
  };

  const content = getStoreTypeContent();

  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <MapPin className="h-5 w-5" />
            {content.title}
          </CardTitle>
          <CardDescription>
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prominent Find Nearby Stores Button */}
          <div className="text-center">
            <Button 
              onClick={findNearbyStores} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Target className="h-5 w-5 mr-2" />
                  {content.buttonText}
                </>
              )}
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              {content.subtitle}
            </p>
          </div>

          {/* Error Alert */}
          {locationError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {locationError}
              </AlertDescription>
            </Alert>
          )}

          {/* Manual Location Input */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Or enter coordinates manually:</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Latitude"
                value={manualLocation.lat}
                onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
                className="flex-1 min-w-0"
              />
              <Input
                placeholder="Longitude"
                value={manualLocation.lon}
                onChange={(e) => setManualLocation({ ...manualLocation, lon: e.target.value })}
                className="flex-1 min-w-0"
              />
              <Button onClick={setManualLocationHandler} variant="outline" className="w-full sm:w-auto">
                <Map className="h-4 w-4 mr-2" />
                Set Location
              </Button>
            </div>
          </div>

          {/* Location Status */}
          {userLocation && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 font-medium">
                  Location Found: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {userLocation && showNearbyStores && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                {content.cardTitle}
                {nearbyStores && nearbyStores.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {nearbyStores.length} found
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {content.cardDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
                  <p className="mt-2 text-gray-600">Finding nearby stores...</p>
                </div>
              ) : nearbyStores && nearbyStores.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {nearbyStores.map((store, index) => (
                    <div
                      key={store.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedStore?.id === store.id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                      onClick={() => setSelectedStore(store)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={index < 3 ? "default" : "secondary"} 
                            className={`text-xs px-2 py-1 ${
                              index === 0 ? "bg-green-600" : 
                              index === 1 ? "bg-blue-600" : 
                              index === 2 ? "bg-orange-600" : ""
                            }`}
                          >
                            #{index + 1}
                          </Badge>
                          <h3 className="font-semibold text-lg">{store.name}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={store.distance < 1 ? "destructive" : store.distance < 5 ? "default" : "secondary"} 
                            className={`self-start ${
                              store.distance < 1 ? "bg-green-600" : 
                              store.distance < 5 ? "bg-blue-600" : ""
                            }`}
                          >
                            {store.distance.toFixed(1)} km away
                          </Badge>
                          {store.distance < 1 && (
                            <span className="text-xs text-green-600 font-medium">Very Close!</span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">{store.description}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{store.address}</span>
                        </div>
                        {store.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {store.rating} ({store.totalReviews} reviews)
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getDirectionsUrl(store), "_blank");
                            }}
                            className="w-8 h-8 p-0"
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStore(store);
                            }}
                            className="flex-1 sm:flex-none"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No stores found in your area
                </div>
              )}
            </CardContent>
          </Card>

          {selectedStore && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedStore.name}</CardTitle>
                <CardDescription>Store details and interactive map</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 md:h-80 lg:h-96 bg-gray-100 rounded-lg overflow-hidden">
                  {selectedStore.latitude && selectedStore.longitude ? (
                    <MapContainer
                      center={[parseFloat(selectedStore.latitude), parseFloat(selectedStore.longitude)]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      className="z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[parseFloat(selectedStore.latitude), parseFloat(selectedStore.longitude)]}
                        icon={storeIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <h3 className="font-semibold">{selectedStore.name}</h3>
                            <p className="text-sm text-gray-600">{selectedStore.address}</p>
                            <p className="text-sm">Rating: {selectedStore.rating} ⭐</p>
                          </div>
                        </Popup>
                      </Marker>
                      {userLocation && (
                        <Marker
                          position={[userLocation.latitude, userLocation.longitude]}
                          icon={userIcon}
                        >
                          <Popup>Your Location</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500">
                      <div>
                        <MapPin className="h-12 w-12 mx-auto mb-2" />
                        <p>Location coordinates not available</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Address</h4>
                    <p className="text-gray-600">{selectedStore.address}</p>
                  </div>

                  {selectedStore.phone && (
                    <div>
                      <h4 className="font-semibold mb-1">Phone</h4>
                      <p className="text-gray-600">{selectedStore.phone}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-1">Distance</h4>
                    <p className="text-gray-600">{selectedStore.distance.toFixed(1)} km from your location</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1">Rating</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{selectedStore.rating}</span>
                      </div>
                      <span className="text-gray-500">({selectedStore.totalReviews} reviews)</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      className="w-full"
                      onClick={() => window.open(getDirectionsUrl(selectedStore), "_blank")}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions in Google Maps
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}