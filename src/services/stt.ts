// STT endpoint (proxied through Vite to Whisper on port 8081)
const STT_URL = '/api/stt/v1/audio/transcriptions'

export interface TranscriptionResult {
  text: string
}

/**
 * Transcribe audio blob to text using Whisper STT API.
 * Whisper auto-detects language (supports English, Chinese, etc.)
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('model', 'whisper-1')

  const response = await fetch(STT_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`STT API error: ${response.status}`)
  }

  const data: TranscriptionResult = await response.json()

  if (!data.text || !data.text.trim()) {
    throw new Error('No speech detected')
  }

  return data.text.trim()
}
