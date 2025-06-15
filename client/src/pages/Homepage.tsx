import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Star, MapPin, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProductCard from "@/components/ProductCard";
import StoreCard from "@/components/StoreCard";
import { useAuth } from "@/hooks/useAuth";
import { useAppMode } from "@/hooks/useAppMode";
import type { Product, Store } from "@shared/schema";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { useEffect, useRef, useState } from "react";

// Countdown Timer Component
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    // Calculate time until next 3-day interval
    const calculateTimeLeft = () => {
      const now = new Date();
      // Get days since epoch to calculate 3-day cycle
      const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
      const daysInCurrentCycle = daysSinceEpoch % 3; // 0, 1, or 2
      const daysLeft = 2 - daysInCurrentCycle; // Days left in current 3-day cycle
      
      // Calculate hours, minutes, seconds left in current day
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      // If it's the last day of the cycle, calculate time until midnight
      if (daysLeft === 0) {
        const diff = endOfDay.getTime() - now.getTime();
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft({
          days: 0,
          hours,
          minutes,
          seconds
        });
      } else {
        // For other days, just show full days until reset
        setTimeLeft({
          days: daysLeft,
          hours: 23 - now.getHours(),
          minutes: 59 - now.getMinutes(),
          seconds: 59 - now.getSeconds()
        });
      }
    };

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial call

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center min-w-[60px] sm:min-w-[80px]">
        <div className="text-2xl sm:text-4xl font-bold text-white">
          {timeLeft.days.toString().padStart(2, '0')}
        </div>
        <div className="text-xs sm:text-sm opacity-80">Days</div>
      </div>
      <div className="text-2xl sm:text-4xl font-bold text-white">:</div>
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center min-w-[60px] sm:min-w-[80px]">
        <div className="text-2xl sm:text-4xl font-bold text-white">
          {timeLeft.hours.toString().padStart(2, '0')}
        </div>
        <div className="text-xs sm:text-sm opacity-80">Hours</div>
      </div>
      <div className="text-2xl sm:text-4xl font-bold text-white">:</div>
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center min-w-[60px] sm:min-w-[80px]">
        <div className="text-2xl sm:text-4xl font-bold text-white">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-xs sm:text-sm opacity-80">Minutes</div>
      </div>
      <div className="text-2xl sm:text-4xl font-bold text-white">:</div>
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center min-w-[60px] sm:min-w-[80px]">
        <div className="text-2xl sm:text-4xl font-bold text-white">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-xs sm:text-sm opacity-80">Seconds</div>
      </div>
    </div>
  );
};

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

// Slider image paths - using direct paths from public directory
const slider1 = '/assets/slider2.jpg';
const slider2 = '/assets/slider1.jpg';
const slider3 = '/assets/slide3.jpg'; // Using slider2 as fallback for slider3


export default function Homepage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { mode } = useAppMode();

  // Redirect sellers to their dashboard
  useEffect(() => {
    if (!isLoading && user?.role === "shopkeeper") {
      setLocation("/seller/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const shoppingCategories = [
    { name: "Electronics", icon: "📱", href: "/products?category=4" },
    { name: "Clothing", icon: "👕", href: "/products?category=5" },
    { name: "Home & Garden", icon: "🏠", href: "/products?category=3" },
    { name: "Books", icon: "📚", href: "/products?category=6" },
  ];

  const foodCategories = [
    { name: "Indian Cuisine", icon: "🍛", href: "/products?category=food&cuisine=indian" },
    { name: "Fast Food", icon: "🍔", href: "/products?category=food&cuisine=fast-food" },
    { name: "Pizza", icon: "🍕", href: "/products?category=food&type=pizza" },
    { name: "Desserts", icon: "🍰", href: "/products?category=food&cuisine=desserts" },
  ];

  const categories = mode === 'shopping' ? shoppingCategories : foodCategories;
  
  const { data: products, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: stores, isLoading: storesLoading, error: storesError, refetch: refetchStores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Slider data
  const slides = [
    {
      id: 1,
      title: 'From Click to Doorstep — In Just One Hour',
      description: 'Shop fast. Get it faster.',
      buttonText: 'Shop Now',
      url: '/products',
      image: slider1,
      overlay: 'rgba(0, 0, 0, 0.4)'
    },
    {
      id: 2,
      title: 'Hot & Fresh – Tasty Food at Your Doorstep',
      description: 'Delicious meals delivered fast',
      buttonText: 'Order Now',
      url: '/restaurants',
      image: slider2,
      overlay: 'rgba(0, 0, 0, 0.4)'
    },
    {
      id: 3,
      title: 'Flash Sale! Limited Time Offer',
      description: 'Hurry! These deals end in',
      buttonText: 'Shop Now',
      url: '/flash-sale',
      image: slider3,
      overlay: 'rgba(0, 0, 0, 0.5)',
      showTimer: true
    }
  ];

  // Enhanced error logging with more context
  if (productsError) {
    console.error("Products loading failed:", {
      error: productsError,
      message: productsError instanceof Error ? productsError.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
  if (storesError) {
    console.error("Stores loading failed:", {
      error: storesError,
      message: storesError instanceof Error ? storesError.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
  if (products) console.log("Products loaded:", products.length);
  if (stores) console.log("Stores loaded:", stores.length);

  const featuredProducts = products?.filter(product => mode === 'shopping' ? product.productType !== 'food' : product.productType === 'food').slice(0, 6) || [];
  const popularStores = stores?.filter(store => mode === 'shopping' ? store.storeType !== 'restaurant' : store.storeType === 'restaurant').slice(0, 4) || [];

  // Error handling component for products
  const ProductsErrorState = () => (
    <div className="text-center py-12">
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load products. Please try again.
        </AlertDescription>
      </Alert>
      <Button 
        onClick={() => refetchProducts()} 
        variant="outline" 
        className="mt-4"
        disabled={productsLoading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`} />
        Retry
      </Button>
    </div>
  );

  // Loading state component for products
  const ProductsLoadingState = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-4">
            <div className="bg-gray-200 h-32 rounded-md mb-3"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 rounded w-3/4"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Error handling component for stores
  const StoresErrorState = () => (
    <div className="text-center py-12">
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load stores. Please try again.
        </AlertDescription>
      </Alert>
      <Button 
        onClick={() => refetchStores()} 
        variant="outline" 
        className="mt-4"
        disabled={storesLoading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${storesLoading ? 'animate-spin' : ''}`} />
        Retry
      </Button>
    </div>
  );

  // Loading state component for stores
  const StoresLoadingState = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-6">
            <div className="bg-gray-200 h-24 rounded-md mb-4"></div>
            <div className="bg-gray-200 h-5 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 rounded w-2/3 mb-2"></div>
            <div className="bg-gray-200 h-3 rounded w-1/2"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Slider Section */}
      <section className="relative w-full h-[50vh] min-h-[300px]">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{ 
            clickable: true,
            el: '.swiper-pagination',
            type: 'bullets',
          }}
          autoplay={{ 
            delay: 4000, 
            disableOnInteraction: false 
          }}
          className="h-full w-full m-0 p-0"
          style={{
            '--swiper-navigation-color': '#ffffff',
            '--swiper-pagination-color': '#ffffff',
            '--swiper-pagination-bullet-inactive-color': 'rgba(255, 255, 255, 0.5)',
            '--swiper-pagination-bullet-inactive-opacity': '1',
            '--swiper-pagination-bullet-size': '10px',
            '--swiper-pagination-bullet-horizontal-gap': '6px',
          }}
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div 
                className="relative w-full h-full flex items-center justify-center p-0 m-0"
                style={{
                  background: `url(${slide.image}) center/cover no-repeat`,
                  position: 'relative',
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40"></div>
                
                {/* Content */}
                <div className="relative z-10 max-w-4xl px-4 sm:px-6 lg:px-8 text-center text-white">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
                    {slide.title}
                  </h1>
                  <p className="text-lg sm:text-xl mb-6 opacity-90 max-w-2xl mx-auto drop-shadow">
                    {slide.description}
                  </p>
                  {slide.showTimer && <CountdownTimer />}
                  <Link href={slide.url} className="mt-6 inline-block">
                    <Button 
                      size="lg" 
                      className="bg-white text-gray-900 hover:bg-gray-100 text-base sm:text-lg px-8 py-6 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      {slide.buttonText}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
          
          {/* Custom pagination */}
          <div className="swiper-pagination !bottom-6"></div>
          
          {/* Navigation buttons */}
          <div className="swiper-button-next after:hidden">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="swiper-button-prev after:hidden">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>
        </Swiper>
      </section>

      {/* Categories/Menu Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-10 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {mode === 'shopping' ? 'Categories' : 'Menu'}
            </h2>
            <Link href={mode === 'shopping' ? "/categories" : "/food-categories"}>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-8 h-8 p-0">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={category.href}>
                <div className="category-card flex items-center gap-2 p-2 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow min-h-[60px]">
                  <div className="text-xs sm:text-sm font-semibold text-foreground flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{category.name}</div>
                  <div className="text-lg sm:text-2xl flex-shrink-0">{category.icon}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 sm:py-12 lg:py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-10 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Products</h2>
            <Link href="/products">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-8 h-8 p-0">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
          {productsError ? (
            <ProductsErrorState />
          ) : productsLoading ? (
            <ProductsLoadingState />
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No featured products available at the moment</p>
              <p className="text-muted-foreground text-sm mt-2">Check back later for new arrivals</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              {featuredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Stores */}
      <section className="py-8 sm:py-12 lg:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-10 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Stores</h2>
            <Link href="/stores">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-8 h-8 p-0">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
          {storesError ? (
            <StoresErrorState />
          ) : storesLoading ? (
            <StoresLoadingState />
          ) : popularStores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No stores available at the moment</p>
              <p className="text-muted-foreground text-sm mt-2">Check back later for new stores</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {popularStores.map((store: any) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Flash Deals Banner */}
      <section className="py-8 bg-accent">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">⚡ Flash Deals - Up to 50% Off!</h2>
            <p className="text-lg mb-4">Limited time offers on selected products</p>
            <Link href="/products">
              <Button variant="outline" className="bg-white text-accent hover:bg-gray-100">
                Shop Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
