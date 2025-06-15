import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Navigation,
  Target,
  Loader2,
  Phone,
  Star,
  Clock,
  DollarSign,
  Utensils
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons for restaurants and user location
const restaurantIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" width="32" height="32">
      <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 0 0 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41-5.51-5.51z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#2563eb"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
      <circle cx="12" cy="12" r="2" fill="#2563eb"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface RestaurantWithDistance {
  id: number;
  name: string;
  description?: string;
  address: string;
  latitude?: string;
  longitude?: string;
  phone?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  rating: string;
  totalReviews: number;
  storeType: string;
  cuisineType?: string;
  deliveryTime?: string;
  minimumOrder?: string;
  deliveryFee?: string;
  isDeliveryAvailable?: boolean;
  distance: number;
}

interface RestaurantMapProps {
  cuisineFilter?: string;
}

export default function RestaurantMap({ cuisineFilter }: RestaurantMapProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithDistance | null>(null);
  const [manualLocation, setManualLocation] = useState({ lat: "", lon: "" });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showNearbyRestaurants, setShowNearbyRestaurants] = useState(false);

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
        setIsGettingLocation(false);
        setShowNearbyRestaurants(true);
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setIsGettingLocation(false);
      }
    );
  };

  // Set manual location
  const setManualUserLocation = () => {
    const lat = parseFloat(manualLocation.lat);
    const lon = parseFloat(manualLocation.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      setLocationError("Please enter valid coordinates");
      return;
    }
    
    setUserLocation({ latitude: lat, longitude: lon });
    setLocationError(null);
    setShowNearbyRestaurants(true);
  };

  // Find nearby restaurants manually
  const findNearbyRestaurants = () => {
    if (userLocation) {
      setShowNearbyRestaurants(true);
    } else {
      getUserLocation();
    }
  };

  // Fetch nearby restaurants when user location is available
  const { data: nearbyRestaurants, isLoading } = useQuery<RestaurantWithDistance[]>({
    queryKey: ["/api/stores/nearby", userLocation?.latitude, userLocation?.longitude, "restaurant", cuisineFilter],
    queryFn: async () => {
      if (!userLocation) return [];
      
      let url = `/api/stores/nearby?lat=${userLocation.latitude}&lon=${userLocation.longitude}&storeType=restaurant`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch nearby restaurants");
      
      let restaurants = await response.json();
      
      // Filter by cuisine type if specified
      if (cuisineFilter && cuisineFilter !== 'all') {
        restaurants = restaurants.filter((restaurant: RestaurantWithDistance) => 
          restaurant.cuisineType === cuisineFilter
        );
      }
      
      return restaurants;
    },
    enabled: !!userLocation && showNearbyRestaurants,
  });

  // Generate Google Maps URL for directions
  const getDirectionsUrl = (restaurant: RestaurantWithDistance) => {
    if (!userLocation) return "#";
    
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${restaurant.latitude},${restaurant.longitude}`;
    
    return `https://www.google.com/maps/dir/${origin}/${destination}`;
  };

  // Center coordinates for the map (Siraha, Nepal)
  const defaultCenter: [number, number] = [26.6586, 86.2003];

  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Utensils className="h-6 w-6 text-red-600" />
          Restaurant Locations & Food Delivery
        </h2>
        <p className="text-gray-600">
          Find nearby restaurants and get directions for pickup or delivery
        </p>

        {/* Location Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={findNearbyRestaurants}
            disabled={isGettingLocation}
            className="bg-red-600 hover:bg-red-700"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            Find Nearby Restaurants
          </Button>
          
          <div className="flex gap-2">
            <Input
              placeholder="Latitude"
              value={manualLocation.lat}
              onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
              className="w-24"
            />
            <Input
              placeholder="Longitude"
              value={manualLocation.lon}
              onChange={(e) => setManualLocation({ ...manualLocation, lon: e.target.value })}
              className="w-24"
            />
            <Button onClick={setManualUserLocation} variant="outline">
              Set Location
            </Button>
          </div>
        </div>

        {locationError && (
          <Alert className="max-w-md mx-auto">
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-gray-500">
          Click to track your location and discover restaurants near you
        </p>
      </div>

      {/* Nearby Restaurants List and Map */}
      {userLocation && showNearbyRestaurants && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-600" />
                Nearby Restaurants
                {nearbyRestaurants && nearbyRestaurants.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {nearbyRestaurants.length} found
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Restaurants sorted by distance from closest to farthest
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-red-600" />
                  <p className="mt-2 text-gray-600">Finding nearby restaurants...</p>
                </div>
              ) : nearbyRestaurants && nearbyRestaurants.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {nearbyRestaurants.map((restaurant, index) => (
                    <div
                      key={restaurant.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedRestaurant?.id === restaurant.id
                          ? "border-red-500 bg-red-50 shadow-md"
                          : "border-gray-200 hover:border-red-300 hover:shadow-sm"
                      }`}
                      onClick={() => setSelectedRestaurant(restaurant)}
                    >
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg text-gray-900">{restaurant.name}</h3>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={index < 3 ? "default" : "secondary"} className="text-xs">
                              {restaurant.distance.toFixed(1)} km away
                            </Badge>
                            {restaurant.distance < 1 && (
                              <span className="text-xs text-green-600 font-medium">Very Close!</span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">{restaurant.description}</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{restaurant.address}</span>
                          </div>
                          {restaurant.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <span>{restaurant.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Restaurant specific info */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {restaurant.cuisineType && (
                            <Badge variant="outline">{restaurant.cuisineType}</Badge>
                          )}
                          {restaurant.deliveryTime && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{restaurant.deliveryTime}</span>
                            </div>
                          )}
                          {restaurant.minimumOrder && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <DollarSign className="h-3 w-3" />
                              <span>Min: ${restaurant.minimumOrder}</span>
                            </div>
                          )}
                          {restaurant.isDeliveryAvailable && (
                            <Badge variant="secondary" className="text-green-600">
                              Delivery Available
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">
                              {restaurant.rating} ({restaurant.totalReviews} reviews)
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(getDirectionsUrl(restaurant), "_blank");
                              }}
                              className="flex-1 sm:flex-none"
                            >
                              <Navigation className="h-4 w-4 mr-1" />
                              Directions
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRestaurant(restaurant);
                              }}
                              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
                            >
                              View Menu
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No restaurants found in your area
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Map</CardTitle>
              <CardDescription>Interactive map showing restaurant locations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 w-full">
                {selectedRestaurant?.latitude && selectedRestaurant?.longitude ? (
                  <MapContainer
                    center={[parseFloat(selectedRestaurant.latitude), parseFloat(selectedRestaurant.longitude)]}
                    zoom={14}
                    className="h-full w-full rounded-b-lg"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {nearbyRestaurants?.map((restaurant) => (
                      restaurant.latitude && restaurant.longitude && (
                        <Marker
                          key={restaurant.id}
                          position={[parseFloat(restaurant.latitude), parseFloat(restaurant.longitude)]}
                          icon={restaurantIcon}
                        >
                          <Popup>
                            <div className="text-center">
                              <h3 className="font-bold">{restaurant.name}</h3>
                              <p className="text-sm">{restaurant.address}</p>
                              <p className="text-sm">Rating: {restaurant.rating} ⭐</p>
                              {restaurant.cuisineType && (
                                <p className="text-sm">Cuisine: {restaurant.cuisineType}</p>
                              )}
                              {restaurant.deliveryTime && (
                                <p className="text-sm">Delivery: {restaurant.deliveryTime}</p>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      )
                    ))}
                    {userLocation && (
                      <Marker
                        position={[userLocation.latitude, userLocation.longitude]}
                        icon={userIcon}
                      >
                        <Popup>Your Location</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                ) : userLocation ? (
                  <MapContainer
                    center={[userLocation.latitude, userLocation.longitude]}
                    zoom={13}
                    className="h-full w-full rounded-b-lg"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {nearbyRestaurants?.map((restaurant) => (
                      restaurant.latitude && restaurant.longitude && (
                        <Marker
                          key={restaurant.id}
                          position={[parseFloat(restaurant.latitude), parseFloat(restaurant.longitude)]}
                          icon={restaurantIcon}
                        >
                          <Popup>
                            <div className="text-center">
                              <h3 className="font-bold">{restaurant.name}</h3>
                              <p className="text-sm">{restaurant.address}</p>
                              <p className="text-sm">Rating: {restaurant.rating} ⭐</p>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    ))}
                    <Marker
                      position={[userLocation.latitude, userLocation.longitude]}
                      icon={userIcon}
                    >
                      <Popup>Your Location</Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <MapContainer
                    center={defaultCenter}
                    zoom={10}
                    className="h-full w-full rounded-b-lg"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </MapContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Restaurant Details */}
          {selectedRestaurant && (
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-red-600" />
                  {selectedRestaurant.name}
                </CardTitle>
                <CardDescription>{selectedRestaurant.address}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Restaurant Details</h4>
                    <p className="text-sm text-gray-600">{selectedRestaurant.description}</p>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{selectedRestaurant.rating} ({selectedRestaurant.totalReviews} reviews)</span>
                    </div>
                    {selectedRestaurant.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{selectedRestaurant.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Delivery Information</h4>
                    {selectedRestaurant.cuisineType && (
                      <p className="text-sm">Cuisine: {selectedRestaurant.cuisineType}</p>
                    )}
                    {selectedRestaurant.deliveryTime && (
                      <p className="text-sm">Delivery Time: {selectedRestaurant.deliveryTime}</p>
                    )}
                    {selectedRestaurant.minimumOrder && (
                      <p className="text-sm">Minimum Order: ${selectedRestaurant.minimumOrder}</p>
                    )}
                    {selectedRestaurant.deliveryFee && (
                      <p className="text-sm">Delivery Fee: ${selectedRestaurant.deliveryFee}</p>
                    )}
                    <Badge variant={selectedRestaurant.isDeliveryAvailable ? "default" : "secondary"}>
                      {selectedRestaurant.isDeliveryAvailable ? "Delivery Available" : "Pickup Only"}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => window.open(getDirectionsUrl(selectedRestaurant), "_blank")}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions in Google Maps
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}