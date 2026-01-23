'use client'

import { Review, getUserProfile, UserProfile } from '@/lib/firebase/firestore'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({ rating, size = 'md' }: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            rating >= star
              ? 'text-yellow-400 fill-yellow-400'
              : rating >= star - 0.5
              ? 'text-yellow-400 fill-yellow-400/50'
              : 'text-gray-300'
          )}
        />
      ))}
    </div>
  )
}

interface ReviewCardProps {
  review: Review
  showOrganizer?: boolean
}

export function ReviewCard({ review, showOrganizer = true }: ReviewCardProps) {
  const [organizer, setOrganizer] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (showOrganizer) {
      getUserProfile(review.organizerId).then(setOrganizer)
    }
  }, [review.organizerId, showOrganizer])

  const date = review.createdAt?.toDate?.()
  const formattedDate = date
    ? date.toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          {showOrganizer && organizer && (
            <span className="text-sm text-gray-600">
              by {organizer.fullName}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-400">{formattedDate}</span>
      </div>
      {review.comment && (
        <p className="text-gray-700 text-sm">{review.comment}</p>
      )}
    </div>
  )
}

interface ReviewListProps {
  reviews: Review[]
  emptyMessage?: string
}

export function ReviewList({ reviews, emptyMessage = 'No reviews yet' }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}

interface ReviewSummaryProps {
  averageRating: number
  totalReviews: number
  showCount?: boolean
}

export function ReviewSummary({ averageRating, totalReviews, showCount = true }: ReviewSummaryProps) {
  return (
    <div className="flex items-center gap-2">
      <StarRating rating={averageRating} size="sm" />
      <span className="font-medium">{averageRating.toFixed(1)}</span>
      {showCount && (
        <span className="text-gray-500 text-sm">
          ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  )
}
