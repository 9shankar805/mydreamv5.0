import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Filter, Grid, List, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProductCard from "@/components/ProductCard";
import { useAppMode } from "@/hooks/useAppMode";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const [location] = useLocation();
  const { mode } = useAppMode();
  const [searchParams, setSearchParams] = useState(new URLSearchParams(location.split('?')[1] || ''));
  const [sortBy, setSortBy] = useState("popularity");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category');

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    setSearchParams(params);
    
    const category = params.get('category');
    if (category) {
      setSelectedCategories([parseInt(category)]);
    }
  }, [location]);

  const { data: products = [], isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", { search: searchQuery, category: categoryQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryQuery) params.append('category', categoryQuery);
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch products: ${response.status} ${errorData}`);
      }
      return response.json();
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories = [], error: categoriesError, refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: 3,
    staleTime: 10 * 60 * 1000,
  });

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Filter by product type based on mode
      if (mode === 'shopping' && product.productType === 'food') return false;
      if (mode === 'food' && product.productType !== 'food') return false;
      
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.categoryId || 0)) {
        return false;
      }
      
      const price = Number(product.price);
      if (priceRange.min && price < Number(priceRange.min)) return false;
      if (priceRange.max && price > Number(priceRange.max)) return false;
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "rating":
          return Number(b.rating) - Number(a.rating);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    setSelectedCategories(prev => 
      checked 
        ? [...prev, categoryId]
        : prev.filter(id => id !== categoryId)
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: "", max: "" });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Categories</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) => 
                  handleCategoryChange(category.id, checked as boolean)
                }
              />
              <Label 
                htmlFor={`category-${category.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Price Range</h4>
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Min price"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Max price"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
          />
        </div>
      </div>

      <Button onClick={clearFilters} variant="outline" className="w-full">
        Clear Filters
      </Button>
    </div>
  );



  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-card rounded-lg p-6 sticky top-20">
              <h3 className="font-bold text-foreground mb-4">Filters</h3>
              <FilterContent />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="bg-card rounded-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {searchQuery ? `Search Results for "${searchQuery}"` : "All Products"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} products
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Mobile Filter */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Customer Rating</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            {productsError ? (
              <div className="bg-card rounded-lg p-12 text-center">
                <Alert className="max-w-md mx-auto mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load products. Please try again.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => refetchProducts()} 
                  variant="outline"
                  disabled={productsLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </div>
            ) : productsLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-2">
                      <div className="bg-gray-200 h-24 rounded-md mb-2"></div>
                      <div className="bg-gray-200 h-3 rounded mb-1"></div>
                      <div className="bg-gray-200 h-2 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-card rounded-lg p-12 text-center">
                <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
                <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
