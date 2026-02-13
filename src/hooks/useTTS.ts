import { useState, useCallback } from 'react'
import { synthesizeSpeech, playAudioBlob, isTTSSupported } from '../services/tts'

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const speak = useCallback(async (text: string, langCode: string) => {
    if (!text.trim() || !isTTSSupported(langCode)) return

    setIsPlaying(true)
    setError(null)

    try {
      const audioBlob = await synthesizeSpeech(text, langCode)
      await playAudioBlob(audioBlob)
    } catch (err) {
      console.error('TTS failed:', err)
      setError('Audio playback failed')
    } finally {
      setIsPlaying(false)
    }
  }, [])

  return { speak, isPlaying, error, isTTSSupported }
}
