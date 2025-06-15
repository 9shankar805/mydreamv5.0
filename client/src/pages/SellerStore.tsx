import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Store, Edit, MapPin, Phone, Globe, Star, Plus, Camera, Save, UtensilsCrossed, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/ImageUpload";
import { LocationPicker } from "@/components/LocationPicker";
import { useAuth } from "@/hooks/useAuth";
import BackToDashboard from "@/components/BackToDashboard";

const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  storeType: z.enum(["retail", "restaurant"]).default("retail"),
  cuisineType: z.string().optional(),
  deliveryTime: z.string().optional(),
  minimumOrder: z.string().optional(),
  deliveryFee: z.string().optional(),
  isDeliveryAvailable: z.boolean().default(false),
  openingHours: z.string().optional()
});

interface StoreData {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  website: string;
  logo: string;
  coverImage: string;
  rating: string;
  totalReviews: number;
  featured: boolean;
  isActive: boolean;
  storeType: string;
  cuisineType?: string;
  deliveryTime?: string;
  minimumOrder?: number;
  deliveryFee?: number;
  isDeliveryAvailable: boolean;
  openingHours?: string;
  createdAt: string;
}

export default function SellerStore() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const form = useForm<z.infer<typeof storeSchema>>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      latitude: "",
      longitude: "",
      phone: "",
      website: "",
      logo: "",
      coverImage: "",
      storeType: "retail",
      cuisineType: "",
      deliveryTime: "",
      minimumOrder: "",
      deliveryFee: "",
      isDeliveryAvailable: false,
      openingHours: ""
    }
  });

  // Store query
  const { data: stores, isLoading: storesLoading } = useQuery<StoreData[]>({
    queryKey: ['/api/stores/owner', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const userStore = stores?.[0]; // Assuming one store per user for now

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (data: z.infer<typeof storeSchema>) => {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          ownerId: currentUser?.id
        })
      });
      if (!response.ok) throw new Error('Failed to create store');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Store Created",
        description: "Your store has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores/owner', currentUser?.id] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create store",
        variant: "destructive"
      });
    }
  });

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (data: z.infer<typeof storeSchema>) => {
      const response = await fetch(`/api/stores/${userStore?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update store');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Store Updated",
        description: "Your store has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores/owner', currentUser?.id] });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update store",
        variant: "destructive"
      });
    }
  });

  const handleCreateStore = (data: z.infer<typeof storeSchema>) => {
    createStoreMutation.mutate(data);
  };

  const handleUpdateStore = (data: z.infer<typeof storeSchema>) => {
    updateStoreMutation.mutate(data);
  };

  const openEditDialog = () => {
    if (userStore) {
      form.reset({
        name: userStore.name,
        description: userStore.description || "",
        address: userStore.address,
        latitude: userStore.latitude || "",
        longitude: userStore.longitude || "",
        phone: userStore.phone || "",
        website: userStore.website || "",
        logo: userStore.logo || "",
        coverImage: userStore.coverImage || "",
        storeType: userStore.storeType === "restaurant" ? "restaurant" : "retail",
        cuisineType: userStore.cuisineType || "",
        deliveryTime: userStore.deliveryTime || "",
        minimumOrder: userStore.minimumOrder?.toString() || "",
        deliveryFee: userStore.deliveryFee?.toString() || "",
        isDeliveryAvailable: userStore.isDeliveryAvailable || false,
        openingHours: userStore.openingHours || ""
      });
      setIsEditDialogOpen(true);
    }
  };

  const openCreateDialog = () => {
    form.reset();
    setIsCreateDialogOpen(true);
  };

  if (!currentUser || currentUser.role !== 'shopkeeper') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You need to be a shopkeeper to access store management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if shopkeeper is approved by admin
  if (currentUser.role === 'shopkeeper' && (currentUser as any).status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center text-yellow-600">
              Pending Admin Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-muted-foreground">
              Your seller account is pending approval from our admin team. You cannot access store management until approved.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline">Go to Homepage</Button>
              </Link>
              <Link href="/account">
                <Button variant="default">View Account Status</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Management</h1>
                <p className="text-sm text-muted-foreground">Manage your store information and settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BackToDashboard />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userStore ? (
          /* Existing Store Management */
          <div className="space-y-6">
            {/* Store Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {userStore.logo ? (
                        <img src={userStore.logo} alt="Store Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{userStore.name}</h2>
                        <p className="text-muted-foreground">{userStore.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm">{parseFloat(userStore.rating).toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">
                              ({userStore.totalReviews} reviews)
                            </span>
                          </div>
                          <Badge variant={userStore.isActive ? 'default' : 'secondary'}>
                            {userStore.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <Button onClick={openEditDialog} className="mt-4 sm:mt-0">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Store
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">{userStore.address}</p>
                    </div>
                  </div>
                  {userStore.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-muted-foreground">{userStore.phone}</p>
                      </div>
                    </div>
                  )}
                  {userStore.website && (
                    <div className="flex items-start space-x-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Website</p>
                        <a 
                          href={userStore.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {userStore.website}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Store Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{userStore.totalReviews}</p>
                      <p className="text-sm text-muted-foreground">Total Reviews</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{parseFloat(userStore.rating).toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      Store created on {new Date(userStore.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/seller/products/add">
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                  <Link href="/seller/inventory">
                    <Button variant="outline" className="w-full">
                      View Inventory
                    </Button>
                  </Link>
                  <Link href="/seller/orders">
                    <Button variant="outline" className="w-full">
                      Manage Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* No Store - Create Store */
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create Your Store</CardTitle>
                <p className="text-muted-foreground">
                  Set up your store to start selling products on Siraha Bazaar
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateStore)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name</FormLabel>
                            <FormControl>
                              <Input placeholder="My Awesome Store" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Tell customers about your store..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <LocationPicker
                      address={form.watch("address")}
                      latitude={form.watch("latitude")}
                      longitude={form.watch("longitude")}
                      onLocationChange={(data) => {
                        form.setValue("address", data.address);
                        form.setValue("latitude", data.latitude);
                        form.setValue("longitude", data.longitude);
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://mystore.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="storeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select store type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="retail">Retail Store</SelectItem>
                              <SelectItem value="restaurant">Restaurant</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Logo</FormLabel>
                            <FormControl>
                              <ImageUpload
                                label="Store Logo"
                                maxImages={1}
                                minImages={0}
                                onImagesChange={(images) => field.onChange(images[0] || "")}
                                initialImages={field.value ? [field.value] : []}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="text-sm text-muted-foreground">
                              Auto-compressed to ~200KB for optimal performance
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coverImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Cover Image</FormLabel>
                            <FormControl>
                              <ImageUpload
                                label="Store Cover Image"
                                maxImages={1}
                                minImages={0}
                                onImagesChange={(images) => field.onChange(images[0] || "")}
                                initialImages={field.value ? [field.value] : []}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="text-sm text-muted-foreground">
                              Auto-compressed to ~200KB for optimal performance
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-center">
                      <Button type="submit" disabled={createStoreMutation.isPending} size="lg" className="w-full sm:w-auto px-8">
                        {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>



      {/* Edit Store Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Store Information</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateStore)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Store" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell customers about your store..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <LocationPicker
                address={form.watch("address")}
                latitude={form.watch("latitude")}
                longitude={form.watch("longitude")}
                onLocationChange={(data) => {
                  form.setValue("address", data.address);
                  form.setValue("latitude", data.latitude);
                  form.setValue("longitude", data.longitude);
                }}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://mystore.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateStoreMutation.isPending}>
                  {updateStoreMutation.isPending ? 'Updating...' : 'Update Store'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}