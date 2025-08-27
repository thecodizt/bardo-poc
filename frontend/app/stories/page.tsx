'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Play, Pause, Calendar, User, MessageCircle, Upload, ArrowLeft, FileText } from 'lucide-react'

interface Profile {
  id: number
  name: string
  relation: string
  avatar_url?: string
  created_at: string
}

interface Story {
  id: number
  profile_id: number
  transcript: string
  audio_path?: string
  event_year?: number
  created_at: string
}

export default function Stories() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [storiesLoading, setStoriesLoading] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const profileId = searchParams.get('profile')

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchProfiles()
  }, [])

  useEffect(() => {
    if (profiles.length > 0 && profileId) {
      const profile = profiles.find(p => p.id === parseInt(profileId))
      if (profile) {
        setSelectedProfile(profile)
        fetchStories(profile.id)
      }
    }
  }, [profiles, profileId])

  const fetchProfiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/profiles`)
      setProfiles(response.data)
    } catch (error) {
      console.error('Failed to fetch profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStories = async (profileId: number) => {
    setStoriesLoading(true)
    try {
      const response = await axios.get(`${API_URL}/profiles/${profileId}/stories`)
      setStories(response.data)
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setStoriesLoading(false)
    }
  }

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile)
    fetchStories(profile.id)
  }

  const toggleAudio = (audioPath: string, storyId: number) => {
    // If this audio is currently playing, pause it
    if (playingAudioId === storyId && currentAudio) {
      currentAudio.pause()
      setPlayingAudioId(null)
      setCurrentAudio(null)
      return
    }
    
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
    }
    
    // Start new audio
    const audio = new Audio(`${API_URL}/audio/${audioPath}`)
    
    audio.addEventListener('ended', () => {
      setPlayingAudioId(null)
      setCurrentAudio(null)
    })
    
    audio.addEventListener('error', (error) => {
      console.error('Audio playback failed:', error)
      alert('Could not play audio file')
      setPlayingAudioId(null)
      setCurrentAudio(null)
    })
    
    setCurrentAudio(audio)
    setPlayingAudioId(storyId)
    
    audio.play().catch(error => {
      console.error('Audio playback failed:', error)
      alert('Could not play audio file')
      setPlayingAudioId(null)
      setCurrentAudio(null)
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getAvatarDisplay = (profile: Profile) => {
    if (profile.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt={profile.name}
          className="w-12 h-12 rounded-full object-cover"
        />
      )
    }
    return (
      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
        <User size={20} className="text-gray-600" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Stories & Memories</h1>
          <p className="text-xl text-gray-600 mb-8">Browse and listen to stored memories</p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Link 
              href="/" 
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              ← Home
            </Link>
            <Link 
              href="/profiles" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              Manage Profiles
            </Link>
            <Link 
              href="/chat" 
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              Chat & Recall
            </Link>
          </div>
        </div>

        {!selectedProfile && profiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Choose someone to view stories for:</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-left"
                >
                  {getAvatarDisplay(profile)}
                  <div>
                    <h4 className="font-medium text-gray-900">{profile.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">Your {profile.relation}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {profiles.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <p className="text-gray-600 mb-4">No profiles found. Please create a profile first.</p>
            <Link 
              href="/profiles"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Profile
            </Link>
          </div>
        )}

        {selectedProfile && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getAvatarDisplay(selectedProfile)}
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Stories from {selectedProfile.name}
                    </h3>
                    <p className="text-sm text-blue-700 capitalize">
                      Your {selectedProfile.relation}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/upload?profile=${selectedProfile.id}`}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    <Upload size={16} />
                    Add Story
                  </Link>
                  <Link
                    href={`/chat?profile=${selectedProfile.id}`}
                    className="flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    <MessageCircle size={16} />
                    Chat
                  </Link>
                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Change Person
                  </button>
                </div>
              </div>
            </div>

            {storiesLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading stories...</div>
              </div>
            ) : stories.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <p className="text-gray-600 mb-4">No stories found for {selectedProfile.name}.</p>
                <Link
                  href={`/upload?profile=${selectedProfile.id}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add First Story
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {stories.length} {stories.length === 1 ? 'Story' : 'Stories'}
                </h2>
                
                <div className="grid gap-6">
                  {stories.map((story) => {
                    const isAudio = story.audio_path && story.audio_path !== null && story.audio_path.trim() !== ''
                    
                    if (isAudio) {
                      // Audio tile
                      const isPlaying = playingAudioId === story.id
                      return (
                        <div key={story.id} className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border p-6 transition-colors ${isPlaying ? 'border-green-400 shadow-lg' : 'border-green-200'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1 text-green-700">
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                <span className="font-medium">Audio Recording</span>
                                {isPlaying && <span className="text-green-600 ml-1">• Playing</span>}
                              </div>
                              {story.event_year && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span className="font-medium">{story.event_year}</span>
                                  </div>
                                </>
                              )}
                              <span>•</span>
                              <span>Added {formatDate(story.created_at)}</span>
                            </div>
                            <button
                              onClick={() => toggleAudio(story.audio_path!, story.id)}
                              className={`flex items-center gap-2 px-4 py-3 font-medium rounded-lg transition-colors ${
                                isPlaying 
                                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                            >
                              {isPlaying ? (
                                <>
                                  <Pause size={18} />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play size={18} />
                                  Play Recording
                                </>
                              )}
                            </button>
                          </div>
                          <div className="text-green-800 font-medium">
                            {story.transcript}
                          </div>
                        </div>
                      )
                    } else {
                      // Text story tile  
                      return (
                        <div key={story.id} className="bg-white rounded-lg shadow-sm border p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1 text-blue-700">
                                <FileText size={16} />
                                <span className="font-medium">Story</span>
                              </div>
                              {story.event_year && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span className="font-medium">{story.event_year}</span>
                                  </div>
                                </>
                              )}
                              <span>•</span>
                              <span>Added {formatDate(story.created_at)}</span>
                            </div>
                          </div>
                          <div className="prose prose-gray max-w-none">
                            <p className="text-gray-800 leading-relaxed">{story.transcript}</p>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}