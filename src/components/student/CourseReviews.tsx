"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  student: { full_name: string; avatar_url: string | null } | null;
}

interface Props {
  courseId: string;
  isEnrolled: boolean;
}

function StarRow({ value, onChange, size = "md" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={cn("transition-colors", !onChange && "cursor-default")}
        >
          <Star
            className={cn(
              size === "sm" ? "h-3.5 w-3.5" : "h-6 w-6",
              star <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-slate-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function CourseReviews({ courseId, isEnrolled }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [myReview, setMyReview] = useState<{ id: string; rating: number; review: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = async () => {
    const res = await fetch(`/api/reviews?courseId=${courseId}`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setAvgRating(data.avgRating);
      setTotalReviews(data.totalReviews ?? 0);
      if (data.myReview) {
        setMyReview(data.myReview);
        setRating(data.myReview.rating);
        setReviewText(data.myReview.review ?? "");
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [courseId]);

  const handleSubmit = async () => {
    if (!rating) { toast.error("Please select a star rating"); return; }
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, rating, review: reviewText.trim() || null }),
    });
    if (res.ok) {
      toast.success(myReview ? "Review updated!" : "Review submitted!");
      setShowForm(false);
      fetchReviews();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Failed to submit review");
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/reviews?courseId=${courseId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Review removed");
      setMyReview(null);
      setRating(0);
      setReviewText("");
      fetchReviews();
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Student Reviews</h2>
        {avgRating && (
          <div className="flex items-center gap-2">
            <StarRow value={Math.round(avgRating)} size="sm" />
            <span className="text-sm font-bold text-amber-400">{avgRating}</span>
            <span className="text-sm text-slate-500">({totalReviews})</span>
          </div>
        )}
      </div>

      {/* My review / write form */}
      {isEnrolled && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          {myReview && !showForm ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-300">Your review</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Edit
                  </button>
                  <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
              <StarRow value={myReview.rating} size="sm" />
              {myReview.review && <p className="text-sm text-slate-400">{myReview.review}</p>}
            </div>
          ) : showForm || !myReview ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-300">
                {myReview ? "Edit your review" : "Rate this course"}
              </p>
              <StarRow value={rating} onChange={setRating} />
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience (optional)"
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !rating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {myReview ? "Update" : "Submit Review"}
                </button>
                {showForm && (
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-600 italic text-center py-6">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                    {(r.student?.full_name ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.student?.full_name ?? "Student"}</p>
                    <p className="text-xs text-slate-500">{timeAgo(r.created_at)}</p>
                  </div>
                </div>
                <StarRow value={r.rating} size="sm" />
              </div>
              {r.review && <p className="text-sm text-slate-400 leading-relaxed">{r.review}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
