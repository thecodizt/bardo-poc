'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

interface Profile {
  id: number
  name: string
  relation: string
  avatar_url?: string
}

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchProfiles()
  }, [])

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
          className="w-16 h-16 rounded-full object-cover"
        />
      )
    }
    return (
      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
        <span className="text-gray-600 text-xl font-bold">
          {profile.name.charAt(0).toUpperCase()}
        </span>
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Bardo</h1>
          <p className="text-xl text-gray-600 mb-8">Timeline & Voice Recall</p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Link 
              href="/profiles" 
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              Manage Profiles
            </Link>
            <Link 
              href="/upload" 
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              Add Stories
            </Link>
            <Link 
              href="/stories" 
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              View Stories
            </Link>
            <Link 
              href="/chat" 
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              Chat & Recall →
            </Link>
          </div>
        </div>

        {profiles.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Bardo</h2>
            <p className="text-gray-600 mb-6">
              Bardo helps you preserve and chat with the digital memories of your loved ones.
              Start by creating a profile for someone special.
            </p>
            <Link 
              href="/profiles"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors inline-block"
            >
              Create Your First Profile
            </Link>
          </div>
        )}

        {profiles.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-semibold mb-6">Your Profiles</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {profiles.map((profile) => (
                  <div key={profile.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <Link 
                      href={`/stories?profile=${profile.id}`}
                      className="block mb-3"
                    >
                      <div className="flex items-center">
                        {getAvatarDisplay(profile)}
                        <div className="ml-4">
                          <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">Your {profile.relation}</p>
                        </div>
                      </div>
                    </Link>
                    <div className="flex gap-2">
                      <Link
                        href={`/upload?profile=${profile.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded text-sm transition-colors flex-1 text-center"
                      >
                        Add Story
                      </Link>
                      <Link
                        href={`/stories?profile=${profile.id}`}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-2 rounded text-sm transition-colors flex-1 text-center"
                      >
                        View Stories
                      </Link>
                      <Link
                        href={`/chat?profile=${profile.id}`}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-2 rounded text-sm transition-colors flex-1 text-center"
                      >
                        Chat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link 
                  href="/profiles"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Manage All Profiles
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}