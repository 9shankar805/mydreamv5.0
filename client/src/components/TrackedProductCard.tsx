import { Product } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye } from 'lucide-react';
import { useTracking } from '@/lib/tracking';
import { useCart } from '@/hooks/useCart';

interface TrackedProductCardProps {
  product: Product;
  onView?: () => void;
}

export function TrackedProductCard({ product, onView }: TrackedProductCardProps) {
  const { addItem } = useCart();
  const { trackAction } = useTracking();

  const handleView = () => {
    trackAction({
      mode: 'shop',
      itemId: product.id,
      storeId: product.store_id,
      action: 'view',
    });
    
    if (onView) onView();
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      quantity: 1,
      storeId: product.store_id,
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 relative group" onClick={handleView}>
        <img
          src={product.image_url || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-48 object-cover cursor-pointer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.jpg';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button variant="outline" size="icon" className="rounded-full">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex-col items-start">
        <h3 className="font-medium line-clamp-2 cursor-pointer" onClick={handleView}>
          {product.name}
        </h3>
        <p className="text-lg font-semibold text-primary mt-1">
          ${product.price.toFixed(2)}
        </p>
        <Button 
          className="w-full mt-3" 
          size="sm"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
