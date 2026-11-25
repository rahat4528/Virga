"use client"

import { useState } from "react"
import { Star, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ReviewItem {
  _id?: string
  authorName: string
  rating: number
  title?: string
  comment: string
  isVerifiedPurchase?: boolean
  addedAt?: string
}

interface ItemReviewsProps {
  itemId: string
  ratingStats: { avg: number; total: number }
  initialReviews?: ReviewItem[]
}

export function ItemReviews({ itemId, ratingStats, initialReviews = [] }: ItemReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews)
  const [stats, setStats] = useState(ratingStats)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authorName, setAuthorName] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim() || !authorName.trim()) {
      toast.error("Please provide your name and review comment")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          authorName: authorName.trim(),
          rating,
          comment: comment.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to submit review")
        return
      }

      setReviews([data.item, ...reviews])
      if (data.ratingStats) {
        setStats(data.ratingStats)
      }
      setIsFormOpen(false)
      setComment("")
      setAuthorName("")
      toast.success("Thank you. Your review has been published.")
    } catch {
      toast.error("Network error while submitting review")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 pt-8 border-t border-border/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Client Reviews
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(stats.avg)
                      ? "fill-current"
                      : "stroke-current fill-transparent opacity-40"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {stats.avg > 0 ? stats.avg.toFixed(1) : "New"}
            </span>
            <span className="text-sm text-muted-foreground">
              ({stats.total || reviews.length} reviews)
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="rounded-full text-sm"
        >
          {isFormOpen ? "Close Form" : "Write a Review"}
        </Button>
      </div>

      {/* Review Form */}
      {isFormOpen && (
        <form onSubmit={handleReviewSubmit} className="p-6 rounded-2xl bg-muted/60 border border-border space-y-4">
          <h4 className="font-heading text-base font-semibold text-foreground">Share Your Experience</h4>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rating</Label>
            <div className="flex space-x-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star className={`h-6 w-6 ${star <= rating ? "fill-current" : "stroke-current fill-transparent"}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorName" className="text-xs uppercase tracking-wider text-muted-foreground">Your Name</Label>
            <Input
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Julian R."
              className="rounded-xl bg-background"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-xs uppercase tracking-wider text-muted-foreground">Review</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about the fit, texture, and durability…"
              className="rounded-xl bg-background min-h-24"
              required
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="rounded-full px-6">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No reviews yet. Be the first to review this piece.</p>
        ) : (
          reviews.map((rev, idx) => (
            <div key={rev._id || idx} className="p-5 rounded-2xl bg-card border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-foreground">{rev.authorName}</span>
                  {rev.isVerifiedPurchase && (
                    <span className="inline-flex items-center text-xs text-secondary font-medium">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= rev.rating ? "fill-current" : "stroke-current fill-transparent opacity-40"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ItemReviews
