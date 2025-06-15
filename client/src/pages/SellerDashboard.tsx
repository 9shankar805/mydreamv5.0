import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  UtensilsCrossed,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPut, apiDelete } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import ImageUpload from "@/components/ImageUpload";
import { LocationPicker } from "@/components/LocationPicker";
import { DeliveryTrackingMap } from "@/components/tracking/DeliveryTrackingMap";
import type {
  Product,
  Order,
  OrderItem,
  Store,
  Category,
} from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  originalPrice: z.string().optional(),
  categoryId: z.number().min(1, "Category is required"),
  stock: z.number().min(0, "Stock must be 0 or greater"),
  imageUrl: z.string().optional(),
  images: z
    .array(z.string())
    .min(1, "At least 1 image is required")
    .max(6, "Maximum 6 images allowed"),
  isFastSell: z.boolean().default(false),
  isOnOffer: z.boolean().default(false),
  offerPercentage: z.number().min(0).max(100).default(0),
  offerEndDate: z.string().optional(),
  // Food-specific fields
  preparationTime: z.string().optional(),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  spiceLevel: z.string().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  nutritionInfo: z.string().optional(),
});

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
  openingHours: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;
type StoreForm = z.infer<typeof storeSchema>;

export default function ShopkeeperDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [storeLocation, setStoreLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(
    null,
  );
  const { user } = useAuth();
  const { toast } = useToast();

  // Queries
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: [`/api/stores/owner`, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/stores/owner/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch stores");
      return response.json();
    },
    enabled: !!user,
  });

  const currentStore = stores[0]; // Assuming one store per shopkeeper

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [`/api/products/store/${currentStore?.id}`],
    queryFn: async () => {
      if (!currentStore?.id) return [];
      const response = await fetch(`/api/products/store/${currentStore.id}`);
      if (!response.ok) throw new Error("Failed to fetch store products");
      return response.json();
    },
    enabled: !!currentStore,
  });

  const { data: orders = [] } = useQuery<(Order & { items: OrderItem[] })[]>({
    queryKey: [`/api/orders/store/${currentStore?.id}`],
    queryFn: async () => {
      if (!currentStore?.id) return [];
      const response = await fetch(`/api/orders/store/${currentStore.id}`);
      if (!response.ok) throw new Error("Failed to fetch store orders");
      return response.json();
    },
    enabled: !!currentStore,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Query for active delivery assignments for this store
  const { data: activeDeliveries = [] } = useQuery<any[]>({
    queryKey: [`/api/deliveries/store/${currentStore?.id}/active`],
    queryFn: async () => {
      if (!currentStore?.id) return [];
      const response = await fetch(
        `/api/deliveries/store/${currentStore.id}/active`,
      );
      if (!response.ok) throw new Error("Failed to fetch active deliveries");
      return response.json();
    },
    enabled: !!currentStore,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Form for adding/editing products
  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      categoryId: 1,
      stock: 0,
      imageUrl: "",
      images: [],
      isFastSell: false,
      isOnOffer: false,
      offerPercentage: 0,
      offerEndDate: "",
      preparationTime: "",
      ingredients: [],
      allergens: [],
      spiceLevel: "",
      isVegetarian: false,
      isVegan: false,
      nutritionInfo: "",
    },
  });

  // Get user's current location for store
  const getMyLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setStoreLocation(location);
          setLocationLoading(false);
          toast({
            title: "Location captured successfully",
            description: `Lat: ${location.latitude.toFixed(6)}, Lon: ${location.longitude.toFixed(6)}`,
          });
        },
        (error) => {
          setLocationLoading(false);
          toast({
            title: "Location access denied",
            description:
              "Please enable location access or enter coordinates manually",
            variant: "destructive",
          });
          console.error("Error getting location:", error);
        },
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
    }
  };

  // Form for creating stores
  const storeForm = useForm<StoreForm>({
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
      openingHours: "",
    },
  });

  // Stats calculations
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );
  const pendingOrders = orders.filter(
    (order) => order.status === "pending",
  ).length;

  const handleAddProduct = async (data: ProductForm) => {
    if (!currentStore) return;

    try {
      const productData = {
        ...data,
        storeId: currentStore.id,
        price: data.price,
        originalPrice: data.originalPrice || undefined,
        images: data.images || [],
        imageUrl: data.images?.[0] || undefined,
        isFastSell: data.isFastSell || false,
        isOnOffer: data.isOnOffer || false,
        offerPercentage: data.offerPercentage || 0,
        offerEndDate: data.offerEndDate || undefined,
        productType:
          currentStore.storeType === "restaurant" ? "food" : "retail", // Auto-set based on store type
        // Food-specific fields for restaurants
        preparationTime:
          currentStore.storeType === "restaurant"
            ? data.preparationTime || null
            : null,
        ingredients:
          currentStore.storeType === "restaurant" ? data.ingredients || [] : [],
        allergens:
          currentStore.storeType === "restaurant" ? data.allergens || [] : [],
        spiceLevel:
          currentStore.storeType === "restaurant"
            ? data.spiceLevel || null
            : null,
        isVegetarian:
          currentStore.storeType === "restaurant"
            ? data.isVegetarian || false
            : false,
        isVegan:
          currentStore.storeType === "restaurant"
            ? data.isVegan || false
            : false,
        nutritionInfo:
          currentStore.storeType === "restaurant"
            ? data.nutritionInfo || null
            : null,
      };

      if (editingProduct) {
        await apiPut(`/api/products/${editingProduct.id}`, productData);
        toast({ title: "Product updated successfully" });
      } else {
        await apiPost("/api/products", productData);
        toast({ title: "Product added successfully" });
      }

      form.reset();
      setEditingProduct(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/products/store/${currentStore.id}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      originalPrice: product.originalPrice || "",
      categoryId: product.categoryId || 0,
      stock: product.stock || 0,
      imageUrl: product.images?.[0] || "",
      images: product.images || [],
      isFastSell: product.isFastSell || false,
      isOnOffer: product.isOnOffer || false,
      offerPercentage: product.offerPercentage || 0,
      offerEndDate: product.offerEndDate || "",
    });
    setActiveTab("add-product");
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await apiDelete(`/api/products/${productId}`);
      toast({ title: "Product deleted successfully" });
      // Invalidate queries to refresh data
      if (currentStore) {
        queryClient.invalidateQueries({
          queryKey: [`/api/products/store/${currentStore.id}`],
        });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleCreateStore = async (data: StoreForm) => {
    try {
      const storeData = {
        ...data,
        ownerId: user!.id,
        phone: data.phone || null,
        description: data.description || null,
        website: data.website || null,
        logo: data.logo || null,
        coverImage: data.coverImage || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        storeType: data.storeType,
        cuisineType:
          data.storeType === "restaurant" ? data.cuisineType || null : null,
        deliveryTime:
          data.storeType === "restaurant" ? data.deliveryTime || null : null,
        minimumOrder:
          data.storeType === "restaurant" && data.minimumOrder
            ? data.minimumOrder
            : null,
        deliveryFee:
          data.storeType === "restaurant" && data.deliveryFee
            ? data.deliveryFee
            : null,
        isDeliveryAvailable:
          data.storeType === "restaurant" ? data.isDeliveryAvailable : false,
        openingHours:
          data.storeType === "restaurant" ? data.openingHours || null : null,
      };

      await apiPost("/api/stores", storeData);
      toast({ title: "Store created successfully" });
      storeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/stores", "owner", user!.id],
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create store",
        variant: "destructive",
      });
    }
  };

  const handleOrderStatusUpdate = async (orderId: number, status: string) => {
    try {
      await apiPut(`/api/orders/${orderId}/status`, { status });
      toast({ title: "Order status updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  if (!user || user.role !== "shopkeeper") {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              This page is only accessible to shopkeepers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Shopkeeper Dashboard
            </h1>
            <p className="text-muted-foreground">
              {currentStore
                ? `Managing ${currentStore.name}`
                : "Manage your store"}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className={`grid w-full ${currentStore ? "grid-cols-6" : "grid-cols-2"}`}
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {!currentStore && (
              <TabsTrigger value="create-store">Create Store</TabsTrigger>
            )}
            {currentStore && (
              <>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="add-product">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="tracking">
                  Delivery Tracking
                  {activeDeliveries.length > 0 && (
                    <Badge className="ml-2 bg-blue-500 text-white">
                      {activeDeliveries.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Products
                      </p>
                      <p className="text-2xl font-bold">{totalProducts}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Orders
                      </p>
                      <p className="text-2xl font-bold">{totalOrders}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold">
                        ₹{totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Pending Orders
                      </p>
                      <p className="text-2xl font-bold">{pendingOrders}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customerName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ₹{Number(order.totalAmount).toLocaleString()}
                          </p>
                          <Badge
                            variant={
                              order.status === "delivered"
                                ? "default"
                                : order.status === "shipped"
                                  ? "secondary"
                                  : order.status === "processing"
                                    ? "outline"
                                    : "destructive"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Add New Product
                </CardTitle>
                <p className="text-muted-foreground">
                  Add products to your store inventory
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleAddProduct)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter product name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                            <Textarea
                              placeholder="Enter product description"
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="originalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter quantity"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <ImageUpload
                            label="Product Images"
                            maxImages={6}
                            minImages={1}
                            onImagesChange={field.onChange}
                            initialImages={field.value || []}
                            className="col-span-full"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      {editingProduct ? "Update Product" : "Add Product"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Store Tab */}
          <TabsContent value="create-store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Your Store</CardTitle>
                <p className="text-muted-foreground">
                  Set up your store to start selling products on Siraha Bazaar
                </p>
              </CardHeader>
              <CardContent>
                <Form {...storeForm}>
                  <form
                    onSubmit={storeForm.handleSubmit(handleCreateStore)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={storeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="My Awesome Store"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
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
                      control={storeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell customers about your store..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <LocationPicker
                      address={storeForm.watch("address")}
                      latitude={storeForm.watch("latitude")}
                      longitude={storeForm.watch("longitude")}
                      onLocationChange={(data) => {
                        storeForm.setValue("address", data.address);
                        storeForm.setValue("latitude", data.latitude);
                        storeForm.setValue("longitude", data.longitude);
                      }}
                    />

                    <FormField
                      control={storeForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://mystore.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={storeForm.control}
                      name="storeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select store type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="retail">
                                Retail Store
                              </SelectItem>
                              <SelectItem value="restaurant">
                                Restaurant
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {storeForm.watch("storeType") === "restaurant" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={storeForm.control}
                            name="cuisineType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cuisine Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select cuisine type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="indian">
                                      Indian
                                    </SelectItem>
                                    <SelectItem value="chinese">
                                      Chinese
                                    </SelectItem>
                                    <SelectItem value="fast-food">
                                      Fast Food
                                    </SelectItem>
                                    <SelectItem value="italian">
                                      Italian
                                    </SelectItem>
                                    <SelectItem value="mexican">
                                      Mexican
                                    </SelectItem>
                                    <SelectItem value="continental">
                                      Continental
                                    </SelectItem>
                                    <SelectItem value="desserts">
                                      Desserts & Sweets
                                    </SelectItem>
                                    <SelectItem value="beverages">
                                      Beverages
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={storeForm.control}
                            name="deliveryTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Delivery Time</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., 25-35 mins"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={storeForm.control}
                            name="minimumOrder"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum Order Amount (₹)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 200" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={storeForm.control}
                            name="deliveryFee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Delivery Fee (₹)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., 40 (0 for free)"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={storeForm.control}
                            name="isDeliveryAvailable"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Delivery Available
                                  </FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Enable home delivery for your restaurant
                                  </div>
                                </div>
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="rounded"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={storeForm.control}
                            name="openingHours"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Opening Hours</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., 9:00 AM - 11:00 PM"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={storeForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              label="Store Logo"
                              single={true}
                              maxImages={1}
                              minImages={0}
                              onImagesChange={(images) =>
                                field.onChange(images[0] || "")
                              }
                              initialImages={field.value ? [field.value] : []}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="coverImage"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              label="Store Cover Image"
                              single={true}
                              maxImages={1}
                              minImages={0}
                              onImagesChange={(images) =>
                                field.onChange(images[0] || "")
                              }
                              initialImages={field.value ? [field.value] : []}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Create Store
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Manage Products</span>
                  <Button onClick={() => setActiveTab("add-product")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No products added yet
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setActiveTab("add-product")}
                    >
                      Add Your First Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                      >
                        <img
                          src={
                            product.images?.[0] ||
                            "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
                          }
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Price: ₹{Number(product.price).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Stock: {product.stock} units
                          </p>
                          <div className="flex gap-2 mt-2">
                            {product.isFastSell && (
                              <Badge variant="destructive" className="text-xs">
                                🔥 Fast Sell
                              </Badge>
                            )}
                            {product.isOnOffer && (
                              <Badge variant="secondary" className="text-xs">
                                🏷️ {product.offerPercentage}% OFF
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={product.isActive ? "default" : "secondary"}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add/Edit Product Tab */}
          <TabsContent value="add-product" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleAddProduct)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter product name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter price"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="originalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original Price (₹) - Optional</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter original price"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter quantity"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <ImageUpload
                            label="Product Images"
                            maxImages={6}
                            minImages={1}
                            onImagesChange={field.onChange}
                            initialImages={field.value || []}
                            className="col-span-full"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter product description"
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Special Features Section */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Special Features
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="isFastSell"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  Fast Sell Product
                                </FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Mark as fast-selling/trending item
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="w-4 h-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isOnOffer"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  Special Offer
                                </FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Apply discount offer
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="w-4 h-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch("isOnOffer") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name="offerPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Discount Percentage (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter discount percentage"
                                    min="0"
                                    max="100"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value) || 0,
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="offerEndDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Offer End Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Food-specific fields for restaurants */}
                    {currentStore?.storeType === "restaurant" && (
                      <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
                        <h3 className="font-medium text-lg flex items-center gap-2">
                          <UtensilsCrossed className="h-5 w-5" />
                          Food Item Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="preparationTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preparation Time</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., 15-20 mins"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="spiceLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Spice Level</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select spice level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="">
                                      Not Applicable
                                    </SelectItem>
                                    <SelectItem value="mild">Mild</SelectItem>
                                    <SelectItem value="medium">
                                      Medium
                                    </SelectItem>
                                    <SelectItem value="hot">Hot</SelectItem>
                                    <SelectItem value="extra-hot">
                                      Extra Hot
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="isVegetarian"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base font-medium">
                                    Vegetarian
                                  </FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Contains no meat or fish
                                  </div>
                                </div>
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="w-4 h-4"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="isVegan"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base font-medium">
                                    Vegan
                                  </FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Contains no animal products
                                  </div>
                                </div>
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="w-4 h-4"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="nutritionInfo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Nutrition Information (Optional)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., Calories: 350, Protein: 15g, Carbs: 45g, Fat: 12g"
                                  className="min-h-20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <Button type="submit" className="btn-primary">
                        {editingProduct ? "Update Product" : "Add Product"}
                      </Button>
                      {editingProduct && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-sm text-muted-foreground">
                              {order.customerName} • {order.phone}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              ₹{Number(order.totalAmount).toLocaleString()}
                            </p>
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                handleOrderStatusUpdate(order.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">
                                  Processing
                                </SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">
                                  Delivered
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div>
                          <p className="text-sm font-medium mb-2">
                            Delivery Address:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.shippingAddress}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Delivery Tracking
                  {activeDeliveries.length > 0 && (
                    <Badge className="bg-blue-500 text-white">
                      {activeDeliveries.length} active
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-muted-foreground">
                  Track delivery partners coming to pick up orders from your
                  store
                </p>
              </CardHeader>
              <CardContent>
                {activeDeliveries.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No active deliveries at the moment
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active Deliveries List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeDeliveries.map((delivery) => (
                        <Card
                          key={delivery.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedDeliveryId === delivery.id
                              ? "border-blue-500 bg-blue-50"
                              : ""
                          }`}
                          onClick={() => setSelectedDeliveryId(delivery.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">
                                  Delivery #{delivery.id}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  delivery.status === "en_route_pickup"
                                    ? "default"
                                    : delivery.status === "assigned"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {delivery.status === "assigned"
                                  ? "Assigned"
                                  : delivery.status === "en_route_pickup"
                                    ? "Coming to Store"
                                    : delivery.status === "picked_up"
                                      ? "Picked Up"
                                      : delivery.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                <span>{delivery.customerName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{delivery.customerPhone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">
                                  {delivery.deliveryAddress}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3" />
                                <span>₹{delivery.totalAmount}</span>
                              </div>
                              {delivery.deliveryPartner && (
                                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-100 rounded">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-blue-700 font-medium">
                                    {delivery.deliveryPartner.name}
                                  </span>
                                  <span className="text-blue-600">
                                    {delivery.deliveryPartner.phone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Map View */}
                    {selectedDeliveryId && (
                      <div className="mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <MapPin className="h-5 w-5" />
                              Live Tracking - Delivery #{selectedDeliveryId}
                            </CardTitle>
                            <p className="text-muted-foreground">
                              Watch the delivery partner's real-time location as
                              they come to your store
                            </p>
                          </CardHeader>
                          <CardContent className="p-0">
                            <DeliveryTrackingMap
                              deliveryId={selectedDeliveryId}
                              userType="shopkeeper"
                            />
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
