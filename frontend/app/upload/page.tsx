'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import UploadForm from '../../components/UploadForm'
import axios from 'axios'

interface Profile {
  id: number
  name: string
  relation: string
  avatar_url?: string
}

export default function Upload() {
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
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
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Story</h1>
          <p className="text-xl text-gray-600 mb-8">Add a memory to someone's digital profile</p>
          
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
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              Chat & Recall →
            </Link>
          </div>
        </div>

        {uploadSuccess && selectedProfile && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            Story uploaded successfully for {selectedProfile.name}! You can now chat with them to recall this memory.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-semibold mb-6">Share a Memory</h2>
          {profiles.length > 0 ? (
            <UploadForm 
              profiles={profiles}
              selectedProfile={selectedProfile}
              onSuccess={() => setUploadSuccess(true)} 
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No profiles found. Please create a profile first.</p>
              <Link 
                href="/profiles"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}