'use client'

import { useState } from 'react'
import { createReview } from '@/lib/firebase/firestore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  bookingId: string
  shiftId: string
  therapistId: string
  organizerId: string
  therapistName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({
  bookingId,
  shiftId,
  therapistId,
  organizerId,
  therapistName,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await createReview(
        bookingId,
        shiftId,
        therapistId,
        organizerId,
        rating,
        comment.trim() || undefined
      )
      onSuccess?.()
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          How was your experience with {therapistName}?
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 focus:outline-none"
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  (hoverRating || rating) >= star
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {rating === 0 && 'Click to rate'}
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comments (optional)
        </label>
        <Textarea
          placeholder="Share your experience working with this therapist..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </Button>
      </div>
    </div>
  )
}
