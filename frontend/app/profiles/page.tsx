'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { User, Plus, MessageCircle, Upload } from 'lucide-react'

interface Profile {
  id: number
  name: string
  relation: string
  avatar_url?: string
  created_at: string
}

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProfile, setNewProfile] = useState({
    name: '',
    relation: '',
    avatar_url: ''
  })

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

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProfile.name || !newProfile.relation) return

    try {
      const response = await axios.post(`${API_URL}/profiles`, newProfile)
      setProfiles([...profiles, response.data])
      setNewProfile({ name: '', relation: '', avatar_url: '' })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create profile:', error)
      alert('Failed to create profile. Please try again.')
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
        <User size={24} className="text-gray-600" />
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Profiles</h1>
          <p className="text-xl text-gray-600 mb-8">Manage digital memories of your loved ones</p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Link 
              href="/" 
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              ← Home
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Add New Profile
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Create New Profile</h3>
            <form onSubmit={createProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Steve Jobs"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship to you
                </label>
                <input
                  type="text"
                  value={newProfile.relation}
                  onChange={(e) => setNewProfile({ ...newProfile, relation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., grandfather, mother, friend"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL (optional)
                </label>
                <input
                  type="url"
                  value={newProfile.avatar_url}
                  onChange={(e) => setNewProfile({ ...newProfile, avatar_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                {getAvatarDisplay(profile)}
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                  <p className="text-gray-600 capitalize">{profile.relation}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href={`/upload?profile=${profile.id}`}
                  className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded text-sm transition-colors justify-center"
                >
                  <Upload size={14} />
                  Add
                </Link>
                <Link
                  href={`/stories?profile=${profile.id}`}
                  className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-2 py-2 rounded text-sm transition-colors justify-center"
                >
                  📖
                  View
                </Link>
                <Link
                  href={`/chat?profile=${profile.id}`}
                  className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2 py-2 rounded text-sm transition-colors justify-center"
                >
                  <MessageCircle size={14} />
                  Chat
                </Link>
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && !showCreateForm && (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
            <p className="text-gray-600 mb-4">Create your first profile to start adding memories</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Profile
            </button>
          </div>
        )}
      </div>
    </main>
  )
}