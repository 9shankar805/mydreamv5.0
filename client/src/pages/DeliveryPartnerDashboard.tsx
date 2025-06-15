
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { Truck, Package, DollarSign, Clock, MapPin, CheckCircle, Star, Bell, TrendingUp, Calendar, Navigation, Phone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import DeliveryNotifications from "@/components/DeliveryNotifications";
import DeliveryPartnerProfileSetup from "@/components/DeliveryPartnerProfileSetup";
import DeliveryMap from "@/components/DeliveryMap";

interface DeliveryPartner {
  id: number;
  userId: number;
  vehicleType: string;
  vehicleNumber: string;
  drivingLicense: string;
  idProofType: string;
  idProofNumber: string;
  deliveryAreas: string[];
  emergencyContact: string;
  bankAccountNumber: string;
  ifscCode: string;
  status: string;
  isAvailable: boolean;
  currentLocation: string | null;
  totalDeliveries: number;
  totalEarnings: string;
  rating: number | null;
  createdAt: string;
}

interface Delivery {
  id: number;
  orderId: number;
  deliveryFee: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDistance: number;
  status: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  customerFeedback: string | null;
  customerRating: number | null;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: string;
}

interface DeliveryPartnerStats {
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  todayDeliveries: number;
  todayEarnings: number;
  activeDeliveries: number;
}

export default function DeliveryPartnerDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const { data: partner, isLoading: partnerLoading, error: partnerError } = useQuery({
    queryKey: ['/api/delivery-partners/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/delivery-partners/user?userId=${user?.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch partner data');
      }
      return response.json();
    },
    enabled: !!user?.id,
    retry: 2,
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries/partner', partner?.id],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/partner/${partner?.id}`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!partner?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/delivery-partners/stats', partner?.id],
    queryFn: async () => {
      const response = await fetch(`/api/delivery-partners/${partner?.id}/stats`);
      if (!response.ok) {
        // Return default stats if endpoint doesn't exist
        return {
          totalDeliveries: partner?.totalDeliveries || 0,
          totalEarnings: parseFloat(partner?.totalEarnings || '0'),
          rating: partner?.rating ? parseFloat(partner.rating.toString()) : 0,
          todayDeliveries: 0,
          todayEarnings: 0,
          activeDeliveries: Array.isArray(deliveries) ? deliveries.filter((d: Delivery) => ['assigned', 'picked_up'].includes(d.status)).length : 0
        };
      }
      return response.json();
    },
    enabled: !!partner?.id,
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ deliveryId, status }: { deliveryId: number; status: string }) => {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, partnerId: partner?.id }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/partner'] });
      toast({
        title: "Status Updated",
        description: "Delivery status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update delivery status.",
        variant: "destructive",
      });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      const response = await fetch(`/api/delivery-partners/${partner?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-partners/user'] });
      toast({
        title: "Availability Updated",
        description: "Your availability status has been updated.",
      });
    },
  });

  if (partnerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Loading Dashboard</h2>
          <p className="text-gray-500">Please wait while we fetch your information...</p>
        </div>
      </div>
    );
  }

  // Show dashboard for all partners (approved status is handled by admin approval process)
  if (!partner) {
    return <DeliveryPartnerProfileSetup userId={user?.id || 0} />;
  }

  const deliveriesArray = Array.isArray(deliveries) ? deliveries : [];
  const pendingDeliveries = deliveriesArray.filter((d: Delivery) => d.status === 'assigned');
  const activeDeliveries = deliveriesArray.filter((d: Delivery) => d.status === 'picked_up');
  const completedDeliveries = deliveriesArray.filter((d: Delivery) => d.status === 'delivered');

  const currentStats = stats || {
    totalDeliveries: partner?.totalDeliveries || 0,
    totalEarnings: parseFloat(partner?.totalEarnings || '0'),
    rating: partner?.rating ? parseFloat(partner.rating.toString()) : 0,
    todayDeliveries: 0,
    todayEarnings: 0,
    activeDeliveries: pendingDeliveries.length + activeDeliveries.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Delivery Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={partner.isAvailable ? "default" : "secondary"}
                className={`px-4 py-2 text-sm font-medium ${
                  partner.isAvailable 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  partner.isAvailable ? "bg-green-500" : "bg-gray-400"
                }`}></div>
                {partner.isAvailable ? "Online" : "Offline"}
              </Badge>
              <Button
                variant={partner.isAvailable ? "outline" : "default"}
                onClick={() => toggleAvailability.mutate(!partner.isAvailable)}
                disabled={toggleAvailability.isPending}
                className={partner.isAvailable 
                  ? "border-red-200 text-red-600 hover:bg-red-50" 
                  : "bg-green-600 hover:bg-green-700 text-white"
                }
              >
                {partner.isAvailable ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Available Orders
              {/* Show notification count if there are pending orders */}
              <Badge variant="destructive" className="ml-2 px-2 py-1 text-xs">
                New
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              My Deliveries ({pendingDeliveries.length + activeDeliveries.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Deliveries</CardTitle>
                  <Package className="h-5 w-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentStats.totalDeliveries}</div>
                  <p className="text-xs opacity-80 mt-1">
                    +{currentStats.todayDeliveries} today
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Earnings</CardTitle>
                  <DollarSign className="h-5 w-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{currentStats.totalEarnings.toFixed(2)}</div>
                  <p className="text-xs opacity-80 mt-1">
                    +₹{currentStats.todayEarnings.toFixed(2)} today
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Active Deliveries</CardTitle>
                  <Clock className="h-5 w-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentStats.activeDeliveries}</div>
                  <p className="text-xs opacity-80 mt-1">
                    {pendingDeliveries.length} pending, {activeDeliveries.length} in progress
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Rating</CardTitle>
                  <Star className="h-5 w-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {currentStats.rating > 0 ? `${currentStats.rating.toFixed(1)}★` : "N/A"}
                  </div>
                  <p className="text-xs opacity-80 mt-1">
                    Based on customer feedback
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription>Common tasks and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="h-16 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700">
                    <Bell className="h-5 w-5" />
                    <span className="text-xs">Notifications</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col gap-2">
                    <Navigation className="h-5 w-5" />
                    <span className="text-xs">Navigation</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col gap-2">
                    <Phone className="h-5 w-5" />
                    <span className="text-xs">Support</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs">Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Section */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Area Map
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Live
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center">
                      <div className="text-center p-8">
                        <MapPin className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Interactive Map</h3>
                        <p className="text-gray-500 mb-4">
                          Real-time delivery tracking and navigation
                        </p>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Pickup Locations</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Delivery Destinations</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Your Current Location</span>
                          </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open('https://www.google.com/maps', '_blank')}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Open Maps
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition((position) => {
                                  toast({
                                    title: "Location Updated",
                                    description: "Your current location has been recorded.",
                                  });
                                });
                              }
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Update Location
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{partner.deliveryAreas.length}</div>
                        <div className="text-sm text-green-700">Coverage Areas</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{currentStats.activeDeliveries}</div>
                        <div className="text-sm text-blue-700">Active Routes</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {partner.isAvailable ? "Online" : "Offline"}
                        </div>
                        <div className="text-sm text-orange-700">Status</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notifications Panel */}
              <div className="lg:col-span-1">
                <DeliveryNotifications deliveryPartnerId={partner?.id || 0} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Deliveries */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Pending Deliveries ({pendingDeliveries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingDeliveries.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No pending deliveries</p>
                    </div>
                  ) : (
                    pendingDeliveries.map((delivery: Delivery) => (
                      <Card key={delivery.id} className="border border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-lg">Order #{delivery.orderId}</div>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              ₹{delivery.deliveryFee}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                              <div>
                                <p className="font-medium">Pickup</p>
                                <p className="text-gray-600">{delivery.pickupAddress}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                              <div>
                                <p className="font-medium">Delivery</p>
                                <p className="text-gray-600">{delivery.deliveryAddress}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button
                              onClick={() => updateDeliveryStatus.mutate({ deliveryId: delivery.id, status: 'picked_up' })}
                              disabled={updateDeliveryStatus.isPending}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              Accept & Pickup
                            </Button>
                            <Button variant="outline" size="sm">
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Active Deliveries */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-500" />
                    Active Deliveries ({activeDeliveries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeDeliveries.length === 0 ? (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No active deliveries</p>
                    </div>
                  ) : (
                    activeDeliveries.map((delivery: Delivery) => (
                      <Card key={delivery.id} className="border border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-lg">Order #{delivery.orderId}</div>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              In Progress
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                              <div>
                                <p className="font-medium">Delivery Address</p>
                                <p className="text-gray-600">{delivery.deliveryAddress}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => window.open(`/delivery-map/${delivery.id}`, '_blank')}
                              className="flex-1"
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              Navigate
                            </Button>
                            <Button
                              onClick={() => updateDeliveryStatus.mutate({ deliveryId: delivery.id, status: 'delivered' })}
                              disabled={updateDeliveryStatus.isPending}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              Mark Delivered
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Delivery History</CardTitle>
                <CardDescription>Your completed deliveries</CardDescription>
              </CardHeader>
              <CardContent>
                {completedDeliveries.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No completed deliveries yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedDeliveries.map((delivery: Delivery) => (
                      <Card key={delivery.id} className="border border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-lg">Order #{delivery.orderId}</div>
                              <p className="text-sm text-gray-600">
                                Delivered on {new Date(delivery.deliveredAt!).toLocaleDateString()}
                              </p>
                              {delivery.customerRating && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium">{delivery.customerRating}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600 text-lg">₹{delivery.deliveryFee}</div>
                              <Badge variant="outline" className="border-green-300 text-green-700">
                                Completed
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Today's Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">₹{currentStats.todayEarnings.toFixed(2)}</div>
                  <p className="text-sm text-gray-500">{currentStats.todayDeliveries} deliveries</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg">This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">₹{(currentStats.totalEarnings * 0.3).toFixed(2)}</div>
                  <p className="text-sm text-gray-500">Estimated</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Total Lifetime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">₹{currentStats.totalEarnings.toFixed(2)}</div>
                  <p className="text-sm text-gray-500">{currentStats.totalDeliveries} total deliveries</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your delivery partner details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Vehicle Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Vehicle Type:</span>
                        <span className="font-medium capitalize">{partner.vehicleType}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Vehicle Number:</span>
                        <span className="font-medium">{partner.vehicleNumber}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Driving License:</span>
                        <span className="font-medium">{partner.drivingLicense}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Contact & Areas</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Emergency Contact:</span>
                        <span className="font-medium">{partner.emergencyContact}</span>
                      </div>
                      <div className="py-2 border-b">
                        <span className="text-gray-600">Delivery Areas:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {partner.deliveryAreas.map((area: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Status:</span>
                        <Badge 
                          variant={partner.status === 'approved' ? 'default' : 'secondary'}
                          className={partner.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {partner.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
