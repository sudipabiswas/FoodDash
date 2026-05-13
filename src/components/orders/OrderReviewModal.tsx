"use client";

import { useState } from "react";
import { Star, X, Send } from "lucide-react";

interface OrderReviewModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderReviewModal({ order, onClose, onSuccess }: OrderReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          rating,
          comment
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit review");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-[2.5rem] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b bg-muted/30 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Rate your Order</h2>
            <p className="text-sm text-muted-foreground mt-1">How was your meal from {order.store?.name}?</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Overall Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-2xl transition-all ${
                    rating >= star ? "text-yellow-400 scale-110" : "text-muted-foreground/20 hover:text-yellow-200"
                  }`}
                >
                  <Star className={`h-10 w-10 ${rating >= star ? "fill-yellow-400" : ""}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Experience</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you liked (or didn't)..."
              className="w-full h-32 p-6 rounded-3xl border bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none shadow-inner"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-muted text-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {submitting ? "Posting..." : <><Send className="h-4 w-4" /> Post Review</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
