
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, Clock, Phone, ArrowLeft, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FoodCard from "@/components/FoodCard";
import type { Store, Product } from "@shared/schema";

export default function RestaurantDetail() {
  const { id } = useParams();

  const { data: restaurant, isLoading: restaurantLoading } = useQuery<Store>({
    queryKey: [`/api/stores/${id}`],
    enabled: !!id,
  });

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<Product[]>({
    queryKey: [`/api/products/store/${id}`],
    enabled: !!id,
  });

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div>Loading restaurant...</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Restaurant not found</h2>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const deliveryFee = restaurant.deliveryFee ? `₹${restaurant.deliveryFee}` : "Free";
  const minimumOrder = restaurant.minimumOrder ? `₹${restaurant.minimumOrder}` : "";

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Restaurants
            </Button>
          </Link>
        </div>

        {/* Restaurant Cover Image */}
        {restaurant.coverImage && (
          <div className="w-full h-48 md:h-64 bg-gray-200 rounded-lg mb-6 overflow-hidden">
            <img
              src={restaurant.coverImage}
              alt={`${restaurant.name} cover`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";
              }}
            />
          </div>
        )}

        {/* Restaurant Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Restaurant Logo */}
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={restaurant.logo || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200";
                  }}
                />
              </div>

              {/* Restaurant Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">{restaurant.name}</h1>
                
                <div className="flex items-center mb-3">
                  <div className="flex text-yellow-400 mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(Number(restaurant.rating)) ? "fill-current" : ""
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    {restaurant.rating} ({restaurant.totalReviews} reviews)
                  </span>
                  <Badge variant="secondary" className="ml-3">
                    {restaurant.isActive ? "Open" : "Closed"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{restaurant.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{restaurant.deliveryTime || "25-35 mins"}</span>
                  </div>
                  <div className="flex items-center">
                    <Bike className="h-4 w-4 mr-2" />
                    <span>Delivery: {deliveryFee}</span>
                  </div>
                  {minimumOrder && (
                    <div className="flex items-center">
                      <span>Min order: {minimumOrder}</span>
                    </div>
                  )}
                  {restaurant.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                </div>

                {restaurant.description && (
                  <p className="text-muted-foreground mb-4">{restaurant.description}</p>
                )}

                {restaurant.cuisineType && (
                  <Badge variant="outline" className="mr-2">
                    {restaurant.cuisineType}
                  </Badge>
                )}
                
                {restaurant.isDeliveryAvailable && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <Bike className="h-3 w-3 mr-1" />
                    Delivery Available
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 w-full md:w-auto">
                {restaurant.phone && (
                  <Button 
                    className="btn-primary"
                    onClick={() => window.open(`tel:${restaurant.phone}`, '_self')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Restaurant
                  </Button>
                )}
                
                {restaurant.latitude && restaurant.longitude && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;
                      window.open(mapsUrl, '_blank');
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Menu</span>
              <Badge variant="outline">{menuItems.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {menuLoading ? (
              <div className="text-center py-8">Loading menu...</div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No menu items available at the moment</p>
                <p className="text-muted-foreground text-sm mt-2">Check back later for delicious options</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {menuItems.map((item) => (
                  <FoodCard key={item.id} product={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
