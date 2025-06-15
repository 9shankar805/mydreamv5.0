import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Truck, 
  Bell, 
  User, 
  Menu, 
  X, 
  LogOut, 
  Navigation, 
  Package, 
  DollarSign,
  Clock,
  MapPin,
  Settings,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DeliveryPartnerNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/delivery-partner/dashboard",
      icon: BarChart3,
    },
    {
      label: "Notifications",
      href: "/delivery-partner/notifications", 
      icon: Bell,
      badge: 3, // Mock notification count
    },
    {
      label: "Active Deliveries",
      href: "/delivery-partner/test",
      icon: Package,
      badge: 2, // Mock active deliveries
    },
    {
      label: "Live Tracking",
      href: "/delivery-partner/tracking",
      icon: Navigation,
    },
  ];

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/delivery-partner/dashboard" className="flex items-center space-x-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold">Siraha Delivery</span>
                <div className="text-xs text-blue-100">Partner Portal</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors relative ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-blue-100 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center space-x-4">
            {/* Online Status Indicator */}
            <div className="hidden md:flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Online</span>
            </div>

            {/* Earnings Today */}
            <div className="hidden md:flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-300" />
              <span className="text-sm font-medium">₹425</span>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-white/10">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.fullName || "Delivery Partner"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Online & Available</span>
                  </div>
                </div>
                
                <DropdownMenuItem onClick={() => setLocation("/delivery-partner/dashboard")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setLocation("/delivery-partner/notifications")}>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                  <Badge variant="secondary" className="ml-auto">3</Badge>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setLocation("/delivery-partner/tracking")}>
                  <Navigation className="mr-2 h-4 w-4" />
                  Live Tracking
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <MapPin className="mr-2 h-4 w-4" />
                  Update Location
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Status Indicators */}
              <div className="flex items-center justify-between px-3 py-2 bg-white/10 rounded-lg mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-300" />
                  <span className="text-sm font-medium">₹425 today</span>
                </div>
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
              
              <div className="border-t border-white/20 pt-3 mt-3">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}