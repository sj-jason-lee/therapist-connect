'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getConversationsByUser,
  getConversation,
  Conversation,
} from '@/lib/firebase/firestore'
import { Card } from '@/components/ui/card'
import { ConversationList } from '@/components/messaging/conversation-list'
import { MessageThread } from '@/components/messaging/message-thread'
import { Loader2, MessageCircle } from 'lucide-react'

export default function TherapistMessagesPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversation')
  const { user, loading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConversations() {
      if (!user) return

      try {
        const convs = await getConversationsByUser(user.uid)
        setConversations(convs)

        // If a conversation ID is specified in the URL, select it
        if (conversationId) {
          const conv = convs.find(c => c.id === conversationId)
          if (conv) {
            setSelectedConversation(conv)
          } else {
            // Try to fetch it directly
            const directConv = await getConversation(conversationId)
            if (directConv && directConv.participants.includes(user.uid)) {
              setSelectedConversation(directConv)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching conversations:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchConversations()
    }
  }, [user, authLoading, conversationId])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Communicate with event organizers about bookings.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversation List - Hidden on mobile when a conversation is selected */}
          <div className={`w-full md:w-80 border-r bg-white ${selectedConversation ? 'hidden md:block' : ''}`}>
            <div className="h-full overflow-y-auto">
              <ConversationList
                conversations={conversations}
                currentUserId={user?.uid || ''}
                selectedId={selectedConversation?.id}
                onSelect={(conv) => setSelectedConversation(conv)}
              />
            </div>
          </div>

          {/* Message Thread */}
          <div className={`flex-1 ${!selectedConversation ? 'hidden md:flex' : ''}`}>
            {selectedConversation ? (
              <MessageThread
                conversation={selectedConversation}
                currentUserId={user?.uid || ''}
                onBack={() => setSelectedConversation(null)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm">Choose a conversation from the list to view messages</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
