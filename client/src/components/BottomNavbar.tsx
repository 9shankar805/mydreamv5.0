import { Link, useLocation } from "wouter";
import { Home, Package, Store, User, MapPin, ShoppingCart, Tag, UtensilsCrossed, ChefHat } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppMode } from "@/hooks/useAppMode";
import { cn } from "@/lib/utils";

export default function BottomNavbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { mode } = useAppMode();

  // Role-based navigation items
  const sellerNavItems = [
    {
      href: "/seller/dashboard",
      icon: Home,
      label: "Dashboard",
      active: location.startsWith("/seller/dashboard")
    },
    {
      href: "/seller/store",
      icon: Store,
      label: "Store",
      active: location.startsWith("/seller/store")
    },
    {
      href: "/seller/orders",
      icon: ShoppingCart,
      label: "Orders",
      active: location.startsWith("/seller/orders")
    },
    {
      href: "/seller/inventory",
      icon: Package,
      label: "Inventory",
      active: location.startsWith("/seller/inventory")
    },
    {
      href: "/account",
      icon: User,
      label: "Account",
      active: location.startsWith("/account")
    }
  ];

  const customerNavItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
      active: location === "/"
    },
    ...(mode === 'shopping' ? [
      {
        href: "/products",
        icon: Package,
        label: "Products",
        active: location.startsWith("/products")
      },
      {
        href: "/stores",
        icon: Store,
        label: "Stores",
        active: location.startsWith("/stores")
      },
      {
        href: "/store-maps",
        icon: MapPin,
        label: "Map",
        active: location === "/store-maps"
      }
    ] : [
      {
        href: "/food-categories",
        icon: UtensilsCrossed,
        label: "Menu",
        active: location.startsWith("/food-categories") || location.startsWith("/categories")
      },
      {
        href: "/restaurants",
        icon: ChefHat,
        label: "Restaurants",
        active: location.startsWith("/restaurants")
      },
      {
        href: "/restaurant-maps",
        icon: MapPin,
        label: "Map",
        active: location === "/restaurant-maps"
      }
    ]),
    {
      href: user ? "/account" : "/login",
      icon: User,
      label: "Account",
      active: location.startsWith("/account") || location.startsWith("/customer-dashboard")
    }
  ];

  const navItems = user?.role === "shopkeeper" ? sellerNavItems : customerNavItems;

  // Ensure we always have exactly 5 items
  const getNavItems = () => {
    // If we already have 5 items, return them
    if (navItems.length === 5) return navItems;
    
    // If we have fewer than 5 items, add placeholders
    const items = [...navItems];
    while (items.length < 5) {
      items.push({
        href: "#",
        icon: UtensilsCrossed, // Default icon, will be hidden
        label: "",
        active: false
      });
    }
    return items;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 md:hidden safe-area-inset-bottom">
      <div className="grid grid-cols-5 gap-1 h-16 px-1 pb-safe">
        {getNavItems().map((item, index) => {
          const Icon = item.icon;
          if (item.href === "#") {
            return <div key={index} className="w-full h-full" />;
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg transition-colors p-1",
                item.active
                  ? "text-primary bg-primary/10"
                  : "text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/5"
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] xs:text-xs font-medium text-center leading-tight mt-0.5 px-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}