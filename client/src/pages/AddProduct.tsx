import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, Camera, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  categoryId: z.number().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  originalPrice: z.string().optional(),
  stock: z.number().min(0, "Stock cannot be negative"),
  images: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  productType: z.enum(["retail", "food"]).default("retail"),
  // Food-specific fields
  preparationTime: z.string().optional(),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  spiceLevel: z.string().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  nutritionInfo: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Store {
  id: number;
  name: string;
  storeType: string;
}

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [newAllergen, setNewAllergen] = useState("");

  // Categories query
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Store query to get current store info
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: [`/api/stores/owner`, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/stores/owner/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch stores');
      return response.json();
    },
    enabled: !!user,
  });

  const currentStore = stores[0]; // Assuming one store per shopkeeper
  const isRestaurant = currentStore?.storeType === 'restaurant';
  const defaultProductType = isRestaurant ? 'food' : 'retail';

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      categoryId: 1,
      description: "",
      price: "",
      originalPrice: "",
      stock: 0,
      images: [],
      imageUrl: "",
      productType: defaultProductType,
      preparationTime: "",
      ingredients: [],
      allergens: [],
      spiceLevel: "",
      isVegetarian: false,
      isVegan: false,
      nutritionInfo: "",
    },
  });

  const watchImageUrl = form.watch("imageUrl");
  const watchProductType = form.watch("productType");

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      const updated = [...ingredients, newIngredient.trim()];
      setIngredients(updated);
      form.setValue("ingredients", updated);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    const updated = ingredients.filter(i => i !== ingredient);
    setIngredients(updated);
    form.setValue("ingredients", updated);
  };

  const handleAddAllergen = () => {
    if (newAllergen.trim() && !allergens.includes(newAllergen.trim())) {
      const updated = [...allergens, newAllergen.trim()];
      setAllergens(updated);
      form.setValue("allergens", updated);
      setNewAllergen("");
    }
  };

  const handleRemoveAllergen = (allergen: string) => {
    const updated = allergens.filter(a => a !== allergen);
    setAllergens(updated);
    form.setValue("allergens", updated);
  };

  const handleAddImage = () => {
    const imageUrl = form.getValues("imageUrl");
    if (imageUrl && imageUrl.trim()) {
      const currentImages = form.getValues("images");
      if (!currentImages.includes(imageUrl.trim()) && currentImages.length < 6) {
        form.setValue("images", [...currentImages, imageUrl.trim()]);
        form.setValue("imageUrl", "");
      }
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    const currentImages = form.getValues("images");
    form.setValue("images", currentImages.filter(img => img !== imageUrl));
  };

  const onSubmit = async (data: ProductForm) => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "Please create a store first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        ...data,
        storeId: currentStore.id,
        ingredients,
        allergens,
        productType: isRestaurant ? 'food' : data.productType,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const successMessage = isRestaurant ? "Menu item added successfully!" : "Product added successfully!";
      toast({ title: successMessage });
      
      // Invalidate all relevant queries to refresh inventory data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/products/store/${currentStore.id}`] }),
        queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/products/store", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["/api/seller/inventory", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["/api/seller/dashboard", user?.id] })
      ]);
      
      // Navigate back to inventory
      setLocation("/seller/inventory");
    } catch (error) {
      toast({
        title: "Error",
        description: isRestaurant ? "Failed to add menu item" : "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'shopkeeper') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You need to be a shopkeeper to add products.
            </p>
            <div className="mt-4 text-center">
              <Link href="/" className="text-primary hover:underline">
                Go back to homepage
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Store Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              You need to create a store before adding products.
            </p>
            <div className="flex justify-center">
              <Link href="/seller/store">
                <Button>Create Store</Button>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <Link href="/seller/inventory">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRestaurant ? 'Add New Menu Item' : 'Add New Product'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isRestaurant ? 'Add items to your restaurant menu' : 'Add products to your store inventory'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        {isRestaurant ? 'Menu Item Name *' : 'Product Name *'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={isRestaurant ? "Enter menu item name" : "Enter product name"} 
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Type (for mixed stores) */}
                {!isRestaurant && (
                  <FormField
                    control={form.control}
                    name="productType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Product Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select product type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="retail">Retail Product</SelectItem>
                            <SelectItem value="food">Food Item</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Category *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Electronics" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product description" 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price and Original Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Price *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="h-11"
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
                        <FormLabel className="text-base font-medium">Original Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Stock Quantity */}
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        {isRestaurant || watchProductType === 'food' ? 'Available Quantity *' : 'Stock Quantity *'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          className="h-11"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Food-specific fields */}
                {(isRestaurant || watchProductType === 'food') && (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Food Item Details</h3>
                    
                    {/* Preparation Time */}
                    <FormField
                      control={form.control}
                      name="preparationTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Preparation Time</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 15-20 mins" 
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Spice Level */}
                    <FormField
                      control={form.control}
                      name="spiceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Spice Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select spice level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hot">Hot</SelectItem>
                              <SelectItem value="extra-hot">Extra Hot</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dietary Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isVegetarian"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Vegetarian</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Contains no meat
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={field.value}
                                onChange={field.onChange}
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
                              <FormLabel className="text-base">Vegan</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                No animal products
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Ingredients */}
                    <div className="space-y-4">
                      <FormLabel className="text-base font-medium">Ingredients</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add ingredient"
                          value={newIngredient}
                          onChange={(e) => setNewIngredient(e.target.value)}
                          className="h-11 flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleAddIngredient}
                          className="h-11"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      {ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {ingredients.map((ingredient, index) => (
                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {ingredient}
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(ingredient)}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Allergens */}
                    <div className="space-y-4">
                      <FormLabel className="text-base font-medium">Allergens</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add allergen"
                          value={newAllergen}
                          onChange={(e) => setNewAllergen(e.target.value)}
                          className="h-11 flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergen())}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleAddAllergen}
                          className="h-11"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      {allergens.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {allergens.map((allergen, index) => (
                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {allergen}
                              <button
                                type="button"
                                onClick={() => handleRemoveAllergen(allergen)}
                                className="ml-2 text-red-600 hover:text-red-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Nutrition Info */}
                    <FormField
                      control={form.control}
                      name="nutritionInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Nutrition Information</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., Calories: 350, Protein: 15g, Carbs: 45g, Fat: 12g" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Product Images */}
                <div className="space-y-4">
                  <FormLabel className="text-base font-medium">Product Images (1-6 images)</FormLabel>
                  
                  {/* Image Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex space-x-4">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Upload className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Upload</span>
                        </div>
                        
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Camera className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Camera</span>
                        </div>
                        
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-300">URL</span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">URL</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Click to select images from your device
                      </p>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Auto-compressed to ~200KB for optimal performance
                      </p>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder="Enter image URL" 
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddImage}
                      disabled={!watchImageUrl || !watchImageUrl.trim()}
                      className="h-11"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {/* Image Preview */}
                  {form.watch("images").length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {form.watch("images").map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={imageUrl} 
                            alt={`Product ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(imageUrl)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (isRestaurant ? "Adding Menu Item..." : "Adding Product...") 
                    : (isRestaurant ? "Add Menu Item" : "Add Product")
                  }
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}