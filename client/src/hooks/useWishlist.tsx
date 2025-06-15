import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { WishlistItem, Product } from "@shared/schema";

interface WishlistItemWithProduct extends WishlistItem {
  product?: Product;
}

interface WishlistContextType {
  wishlistItems: WishlistItemWithProduct[];
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (wishlistItemId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  totalItems: number;
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const items = await apiGet<WishlistItem[]>(`/api/wishlist/${user.id}`);
      
      // Fetch product details for each wishlist item
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          try {
            const product = await apiGet<Product>(`/api/products/${item.productId}`);
            return { ...item, product };
          } catch (error) {
            return item;
          }
        })
      );
      
      setWishlistItems(itemsWithProducts);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToWishlist = async (productId: number) => {
    if (!user) return;
    
    try {
      await apiPost("/api/wishlist", {
        userId: user.id,
        productId
      });
      await fetchWishlist();
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
    }
  };

  const removeFromWishlist = async (wishlistItemId: number) => {
    try {
      await apiDelete(`/api/wishlist/${wishlistItemId}`);
      await fetchWishlist();
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
    }
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.some(item => item.productId === productId);
  };

  const toggleWishlist = async (productId: number) => {
    const existingItem = wishlistItems.find(item => item.productId === productId);
    
    if (existingItem) {
      await removeFromWishlist(existingItem.id);
    } else {
      await addToWishlist(productId);
    }
  };

  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const totalItems = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        totalItems,
        isLoading,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}