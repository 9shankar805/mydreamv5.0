import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ThumbsUp, User, Calendar, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Review {
  id: number;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  customer?: {
    id: number;
    username: string;
    fullName: string;
  };
}

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    title: "",
    comment: ""
  });
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["/api/products", productId, "reviews", { minRating: filterRating }],
    queryFn: () => 
      fetch(`/api/products/${productId}/reviews${filterRating ? `?minRating=${filterRating}` : ""}`)
        .then(res => res.json())
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData: any) => 
      apiRequest("/api/reviews", {
        method: "POST",
        body: JSON.stringify(reviewData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
      setShowReviewForm(false);
      setReviewData({ rating: 0, title: "", comment: "" });
      toast({
        title: "Review submitted",
        description: "Your review has been posted successfully!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive"
      });
    }
  });

  const handleSubmitReview = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to submit a review",
        variant: "destructive"
      });
      return;
    }

    if (reviewData.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide a rating",
        variant: "destructive"
      });
      return;
    }

    createReviewMutation.mutate({
      productId,
      customerId: user.id,
      rating: reviewData.rating,
      title: reviewData.title || null,
      comment: reviewData.comment || null
    });
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter((review: Review) => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter((review: Review) => review.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  // Check if current user already reviewed this product
  const userHasReviewed = user && reviews.some((review: Review) => review.customer?.id === user.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} readonly size="lg" className="justify-center mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {ratingCounts.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={filterRating === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRating(null)}
            >
              All Reviews
            </Button>
            {[5, 4, 3, 2, 1].map(rating => (
              <Button
                key={rating}
                variant={filterRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRating(rating)}
              >
                {rating} Star{rating !== 1 ? 's' : ''}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Write Review Section */}
      {user && !userHasReviewed && (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            {!showReviewForm ? (
              <Button onClick={() => setShowReviewForm(true)}>
                Write a Review
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Rating *
                  </label>
                  <StarRating
                    rating={reviewData.rating}
                    onRatingChange={(rating) => setReviewData(prev => ({ ...prev, rating }))}
                    size="lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Review Title (Optional)
                  </label>
                  <Input
                    placeholder="Summarize your review..."
                    value={reviewData.title}
                    onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Review (Optional)
                  </label>
                  <Textarea
                    placeholder={`Share your thoughts about ${productName}...`}
                    value={reviewData.comment}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={createReviewMutation.isPending || reviewData.rating === 0}
                  >
                    {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewData({ rating: 0, title: "", comment: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Reviews */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No reviews yet. Be the first to review this product!
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review: Review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {review.customer?.fullName || review.customer?.username || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        {new Date(review.createdAt).toLocaleDateString()}
                        {review.isVerifiedPurchase && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <StarRating rating={review.rating} readonly size="sm" />
                </div>

                {review.title && (
                  <h4 className="font-medium text-lg mb-2">{review.title}</h4>
                )}

                {review.comment && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {review.comment}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <ThumbsUp className="h-4 w-4" />
                    Helpful ({review.helpfulCount})
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}