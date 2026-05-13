"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, User } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
  };
  ownerReply?: string;
}

export default function ReviewSection({ storeId }: { storeId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [storeId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-20 space-y-12">
      <div className="flex items-center gap-4 border-b pb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-extrabold tracking-tight">Customer Reviews</h2>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-muted/20 rounded-[2.5rem] p-12 text-center border border-dashed">
            <p className="text-muted-foreground font-medium">No reviews yet. Be the first to share your experience after ordering!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-card border rounded-[2rem] p-8 hover:shadow-lg transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {review.customer.name?.[0] || review.customer.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{review.customer.name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{review.customer.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        review.rating >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed italic">
                "{review.comment}"
              </p>
              
              <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                <span>Posted {new Date(review.createdAt).toLocaleDateString()}</span>
              </div>

              {review.ownerReply && (
                <div className="mt-6 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                  <p className="text-xs font-extrabold text-primary mb-2 flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> Store Response:
                  </p>
                  <p className="text-sm italic text-muted-foreground">"{review.ownerReply}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
