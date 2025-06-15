import { useState, useEffect } from "react";
import { Link } from "wouter";
import { MapPin, Star, Clock, Navigation, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateDistance, formatDistance, getCurrentUserLocation } from "@/lib/distance";

interface Store {
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
  isDeliveryAvailable?: boolean;
}

interface StoreCardProps {
  store: Store;
  showDistance?: boolean;
}

export default function StoreCard({ store, showDistance = true }: StoreCardProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (showDistance && store.latitude && store.longitude) {
      getCurrentUserLocation()
        .then((location) => {
          setUserLocation(location);
          const dist = calculateDistance(
            location,
            { latitude: parseFloat(store.latitude!), longitude: parseFloat(store.longitude!) }
          );
          setDistance(dist);
        })
        .catch(() => {
          // Silently fail if location access is denied
        });
    }
  }, [store.latitude, store.longitude, showDistance]);

  const openGoogleMaps = () => {
    if (store.latitude && store.longitude) {
      const url = `https://maps.google.com/?q=${store.latitude},${store.longitude}`;
      window.open(url, '_blank');
    }
  };

  const getDirections = () => {
    if (store.latitude && store.longitude && userLocation) {
      const url = `https://maps.google.com/maps?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${store.latitude},${store.longitude}`;
      window.open(url, '_blank');
    } else if (store.latitude && store.longitude) {
      const url = `https://maps.google.com/maps?daddr=${store.latitude},${store.longitude}`;
      window.open(url, '_blank');
    }
  };

  // Handle card click but allow button clicks to work independently
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if the click was on a button, link, or interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"], .no-navigate')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  return (
    <div onClick={handleCardClick}>
      <Link href={`/store/${store.id}`} className="block cursor-pointer">
        <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
          <CardHeader className="pb-2 p-3 flex-grow-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm hover:text-primary line-clamp-1">
                  {store.name}
                </h3>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant={store.storeType === 'restaurant' ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                {store.storeType === 'restaurant' ? 'Restaurant' : 'Retail'}
              </Badge>
              {store.cuisineType && (
                <Badge variant="outline" className="text-xs px-1 py-0">{store.cuisineType}</Badge>
              )}
            </div>
          </div>
          {store.logo && (
            <img
              src={store.logo}
              alt={`${store.name} logo`}
              className="w-8 h-8 rounded object-cover"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2 p-3 pt-0">
        {store.coverImage && (
          <img
            src={store.coverImage}
            alt={`${store.name} cover`}
            className="w-full h-20 rounded object-cover"
          />
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{parseFloat(store.rating).toFixed(1)}</span>
            <span>({store.totalReviews})</span>
          </div>
          
          {store.deliveryTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{store.deliveryTime}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground flex-1 line-clamp-1">
            {store.address}
          </span>
        </div>

        {distance !== null && (
          <Badge variant="outline" className="text-xs w-full justify-center">
            {formatDistance(distance)} away
          </Badge>
        )}

        {store.latitude && store.longitude && (
          <div className="flex gap-1 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={openGoogleMaps}
              className="flex-1 text-xs h-7 w-7 p-0"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={getDirections}
              className="flex-1 text-xs h-7 w-7 p-0"
            >
              <Navigation className="h-3 w-3" />
            </Button>
          </div>
        )}

        {store.isDeliveryAvailable && (
          <Badge className="w-full justify-center text-xs py-1">
            Delivery Available
          </Badge>
        )}
        </CardContent>
        </Card>
      </Link>
    </div>
  );
}