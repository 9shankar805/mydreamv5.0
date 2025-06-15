import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface RecommendedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  store_id: string;
}

interface RecommendedItemsProps {
  mode: 'shop' | 'food';
  title?: string;
  limit?: number;
  className?: string;
}

export function RecommendedItems({ 
  mode, 
  title = 'Recommended for You',
  limit = 5,
  className = ''
}: RecommendedItemsProps) {
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/recommendations?mode=${mode}&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        toast({
          title: 'Error',
          description: 'Could not load recommendations',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [mode, limit, user, toast]);

  const handleClearHistory = async () => {
    try {
      const response = await fetch('/api/recommendations/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Recommendation history cleared',
        });
        // Refresh recommendations
        setItems([]);
        setLoading(true);
        const newRecs = await fetch(`/api/recommendations?mode=${mode}&limit=${limit}`);
        const data = await newRecs.json();
        setItems(data);
      } else {
        throw new Error('Failed to clear history');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not clear history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Don't show recommendations to non-logged in users
  }

  if (items.length === 0 && !loading) {
    return null; // Don't show anything if no recommendations
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClearHistory}
          disabled={loading}
        >
          Clear History
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading ? (
          // Loading skeletons
          Array(limit).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-40 w-full" />
              </CardContent>
              <CardHeader className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))
        ) : (
          // Actual items
          items.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <img 
                  src={item.image || '/placeholder-product.jpg'} 
                  alt={item.name}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.jpg';
                  }}
                />
              </CardContent>
              <CardFooter className="p-4 flex-col items-start">
                <h3 className="font-medium line-clamp-2">{item.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
