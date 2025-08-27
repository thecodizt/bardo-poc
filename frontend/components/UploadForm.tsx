'use client'

import { useState } from 'react'
import axios from 'axios'
import { Upload, Mic, FileText, User } from 'lucide-react'

interface Profile {
  id: number
  name: string
  relation: string
  avatar_url?: string
}

interface UploadFormProps {
  profiles: Profile[]
  selectedProfile?: Profile | null
  onSuccess: () => void
}

export default function UploadForm({ profiles, selectedProfile, onSuccess }: UploadFormProps) {
  const [transcript, setTranscript] = useState('')
  const [eventYear, setEventYear] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'text' | 'audio'>('text')
  const [profileId, setProfileId] = useState<number>(selectedProfile?.id || 0)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileId) {
      alert('Please select a profile first.')
      return
    }
    setUploading(true)

    try {
      const formData = new FormData()
      
      formData.append('profile_id', profileId.toString())
      
      if (uploadMode === 'text' && transcript.trim()) {
        formData.append('transcript', transcript.trim())
      }
      
      if (uploadMode === 'audio' && audioFile) {
        formData.append('audio', audioFile)
      }
      
      if (eventYear) {
        formData.append('event_year', eventYear)
      }

      const response = await axios.post(`${API_URL}/stories`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setTranscript('')
      setEventYear('')
      setAudioFile(null)
      onSuccess()
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0])
    }
  }

  const isFormValid = () => {
    if (!profileId) return false
    if (uploadMode === 'text') return transcript.trim().length > 0
    if (uploadMode === 'audio') return audioFile !== null
    return false
  }

  const getSelectedProfile = () => {
    return profiles.find(p => p.id === profileId)
  }

  const getAvatarDisplay = (profile: Profile) => {
    if (profile.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt={profile.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      )
    }
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <User size={16} className="text-gray-600" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!selectedProfile && (
        <div>
          <label htmlFor="profile" className="block text-sm font-medium text-gray-700 mb-2">
            Select Profile
          </label>
          <select
            id="profile"
            value={profileId}
            onChange={(e) => setProfileId(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value={0}>Choose who this memory belongs to...</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.relation})
              </option>
            ))}
          </select>
        </div>
      )}

      {(selectedProfile || getSelectedProfile()) && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            {getAvatarDisplay(selectedProfile || getSelectedProfile()!)}
            <div>
              <p className="font-medium text-blue-900">
                Adding memory for {(selectedProfile || getSelectedProfile())!.name}
              </p>
              <p className="text-sm text-blue-700 capitalize">
                Your {(selectedProfile || getSelectedProfile())!.relation}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setUploadMode('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            uploadMode === 'text'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <FileText size={20} />
          Text Story
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('audio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            uploadMode === 'audio'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Mic size={20} />
          Voice Recording
        </button>
      </div>

      {uploadMode === 'text' && (
        <div>
          <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
            Your Story
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell your story... What happened? When was it? How did it feel?"
            required={uploadMode === 'text'}
          />
        </div>
      )}

      {uploadMode === 'audio' && (
        <div>
          <label htmlFor="audio" className="block text-sm font-medium text-gray-700 mb-2">
            Audio Recording
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <label htmlFor="audio" className="cursor-pointer">
                <span className="text-blue-500 hover:text-blue-600">Click to upload</span>
                <span className="text-gray-500"> an audio file</span>
                <input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required={uploadMode === 'audio'}
                />
              </label>
            </div>
            {audioFile && (
              <p className="mt-2 text-sm text-gray-500">
                Selected: {audioFile.name}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="eventYear" className="block text-sm font-medium text-gray-700 mb-2">
          Year (Optional)
        </label>
        <input
          id="eventYear"
          type="number"
          value={eventYear}
          onChange={(e) => setEventYear(e.target.value)}
          min="1900"
          max={new Date().getFullYear()}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 1985"
        />
      </div>

      <button
        type="submit"
        disabled={uploading || !isFormValid()}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {uploading ? 'Uploading...' : `Upload ${uploadMode === 'text' ? 'Story' : 'Recording'}`}
      </button>
    </form>
  )
}