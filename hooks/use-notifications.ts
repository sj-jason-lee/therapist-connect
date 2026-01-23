'use client'

import { useState, useEffect } from 'react'
import {
  getTotalUnreadCount,
  getConversationsByUser,
  getApplicationsByTherapist,
  getShiftsByOrganizer,
  getApplicationsByShift,
  Application,
  Conversation,
} from '@/lib/firebase/firestore'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/config'

export interface NotificationCounts {
  unreadMessages: number
  pendingApplications: number // For organizers: applications awaiting response
  acceptedApplications: number // For therapists: accepted applications to review
}

export function useNotifications(userId: string | null, userType: 'therapist' | 'organizer' | 'admin') {
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || userType === 'admin') {
      setLoading(false)
      return
    }

    // Subscribe to conversations for real-time unread count updates
    const db = getDb()
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    )

    const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
      const conversations = snapshot.docs.map(doc => doc.data() as Conversation)
      const unreadMessages = conversations.reduce((total, conv) => {
        return total + (conv.unreadCount?.[userId] || 0)
      }, 0)

      setCounts(prev => ({ ...prev, unreadMessages }))
    })

    // Capture userId in a const for the async function
    const currentUserId = userId

    // Fetch application counts (not real-time, but refresh periodically)
    async function fetchApplicationCounts() {
      if (!currentUserId) return

      try {
        if (userType === 'therapist') {
          const applications = await getApplicationsByTherapist(currentUserId)
          const acceptedApplications = applications.filter(
            app => app.status === 'accepted'
          ).length
          setCounts(prev => ({ ...prev, acceptedApplications }))
        } else if (userType === 'organizer') {
          // Get all shifts for this organizer
          const shifts = await getShiftsByOrganizer(currentUserId)
          let pendingCount = 0

          // Get pending applications for each shift
          for (const shift of shifts) {
            const applications = await getApplicationsByShift(shift.id)
            pendingCount += applications.filter(app => app.status === 'pending').length
          }

          setCounts(prev => ({ ...prev, pendingApplications: pendingCount }))
        }
      } catch (error) {
        console.error('Error fetching application counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplicationCounts()

    // Refresh application counts every 30 seconds
    const intervalId = setInterval(fetchApplicationCounts, 30000)

    return () => {
      unsubscribeConversations()
      clearInterval(intervalId)
    }
  }, [userId, userType])

  return { counts, loading }
}
