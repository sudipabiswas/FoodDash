"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, User } from "lucide-react";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, rating, comment }),
      });
      if (res.ok) {
        setComment("");
        setRating(5);
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-20 space-y-12">
      <div className="flex items-center gap-4 border-b pb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-extrabold tracking-tight">Customer Reviews</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Review Form */}
        <div className="lg:col-span-1">
          {(session?.user as any)?.role === "CUSTOMER" ? (
            <div className="bg-card border rounded-[2.5rem] p-8 sticky top-24 shadow-xl shadow-primary/5">
              <h3 className="text-xl font-bold mb-6">Leave a Review</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-muted-foreground block mb-3">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-2 rounded-xl transition-all ${
                          rating >= star ? "text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-200"
                        }`}
                      >
                        <Star className={`h-8 w-8 ${rating >= star ? "fill-yellow-400" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-muted-foreground block mb-3">Your Experience</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked (or didn't)..."
                    className="w-full h-32 p-4 rounded-2xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {submitting ? "Posting..." : <><Send className="h-4 w-4" /> Post Review</>}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-muted/30 border border-dashed rounded-[2.5rem] p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                {session ? "Only customers can leave reviews." : "Please log in as a customer to leave a review."}
              </p>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-muted/20 rounded-[2.5rem] p-12 text-center border border-dashed">
              <p className="text-muted-foreground font-medium">No reviews yet. Be the first to share your experience!</p>
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
    </div>
  );
}
