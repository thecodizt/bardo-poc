'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Send, Play, Calendar, User } from 'lucide-react'

interface Profile {
  id: number
  name: string
  relation: string
  avatar_url?: string
}

interface Story {
  id: number
  profile_id: number
  transcript: string
  audio_path?: string
  event_year?: number
  created_at: string
  similarity_score?: number
}

interface ChatMessage {
  type: 'user' | 'assistant'
  content: string
  stories?: Story[]
}

interface ChatInterfaceProps {
  selectedProfile: Profile
}

export default function ChatInterface({ selectedProfile }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedMessages, setExpandedMessages] = useState<{[key: number]: boolean}>({})

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    const userMessage: ChatMessage = { type: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/chat`, { 
        query, 
        profile_id: selectedProfile.id 
      })
      const { message, stories } = response.data

      const assistantMessage: ChatMessage = {
        type: 'assistant',
        content: message || `I found ${stories.length} related ${stories.length === 1 ? 'memory' : 'memories'}:`,
        stories: stories
      }

      setMessages(prev => [...prev, assistantMessage])
      setQuery('')
    } catch (error) {
      console.error('Chat failed:', error)
      const errorMessage: ChatMessage = {
        type: 'assistant',
        content: 'Sorry, something went wrong. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const playAudio = (audioPath: string) => {
    const audio = new Audio(`${API_URL}/audio/${audioPath}`)
    audio.play().catch(error => {
      console.error('Audio playback failed:', error)
      alert('Could not play audio file')
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">Start a conversation with {selectedProfile.name}!</p>
            <p className="text-sm">Ask about their memories, experiences, or stories.</p>
            <p className="text-sm mt-4 italic">
              Try: "What was your favorite memory?" or "Tell me about your work"
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white ml-auto'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>

            {message.stories && message.stories.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    const expandedState = { ...expandedMessages }
                    expandedState[index] = !expandedState[index]
                    setExpandedMessages(expandedState)
                  }}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-3"
                >
                  <span>{expandedMessages[index] ? '▼' : '▶'}</span>
                  <span>
                    {expandedMessages[index] ? 'Hide' : 'Show'} {message.stories.length} reference{message.stories.length === 1 ? '' : 's'}
                  </span>
                </button>
                
                {expandedMessages[index] && (
                  <div className="space-y-3">
                    {message.stories.map((story) => (
                      <div key={story.id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {story.event_year && (
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                {story.event_year}
                              </div>
                            )}
                            <span>•</span>
                            <span>{formatDate(story.created_at)}</span>
                            {story.similarity_score && (
                              <>
                                <span>•</span>
                                <span>{Math.round(story.similarity_score * 100)}% match</span>
                              </>
                            )}
                          </div>
                          {story.audio_path && (
                            <button
                              onClick={() => playAudio(story.audio_path!)}
                              className="flex items-center gap-1 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 text-xs rounded transition-colors"
                            >
                              <Play size={12} />
                              Play Audio
                            </button>
                          )}
                        </div>
                        <p className="text-gray-800 leading-relaxed">{story.transcript}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="bg-gray-100 text-gray-900 max-w-[80%] p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              Searching memories...
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Chat with ${selectedProfile.name}... e.g., 'What was your favorite memory?'`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Send size={16} />
            Send
          </button>
        </form>
      </div>
    </div>
  )
}