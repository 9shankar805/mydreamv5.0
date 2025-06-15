import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "./useAuth";
import type { CartItem, Product } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product?: Product;
}

interface CartContextType {
  cartItems: CartItemWithProduct[];
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateCartItem: (cartItemId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalAmount: number;
  totalItems: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const { user } = useAuth();

  const refreshCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart/${user.id}`);
      if (response.ok) {
        const items = await response.json();
        setCartItems(items);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addToCart = async (productId: number, quantity: number) => {
    if (!user) {
      throw new Error("Please login to add items to cart");
    }

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        productId,
        quantity,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add item to cart");
    }

    await refreshCart();
  };

  const updateCartItem = async (cartItemId: number, quantity: number) => {
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error("Failed to update cart item");
    }

    await refreshCart();
  };

  const removeFromCart = async (cartItemId: number) => {
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to remove item from cart");
    }

    await refreshCart();
  };

  const clearCart = async () => {
    if (!user) return;

    const response = await fetch(`/api/cart/user/${user.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to clear cart");
    }

    await refreshCart();
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    if (item.product) {
      return sum + (Number(item.product.price) * item.quantity);
    }
    return sum;
  }, 0);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      totalAmount,
      totalItems,
      isLoading,
      refreshCart,
      deliveryFee,
      setDeliveryFee,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
