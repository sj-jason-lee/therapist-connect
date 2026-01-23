'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Message,
  Conversation,
  getUserProfile,
  UserProfile,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
} from '@/lib/firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Send, Loader2, User, ArrowLeft } from 'lucide-react'

interface MessageThreadProps {
  conversation: Conversation
  currentUserId: string
  onBack?: () => void
}

export function MessageThread({ conversation, currentUserId, onBack }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const otherParticipantId = conversation.participants.find(p => p !== currentUserId)

  useEffect(() => {
    async function fetchOtherUser() {
      if (otherParticipantId) {
        const user = await getUserProfile(otherParticipantId)
        setOtherUser(user)
      }
    }
    fetchOtherUser()
  }, [otherParticipantId])

  useEffect(() => {
    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(conversation.id, (newMessages) => {
      setMessages(newMessages)
    })

    // Mark messages as read
    markMessagesAsRead(conversation.id, currentUserId)

    return () => unsubscribe()
  }, [conversation.id, currentUserId])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}`

    // Optimistically add the message immediately
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUserId,
      content: messageContent,
      read: false,
      createdAt: Timestamp.now(),
    }
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')

    setSending(true)
    try {
      await sendMessage(conversation.id, currentUserId, messageContent)
      // The subscription will update with the real message
    } catch (err) {
      console.error('Error sending message:', err)
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(messageContent) // Restore the message
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        {onBack && (
          <button onClick={onBack} className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{otherUser?.fullName || 'Loading...'}</p>
          <p className="text-sm text-gray-500 capitalize">{otherUser?.userType}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId
            const messageDate = message.createdAt?.toDate?.()

            return (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  isOwnMessage ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2',
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  {messageDate && (
                    <p className={cn(
                      'text-xs mt-1',
                      isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                    )}>
                      {messageDate.toLocaleTimeString('en-CA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="px-4"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
