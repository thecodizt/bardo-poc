'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ChatInterface from '../../components/ChatInterface'
import axios from 'axios'

interface Profile {
  id: number
  name: string
  relation: string
  avatar_url?: string
}

export default function Chat() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
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
        <span className="text-gray-600 text-lg font-bold">
          {profile.name.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profiles...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Bardo Chat</h1>
          <p className="text-xl text-gray-600 mb-8">Search and recall your memories</p>
          
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
              href="/upload" 
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              Add Stories
            </Link>
          </div>
        </div>

        {!selectedProfile && profiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Choose someone to chat with:</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
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
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getAvatarDisplay(selectedProfile)}
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Chatting with {selectedProfile.name}
                    </h3>
                    <p className="text-sm text-blue-700 capitalize">
                      Your {selectedProfile.relation}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Change Person
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border">
              <ChatInterface selectedProfile={selectedProfile} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}