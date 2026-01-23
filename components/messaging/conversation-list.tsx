'use client'

import { useEffect, useState } from 'react'
import { Conversation, getUserProfile, UserProfile } from '@/lib/firebase/firestore'
import { cn } from '@/lib/utils'
import { User, MessageCircle } from 'lucide-react'

interface ConversationListProps {
  conversations: Conversation[]
  currentUserId: string
  selectedId?: string
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({
  conversations,
  currentUserId,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [otherUsers, setOtherUsers] = useState<Record<string, UserProfile | null>>({})

  useEffect(() => {
    async function fetchUsers() {
      const users: Record<string, UserProfile | null> = {}
      for (const conv of conversations) {
        const otherParticipantId = conv.participants.find(p => p !== currentUserId)
        if (otherParticipantId && !users[otherParticipantId]) {
          users[otherParticipantId] = await getUserProfile(otherParticipantId)
        }
      }
      setOtherUsers(users)
    }

    fetchUsers()
  }, [conversations, currentUserId])

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500">
        <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
        <p className="font-medium">No conversations yet</p>
        <p className="text-sm">Start a conversation from a booking or application</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const otherParticipantId = conv.participants.find(p => p !== currentUserId)
        const otherUser = otherParticipantId ? otherUsers[otherParticipantId] : null
        const unreadCount = conv.unreadCount?.[currentUserId] || 0
        const lastMessageDate = conv.lastMessageAt?.toDate?.()
        const isSelected = selectedId === conv.id

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              'w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors',
              isSelected && 'bg-blue-50 hover:bg-blue-50'
            )}
          >
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={cn(
                  'font-medium text-gray-900 truncate',
                  unreadCount > 0 && 'font-semibold'
                )}>
                  {otherUser?.fullName || 'Unknown User'}
                </p>
                {lastMessageDate && (
                  <span className="text-xs text-gray-500">
                    {formatMessageDate(lastMessageDate)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className={cn(
                  'text-sm truncate',
                  unreadCount > 0 ? 'text-gray-900' : 'text-gray-500'
                )}>
                  {conv.lastMessage || 'No messages yet'}
                </p>
                {unreadCount > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function formatMessageDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return date.toLocaleDateString('en-CA', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  }
}
