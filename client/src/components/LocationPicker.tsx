import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationPickerProps {
  address: string;
  latitude?: string;
  longitude?: string;
  onLocationChange: (data: {
    address: string;
    latitude: string;
    longitude: string;
    googleMapsLink: string;
  }) => void;
}

export function LocationPicker({
  address,
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      
      // Get address from coordinates using reverse geocoding
      const address = await reverseGeocode(lat, lng);
      const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;
      
      onLocationChange({
        address,
        latitude: lat.toString(),
        longitude: lng.toString(),
        googleMapsLink,
      });

      toast({
        title: "Location found",
        description: "Your location has been automatically filled",
      });
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location error",
        description: "Could not get your location. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim for reverse geocoding (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat}, ${lng}`; // Fallback to coordinates
    }
  };

  const handleAddressChange = (newAddress: string) => {
    onLocationChange({
      address: newAddress,
      latitude: latitude || "",
      longitude: longitude || "",
      googleMapsLink: latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : "",
    });
  };

  const generateGoogleMapsLink = () => {
    if (latitude && longitude) {
      const link = `https://maps.google.com/?q=${latitude},${longitude}`;
      window.open(link, '_blank');
    } else {
      toast({
        title: "No coordinates",
        description: "Please get your location first to generate Google Maps link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="address">Store Address</Label>
        <div className="flex gap-2 mt-1">
          <Textarea
            id="address"
            placeholder="Complete store address"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {isLoading ? "Getting..." : "Get My Location"}
          </Button>
        </div>
      </div>

      {latitude && longitude && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              value={latitude}
              readOnly
              className="bg-muted"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              value={longitude}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={generateGoogleMapsLink}
              className="w-full"
            >
              View on Google Maps
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}