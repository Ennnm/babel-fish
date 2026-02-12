const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[]
    }
  }[]
}

export async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data: GeminiResponse = await response.json()
  return data.candidates[0].content.parts[0].text
}

export async function translate(
  text: string,
  targetLang: string,
  tone?: string
): Promise<string> {
  const prompt = `Translate to ${targetLang}${tone ? ` with a ${tone} tone` : ''}. Only return the translation, no explanation.\n\nText: ${text}`
  return callGemini(prompt)
}
