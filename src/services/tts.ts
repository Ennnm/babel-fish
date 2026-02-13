// TTS endpoint (proxied through Vite)
const TTS_URL = '/api/tts/v1/audio/speech'

// Only Chinese supported for now
const TTS_MODELS: Record<string, string> = {
  zh: 'tts-zh',
}

export function isTTSSupported(langCode: string): boolean {
  return langCode in TTS_MODELS
}

export async function synthesizeSpeech(text: string, langCode: string): Promise<Blob> {
  const model = TTS_MODELS[langCode]
  if (!model) {
    throw new Error(`TTS not supported for language: ${langCode}`)
  }

  const response = await fetch(TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text, model }),
  })

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`)
  }

  return response.blob()
}

export function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    audio.onended = () => {
      URL.revokeObjectURL(url)
      resolve()
    }

    audio.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }

    audio.play().catch((e) => {
      URL.revokeObjectURL(url)
      reject(e)
    })
  })
}
