"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, User } from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/store/stats");
      const data = await res.json();
      if (res.ok) {
        // We might need a more specific API for all reviews, but for now stats returns taking 5.
        // Let's create a specific reviews API for the owner.
        const revRes = await fetch("/api/store/reviews");
        const revData = await revRes.json();
        setReviews(revData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch("/api/store/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, reply: replyText }),
      });
      if (res.ok) {
        setReplyingTo(null);
        setReplyText("");
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Customer Reviews</h1>
        <p className="text-muted-foreground mt-1">Read and respond to your customers' feedback.</p>
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="bg-card border rounded-[2.5rem] p-12 text-center space-y-4">
             <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
             <p className="text-lg font-medium text-muted-foreground">No reviews yet.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-card border rounded-[2.5rem] p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                     </div>
                     <div>
                        <p className="font-bold text-lg">{review.customer?.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="flex gap-1">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                           key={star} 
                           className={`h-5 w-5 ${star <= review.rating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/20"}`} 
                        />
                     ))}
                  </div>
               </div>

               <div className="bg-muted/30 p-6 rounded-2xl italic text-foreground/80 leading-relaxed relative">
                  <span className="absolute -top-3 left-4 text-4xl text-primary/20 font-serif">"</span>
                  {review.comment}
                  <span className="absolute -bottom-8 right-4 text-4xl text-primary/20 font-serif">"</span>
               </div>

               {review.ownerReply ? (
                 <div className="ml-8 mt-4 p-6 bg-primary/5 border border-primary/10 rounded-2xl space-y-2 border-l-4 border-l-primary">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Your Response</p>
                    <p className="text-sm">{review.ownerReply}</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {replyingTo === review.id ? (
                      <div className="space-y-3">
                         <textarea
                            className="w-full p-4 rounded-2xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm"
                            placeholder="Type your reply here..."
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                         />
                         <div className="flex justify-end gap-2">
                            <button 
                               onClick={() => setReplyingTo(null)}
                               className="px-6 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                            >
                               Cancel
                            </button>
                            <button 
                               onClick={() => handleReply(review.id)}
                               className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                            >
                               Send Reply <Send className="h-4 w-4" />
                            </button>
                         </div>
                      </div>
                    ) : (
                      <button 
                         onClick={() => setReplyingTo(review.id)}
                         className="flex items-center gap-2 text-sm font-bold text-primary hover:underline transition-all"
                      >
                         <MessageSquare className="h-4 w-4" /> Reply to this review
                      </button>
                    )}
                 </div>
               )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
