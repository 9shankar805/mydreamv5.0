import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAppMode } from "@/hooks/useAppMode";

export default function Categories() {
  const { mode } = useAppMode();

  const shoppingCategories = [
    { name: "Electronics", icon: "📱", href: "/products?category=4" },
    { name: "Clothing", icon: "👕", href: "/products?category=5" },
    { name: "Books", icon: "📚", href: "/products?category=6" },
    { name: "Sports", icon: "⚽", href: "/products?category=7" },
    { name: "Beauty", icon: "💄", href: "/products?category=8" },
    { name: "Toys", icon: "🧸", href: "/products?category=9" },
    { name: "Health", icon: "🏥", href: "/products?category=10" },
    { name: "Automotive", icon: "🚗", href: "/products?category=11" },
    { name: "Garden", icon: "🌱", href: "/products?category=12" },
    { name: "Groceries", icon: "🛒", href: "/products?category=2" },
    { name: "Fancy Items", icon: "💎", href: "/products?category=3" },
  ];

  const foodCategories = [
    { name: "Indian Cuisine", icon: "🍛", href: "/products?category=food&cuisine=indian" },
    { name: "Chinese", icon: "🥢", href: "/products?category=food&cuisine=chinese" },
    { name: "Fast Food", icon: "🍔", href: "/products?category=food&cuisine=fast-food" },
    { name: "Italian", icon: "🍝", href: "/products?category=food&cuisine=italian" },
    { name: "Mexican", icon: "🌮", href: "/products?category=food&cuisine=mexican" },
    { name: "Continental", icon: "🍽️", href: "/products?category=food&cuisine=continental" },
    { name: "Desserts & Sweets", icon: "🍰", href: "/products?category=food&cuisine=desserts" },
    { name: "Beverages", icon: "🥤", href: "/products?category=food&cuisine=beverages" },
    { name: "Pizza", icon: "🍕", href: "/products?category=food&type=pizza" },
    { name: "Biryani", icon: "🍚", href: "/products?category=food&type=biryani" },
    { name: "Snacks", icon: "🍿", href: "/products?category=food&type=snacks" },
    { name: "Healthy Food", icon: "🥗", href: "/products?category=food&type=healthy" },
  ];

  const categories = mode === 'shopping' ? shoppingCategories : foodCategories;
  const pageTitle = mode === 'shopping' ? 'All Categories' : 'Food Menu';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
        </div>
        
        <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-4">
          {categories.map((category) => (
            <Link key={category.name} href={category.href}>
              <div className="category-card text-center hover:shadow-lg transition-shadow p-2 sm:p-4">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{category.icon}</div>
                <div className="text-xs sm:text-sm font-semibold text-foreground">{category.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}