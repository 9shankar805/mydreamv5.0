import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, MapPin, Filter, Utensils, Store, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StoreCard from "@/components/StoreCard";
import { getCurrentUserLocation } from "@/lib/distance";
import { useToast } from "@/hooks/use-toast";

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

export default function Stores() {
  const [location] = useLocation();
  const isRestaurantPage = location.includes('/restaurants');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [storeTypeFilter, setStoreTypeFilter] = useState(isRestaurantPage ? "restaurant" : "all");
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const { toast } = useToast();

  // Fetch all stores with comprehensive error handling
  const { data: stores = [], isLoading: storesLoading, error: storesError, refetch: refetchStores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Enhanced error logging
  if (storesError) {
    console.error("Stores loading failed:", {
      error: storesError,
      message: storesError instanceof Error ? storesError.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }

  // Get user location on component mount
  useEffect(() => {
    getCurrentUserLocation()
      .then((location) => {
        setUserLocation(location);
        setLocationEnabled(true);
      })
      .catch(() => {
        // User denied location access
      });
  }, []);

  // Get unique cuisines for filter options
  const availableCuisines = Array.from(new Set(stores
    .filter(store => store.storeType === 'restaurant' && store.cuisineType)
    .map(store => store.cuisineType)
  )).filter(Boolean) as string[];

  // Filter stores based on all criteria and page context
  const filteredStores = stores.filter((store) => {
    // Page-specific filtering: restaurants only on restaurant page, retail stores only on stores page
    if (isRestaurantPage) {
      // On restaurant page, only show restaurants
      if (store.storeType !== "restaurant") return false;
    } else {
      // On stores page, exclude restaurants (only show retail stores)
      if (store.storeType === "restaurant") return false;
    }

    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         store.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         store.cuisineType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = storeTypeFilter === "all" || store.storeType === storeTypeFilter;
    
    const matchesCuisine = cuisineFilter === "all" || store.cuisineType === cuisineFilter;
    
    const matchesDelivery = deliveryFilter === "all" || 
                           (deliveryFilter === "delivery" && store.isDeliveryAvailable) ||
                           (deliveryFilter === "pickup" && !store.isDeliveryAvailable);
    
    const matchesRating = ratingFilter === "all" || 
                         (ratingFilter === "4+" && parseFloat(store.rating) >= 4.0) ||
                         (ratingFilter === "3+" && parseFloat(store.rating) >= 3.0);
    
    return matchesSearch && matchesType && matchesCuisine && matchesDelivery && matchesRating;
  });

  const handleGetLocation = async () => {
    try {
      const location = await getCurrentUserLocation();
      setUserLocation(location);
      setLocationEnabled(true);
      toast({
        title: "Location enabled",
        description: "Stores will now show distance from your location",
      });
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "Please allow location access to see distances",
        variant: "destructive",
      });
    }
  };

  if (storesLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            {isRestaurantPage ? (
              <>
                <Utensils className="h-10 w-10 text-red-600" />
                Discover Local Restaurants
              </>
            ) : (
              <>
                <Store className="h-10 w-10 text-blue-600" />
                Discover Local Stores
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isRestaurantPage 
              ? "Find the best restaurants and food delivery options in your area"
              : "Find the best stores and shopping destinations in your area"
            }
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Primary Search and Type Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={isRestaurantPage ? "Search restaurants, cuisines, or food items..." : "Search stores, products, or brands..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Store Type Filter */}
                {!isRestaurantPage && (
                  <Select value={storeTypeFilter} onValueChange={setStoreTypeFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stores</SelectItem>
                      <SelectItem value="retail">Retail Stores</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Location Button */}
                {!locationEnabled && (
                  <Button variant="outline" onClick={handleGetLocation}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Enable Location
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cuisine Filter (for restaurants) */}
                {(isRestaurantPage || storeTypeFilter === "restaurant") && availableCuisines.length > 0 && (
                  <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                    <SelectTrigger>
                      <Utensils className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Cuisines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cuisines</SelectItem>
                      {availableCuisines.map((cuisine) => (
                        <SelectItem key={cuisine} value={cuisine!}>
                          {cuisine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Delivery Filter */}
                <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Delivery Options" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Options</SelectItem>
                    <SelectItem value="delivery">Delivery Available</SelectItem>
                    <SelectItem value="pickup">Pickup Only</SelectItem>
                  </SelectContent>
                </Select>

                {/* Rating Filter */}
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Minimum Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="4+">4.0+ Stars</SelectItem>
                    <SelectItem value="3+">3.0+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              {(searchQuery || storeTypeFilter !== (isRestaurantPage ? "restaurant" : "all") || 
                cuisineFilter !== "all" || deliveryFilter !== "all" || ratingFilter !== "all") && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary">
                      Search: {searchQuery}
                      <button 
                        onClick={() => setSearchQuery("")} 
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {storeTypeFilter !== (isRestaurantPage ? "restaurant" : "all") && (
                    <Badge variant="secondary">
                      Type: {storeTypeFilter}
                      <button 
                        onClick={() => setStoreTypeFilter(isRestaurantPage ? "restaurant" : "all")} 
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {cuisineFilter !== "all" && (
                    <Badge variant="secondary">
                      Cuisine: {cuisineFilter}
                      <button 
                        onClick={() => setCuisineFilter("all")} 
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {deliveryFilter !== "all" && (
                    <Badge variant="secondary">
                      {deliveryFilter === "delivery" ? "Delivery Available" : "Pickup Only"}
                      <button 
                        onClick={() => setDeliveryFilter("all")} 
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {ratingFilter !== "all" && (
                    <Badge variant="secondary">
                      Rating: {ratingFilter}
                      <button 
                        onClick={() => setRatingFilter("all")} 
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSearchQuery("");
                      setStoreTypeFilter(isRestaurantPage ? "restaurant" : "all");
                      setCuisineFilter("all");
                      setDeliveryFilter("all");
                      setRatingFilter("all");
                    }}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              )}

              {/* Location Status */}
              {locationEnabled && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Location enabled - showing distances
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Store Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isRestaurantPage ? "Total Restaurants" : "Total Stores"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isRestaurantPage 
                  ? stores.filter(s => s.storeType === 'restaurant').length
                  : stores.length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isRestaurantPage ? "Cuisines Available" : "Restaurants"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isRestaurantPage 
                  ? new Set(stores.filter(s => s.storeType === 'restaurant' && s.cuisineType).map(s => s.cuisineType)).size
                  : stores.filter(s => s.storeType === 'restaurant').length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isRestaurantPage ? "Delivery Available" : "Retail Stores"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isRestaurantPage 
                  ? stores.filter(s => s.storeType === 'restaurant' && s.isDeliveryAvailable).length
                  : stores.filter(s => s.storeType === 'retail').length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Counter */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {filteredStores.length > 0 ? (
              <>
                {filteredStores.length} {isRestaurantPage ? "restaurant" : "store"}{filteredStores.length !== 1 ? "s" : ""} found
                {stores.length !== filteredStores.length && (
                  <span className="text-muted-foreground ml-2">
                    (filtered from {stores.length} total)
                  </span>
                )}
              </>
            ) : (
              "No results found"
            )}
          </h2>
        </div>

        {/* Stores Grid */}
        {storesError ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Alert className="max-w-md mx-auto mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load stores. Please try again.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => refetchStores()} 
                variant="outline"
                disabled={storesLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${storesLoading ? 'animate-spin' : ''}`} />
                Retry Loading Stores
              </Button>
            </CardContent>
          </Card>
        ) : storesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="bg-gray-200 h-20 rounded-md mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded mb-1"></div>
                  <div className="bg-gray-200 h-2 rounded w-2/3 mb-1"></div>
                  <div className="bg-gray-200 h-2 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredStores.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {filteredStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                showDistance={locationEnabled}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-muted-foreground mb-4">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {isRestaurantPage ? "No restaurants found" : "No stores found"}
                </h3>
                <p>Try adjusting your search criteria or filters to find what you're looking for</p>
              </div>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setStoreTypeFilter(isRestaurantPage ? "restaurant" : "all");
                setCuisineFilter("all");
                setDeliveryFilter("all");
                setRatingFilter("all");
              }}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Location-Based</h3>
            <p className="text-muted-foreground">
              Find stores near you with accurate distance calculations
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
            <p className="text-muted-foreground">
              Search by store name, type, or products to find exactly what you need
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Filtering</h3>
            <p className="text-muted-foreground">
              Filter by store type, ratings, and delivery options
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}