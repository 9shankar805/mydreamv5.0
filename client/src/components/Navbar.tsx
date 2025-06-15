import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, X, Store, Heart, MapPin, Shield, Home, Package, LogOut, Tag, UtensilsCrossed, ChefHat, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useAppMode } from "@/hooks/useAppMode";
import SearchWithSuggestions from "@/components/SearchWithSuggestions";
import NotificationCenter from "@/components/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { mode, setMode } = useAppMode();

  const cartItemCount = cartItems?.length || 0;

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-14">
          {/* Logo and Mode Swiper */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-1">
              {mode === 'food' ? (
                <img 
                  src="/assets/icon1.png" 
                  alt="Food Delivery" 
                  className="h-8 w-auto rounded-lg"
                />
              ) : (
                <img 
                  src="/assets/icon2.png" 
                  alt="Shop" 
                  className="h-8 w-auto rounded-lg"
                />
              )}
            </Link>

            {/* Compact Mode Swiper */}
            {user?.role !== "shopkeeper" && (
              <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                <div className="flex">
                  <button
                    onClick={() => setMode('shopping')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      mode === 'shopping' 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Shop</span>
                  </button>
                  <button
                    onClick={() => setMode('food')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      mode === 'food' 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    <span>Food</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            {/* Seller Navigation */}
            {user?.role === "shopkeeper" ? (
              <>
                <Link href="/seller/dashboard" className="flex items-center space-x-1 hover:text-accent transition-colors">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/seller/store" className="flex items-center space-x-1 hover:text-accent transition-colors">
                  <Store className="h-4 w-4" />
                  <span>Store</span>
                </Link>
                <Link href="/seller/orders" className="flex items-center space-x-1 hover:text-accent transition-colors">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Orders</span>
                </Link>
                <Link href="/seller/inventory" className="flex items-center space-x-1 hover:text-accent transition-colors">
                  <Package className="h-4 w-4" />
                  <span>Inventory</span>
                </Link>
                <Link href="/seller/promotions" className="flex items-center space-x-1 hover:text-accent transition-colors">
                  <Tag className="h-4 w-4" />
                  <span>Promotions</span>
                </Link>
                <Link href="/account" className="flex items-center space-x-1 hover:text-accent transition-colors">
                  <User className="h-4 w-4" />
                  <span>Account</span>
                </Link>
              </>
            ) : (
              /* Customer Navigation - Dynamic based on mode */
              <>
                <Link href="/" className="flex items-center space-x-1 hover:text-accent transition-colors">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>

                {mode === 'shopping' ? (
                  <>
                    <Link href="/products" className="flex items-center space-x-1 hover:text-accent transition-colors">
                      <Package className="h-4 w-4" />
                      <span>Products</span>
                    </Link>
                    <Link href="/stores" className="flex items-center space-x-1 hover:text-accent transition-colors">
                      <Store className="h-4 w-4" />
                      <span>Stores</span>
                    </Link>
                    <Link href="/store-maps" className="flex items-center space-x-1 hover:text-accent transition-colors">
                      <MapPin className="h-4 w-4" />
                      <span>Store Map</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/food-categories" className="flex items-center space-x-1 hover:text-accent transition-colors">
                      <UtensilsCrossed className="h-4 w-4" />
                      <span>Menu</span>
                    </Link>
                    <Link href="/restaurants" className="flex items-center space-x-1 hover:text-accent transition-colors">
                      <ChefHat className="h-4 w-4" />
                      <span>Restaurants</span>
                    </Link>
                    <Link href="/restaurant-maps" className="flex items-center space-x-1 hover:text-accent transition-colors">
                      <MapPin className="h-4 w-4" />
                      <span>Restaurant Map</span>
                    </Link>
                  </>
                )}

                {user && (
                  <Link href="/customer-dashboard" className="flex items-center space-x-1 hover:text-accent transition-colors">
                    <User className="h-4 w-4" />
                    <span>Account</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex max-w-sm mx-4">
            {user?.role === "shopkeeper" ? (
              <SearchWithSuggestions placeholder="Search your products, orders..." />
            ) : (
              <SearchWithSuggestions 
                placeholder={mode === 'shopping' ? "Search products and stores..." : "Search food and restaurants..."} 
              />
            )}
          </div>

          {/* Top Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Customer Actions (Cart & Wishlist) */}
            {user?.role !== "shopkeeper" && (
              <>
                {/* Cart */}
                <Link href="/cart" className="relative hover:text-accent transition-colors p-2">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                {/* Wishlist */}
                <Link href="/wishlist" className="hover:text-accent transition-colors p-2">
                  <Heart className="h-5 w-5" />
                </Link>
              </>
            )}

            {/* User Menu or Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2">
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    
                    {user.role === "shopkeeper" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/seller/dashboard" className="flex items-center cursor-pointer">
                            <Home className="mr-2 h-4 w-4" />
                            Seller Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/seller/inventory" className="flex items-center cursor-pointer">
                            <Package className="mr-2 h-4 w-4" />
                            Inventory
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/seller/orders" className="flex items-center cursor-pointer">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/seller/promotions" className="flex items-center cursor-pointer">
                            <Tag className="mr-2 h-4 w-4" />
                            Promotions
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {process.env.NODE_ENV === 'development' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/test/notifications" className="flex items-center cursor-pointer">
                            <span className="text-xs">Test Notifications</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="flex items-center cursor-pointer text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-white hover:text-accent">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="text-white border-white hover:bg-white hover:text-primary">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Action Icons */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Cart & Wishlist - Only for customers */}
            {user?.role !== "shopkeeper" && (
              <>
                {/* Cart */}
                <Link href="/cart" className="relative hover:text-accent transition-colors p-1">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                {/* Wishlist */}
                <Link href="/wishlist" className="hover:text-accent transition-colors p-1">
                  <Heart className="h-5 w-5" />
                </Link>
              </>
            )}

            {user ? (
              <>
                {/* Seller-specific mobile navigation */}
                {user.role === "shopkeeper" && (
                  <>
                    <Link href="/seller/dashboard" className="hover:text-accent transition-colors p-1">
                      <Home className="h-5 w-5" />
                    </Link>
                    <Link href="/seller/inventory" className="hover:text-accent transition-colors p-1">
                      <Package className="h-5 w-5" />
                    </Link>
                    <Link href="/seller/orders" className="hover:text-accent transition-colors p-1">
                      <ShoppingCart className="h-5 w-5" />
                    </Link>
                  </>
                )}

                {/* Customer mobile navigation */}
                {user.role !== "shopkeeper" && (
                  <Link href="/customer-dashboard" className="hover:text-accent transition-colors p-1">
                    <User className="h-5 w-5" />
                  </Link>
                )}

                {/* Admin Panel - for all users who might have admin access */}
                <Link href="/admin" className="hover:text-accent transition-colors p-1">
                  <Shield className="h-5 w-5" />
                </Link>

                {/* Logout */}
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-accent p-1"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link href="/login" className="hover:text-accent transition-colors p-1">
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <SearchWithSuggestions placeholder="Search products, stores..." />
        </div>
      </div>
    </nav>
  );
}