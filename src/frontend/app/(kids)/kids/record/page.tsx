'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import VoiceRecorder from '@/components/VoiceRecorder'
import { config } from '@/lib/config'

export default function RecordPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentMood, setCurrentMood] = useState('neutral')

  useEffect(() => {
    const mood = sessionStorage.getItem('currentMood') || 'neutral'
    setCurrentMood(mood)
  }, [])

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true)

    try {
      // Upload audio
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')

      const uploadResponse = await fetch(`${config.apiUrl}/api/voice/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`)
      }

      const uploadData = await uploadResponse.json()
      
      if (!uploadData.upload_url) {
        throw new Error('No upload URL returned')
      }

      // Create story
      const storyResponse = await fetch(`${config.apiUrl}/api/story/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: uploadData.upload_url,
          child_id: 'demo_child_123', // TODO: Replace with useCurrentChildId() from AuthContext
          session_mood: currentMood,
          educational_focus: ['sharing', 'nature'],
          include_elements: [],
        }),
      })

      if (!storyResponse.ok) {
        throw new Error(`Story creation failed: ${storyResponse.status}`)
      }

      const storyData = await storyResponse.json()
      
      if (!storyData.story_id) {
        throw new Error('No story ID returned')
      }

      // Navigate to story view with query parameter
      router.push(`/kids/story?id=${storyData.story_id}`)
    } catch (error) {
      console.error('Error creating story:', error)
      alert('Oops! Something went wrong creating your story. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      {!isProcessing ? (
        <>
          <h1 className="text-5xl font-bold text-purple-600 mb-4 text-center">
            Tell me about your day! 🎤
          </h1>
          
          <p className="text-2xl text-gray-700 mb-12 text-center max-w-2xl">
            What exciting things happened? Did you see something cool? 
            Press the big button and tell me everything!
          </p>

          <VoiceRecorder 
            onRecordingComplete={handleRecordingComplete}
            isKidsMode={true}
          />

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600">
              You can also type your story if you want!
            </p>
            <button 
              className="mt-4 text-purple-600 underline text-xl hover:text-purple-800"
              onClick={() => router.push('/kids/type')}
            >
              Type instead
            </button>
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="w-64 h-64 mb-8 relative">
            {/* Animated mascot */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-pulse" />
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center text-8xl animate-spin-slow">
              ✨
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-purple-600 mb-4">
            Creating your magical story...
          </h2>
          
          <p className="text-2xl text-gray-700">
            The story wizards are working their magic! 🧙‍♂️
          </p>
        </div>
      )}
    </div>
  )
}