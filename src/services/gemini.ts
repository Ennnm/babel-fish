const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
  th: 'Thai',
  vi: 'Vietnamese',
  ja: 'Japanese',
  ko: 'Korean',
}

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
      contents: [{ parts: [{ text: prompt }] }],
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
  targetLangCode: string,
  tone?: string
): Promise<string> {
  const targetLang = LANGUAGE_NAMES[targetLangCode] || targetLangCode
  const prompt = `Translate to ${targetLang}${tone ? ` with a ${tone} tone` : ''}. Only return the translation, nothing else.\n\nText: ${text}`
  return callGemini(prompt)
}

const MAX_RETRIES = 5
const RETRY_DELAY = 500

export async function translateWithRetry(
  text: string,
  targetLangCode: string,
  tone?: string
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await translate(text, targetLangCode, tone)
    } catch (err) {
      lastError = err as Error
      console.warn(`Translation attempt ${attempt}/${MAX_RETRIES} failed:`, err)
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY))
      }
    }
  }

  throw lastError || new Error('Translation failed after retries')
}
