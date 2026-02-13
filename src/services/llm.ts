// Gemini API (kept for potential future use)
// const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
// const GEMINI_API_URL =
//   'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

// LM Studio Local LLM (proxied through Vite to avoid CORS)
const LM_STUDIO_URL = '/api/llm/v1/chat/completions'
const LM_STUDIO_MODEL = 'openai/gpt-oss-20b'

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
  th: 'Thai',
  vi: 'Vietnamese',
  ja: 'Japanese',
  ko: 'Korean',
  hu: 'Hungarian',
  ru: 'Russian',
  tl: 'Tagalog',
}

// =============================================================================
// Types
// =============================================================================

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[]
    }
  }[]
}

export interface ToneValidationResult {
  isValid: boolean
  error?: string
}

export interface BatchMessage {
  id: string
  text: string
}

export interface BatchTranslateOptions {
  customerLangCode: string
  agentLangCode: string
  onPartialResult?: (id: string, translatedText: string) => void
}

export interface BatchTranslateResult {
  toCustomerLanguage: Record<string, string>
  toAgentLanguage: Record<string, string>
  failedIds: string[]
  isRateLimited: boolean
}

interface ParsedBatchResponse {
  toCustomerLanguage: string[]
  toAgentLanguage: string[]
}

interface ResultAccumulator {
  toCustomerLanguage: Record<string, string>
  toAgentLanguage: Record<string, string>
}

// =============================================================================
// Tone Validation
// =============================================================================

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous/i,
  /ignore\s+(all\s+)?instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /instead[\s,]+output/i,
  /return\s+only/i,
  /override/i,
  /bypass/i,
  /jailbreak/i,
  /```/,
  /<\/?[a-z]+>/i,
  /\[\[/,
  /\]\]/,
  /\$\{/,
  /\{\{/,
  /\}\}/,
]

const MAX_TONE_LENGTH = 100
const MAX_SPECIAL_CHAR_RATIO = 0.2

function hasInjectionPattern(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text))
}

function hasExcessiveSpecialCharacters(text: string): boolean {
  if (text.length === 0) return false
  const specialChars = text.match(/[^a-zA-Z0-9\s]/g) || []
  return specialChars.length / text.length > MAX_SPECIAL_CHAR_RATIO
}

export function validateTone(tone: string): ToneValidationResult {
  if (!tone.trim()) {
    return { isValid: false, error: 'Tone cannot be empty' }
  }

  if (tone.length > MAX_TONE_LENGTH) {
    return { isValid: false, error: `Tone must be ${MAX_TONE_LENGTH} characters or less` }
  }

  if (hasInjectionPattern(tone)) {
    return { isValid: false, error: 'Invalid tone: contains restricted patterns' }
  }

  if (hasExcessiveSpecialCharacters(tone)) {
    return { isValid: false, error: 'Too many special characters' }
  }

  return { isValid: true }
}

// =============================================================================
// Single Translation
// =============================================================================

interface LLMResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function callLLM(prompt: string): Promise<string> {
  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LM_STUDIO_MODEL,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`)
  }

  const data: LLMResponse = await response.json()
  return data.choices[0].message.content
}

export interface TranslationResult {
  translation: string
  tonedOriginal?: string
}

export async function translate(
  text: string,
  targetLangCode: string,
  tone?: string
): Promise<TranslationResult> {
  const targetLang = LANGUAGE_NAMES[targetLangCode] || targetLangCode

  if (!tone) {
    // No tone: simple translation
    const prompt = `Translate to ${targetLang}. Only return the translation, nothing else.\n\nText: ${text}`
    const translation = await callLLM(prompt)
    return { translation }
  }

  // With tone: get both in one call
  const prompt = `Apply a ${tone} tone to this message and translate it to ${targetLang}.

Original: ${text}

Return ONLY a JSON object:
{
  "tonedOriginal": "the message rewritten with ${tone} tone in English",
  "translation": "the translation in ${targetLang} with ${tone} tone"
}`

  const response = await callLLM(prompt)
  const parsed = JSON.parse(response)
  return {
    translation: parsed.translation,
    tonedOriginal: parsed.tonedOriginal,
  }
}

const MAX_RETRIES = 2
const RETRY_DELAY = 500

export async function translateWithRetry(
  text: string,
  targetLangCode: string,
  tone?: string
): Promise<TranslationResult> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await translate(text, targetLangCode, tone)
    } catch (err) {
      lastError = err as Error
      console.warn(`Translation attempt ${attempt}/${MAX_RETRIES} failed:`, err)
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY)
      }
    }
  }

  throw lastError || new Error('Translation failed after retries')
}

// =============================================================================
// Batch Translation - Prompt Building
// =============================================================================

function buildMessageSection(messages: BatchMessage[], header: string): string {
  if (messages.length === 0) return ''
  const lines = messages.map((m, i) => `${i + 1}. [${m.id}] ${m.text}`)
  return `${header}:\n${lines.join('\n')}`
}

function buildExpectedOutputFormat(customerCount: number, agentCount: number): string {
  return `{
  "toCustomerLanguage": [${customerCount > 0 ? `"translation1"${customerCount > 1 ? ', ...' : ''}` : ''}],
  "toAgentLanguage": [${agentCount > 0 ? `"translation1"${agentCount > 1 ? ', ...' : ''}` : ''}]
}`
}

function buildBatchPrompt(
  toCustomer: BatchMessage[],
  toAgent: BatchMessage[],
  customerLang: string,
  agentLang: string
): string {
  const customerLangName = LANGUAGE_NAMES[customerLang] || customerLang
  const agentLangName = LANGUAGE_NAMES[agentLang] || agentLang

  const sections: string[] = []
  if (toCustomer.length > 0) {
    sections.push(buildMessageSection(toCustomer, `Translate to ${customerLangName}`))
  }
  if (toAgent.length > 0) {
    sections.push(buildMessageSection(toAgent, `Translate to ${agentLangName}`))
  }

  const outputFormat = buildExpectedOutputFormat(toCustomer.length, toAgent.length)

  return `You are a translator.

${sections.join('\n\n')}

Return ONLY a JSON object with this exact structure:
${outputFormat}

Each array should contain translations in the same order as the input messages.`
}

// =============================================================================
// Batch Translation - Response Parsing
// =============================================================================

function extractStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return []
  return arr.filter((item): item is string => typeof item === 'string')
}

function isValidResponseStructure(data: unknown): data is ParsedBatchResponse {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return 'toCustomerLanguage' in obj || 'toAgentLanguage' in obj
}

function parseBatchResponse(jsonText: string): ParsedBatchResponse | null {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, jsonText]
    const cleanJson = jsonMatch[1].trim()
    const parsed = JSON.parse(cleanJson)

    if (!isValidResponseStructure(parsed)) return null

    return {
      toCustomerLanguage: extractStringArray(parsed.toCustomerLanguage),
      toAgentLanguage: extractStringArray(parsed.toAgentLanguage),
    }
  } catch {
    console.error('Failed to parse batch response:', jsonText)
    return null
  }
}

// =============================================================================
// Batch Translation - Result Mapping
// =============================================================================

function createEmptyAccumulator(): ResultAccumulator {
  return { toCustomerLanguage: {}, toAgentLanguage: {} }
}

function mapResultsToAccumulator(
  parsed: ParsedBatchResponse,
  toCustomer: BatchMessage[],
  toAgent: BatchMessage[],
  accumulator: ResultAccumulator,
  onPartialResult?: (id: string, text: string) => void
): number {
  let successCount = 0

  // Map customer language translations
  parsed.toCustomerLanguage.forEach((text, index) => {
    if (index < toCustomer.length && text) {
      const msg = toCustomer[index]
      console.log('[Batch] Mapping toCustomerLanguage:', msg.id, text)
      accumulator.toCustomerLanguage[msg.id] = text
      onPartialResult?.(msg.id, text)
      successCount++
    }
  })

  // Map agent language translations
  parsed.toAgentLanguage.forEach((text, index) => {
    if (index < toAgent.length && text) {
      const msg = toAgent[index]
      console.log('[Batch] Mapping toAgentLanguage:', msg.id, text)
      accumulator.toAgentLanguage[msg.id] = text
      onPartialResult?.(msg.id, text)
      successCount++
    }
  })

  return successCount
}

function filterRemainingMessages(
  messages: BatchMessage[],
  completed: Record<string, string>
): BatchMessage[] {
  return messages.filter((m) => !(m.id in completed))
}

interface PartialBatchResult {
  toCustomerLanguage: Record<string, string>
  toAgentLanguage: Record<string, string>
  failedIds: string[]
}

function finalizeResults(
  accumulator: ResultAccumulator,
  toCustomer: BatchMessage[],
  toAgent: BatchMessage[]
): PartialBatchResult {
  const failedCustomer = filterRemainingMessages(toCustomer, accumulator.toCustomerLanguage)
  const failedAgent = filterRemainingMessages(toAgent, accumulator.toAgentLanguage)
  const failedIds = [...failedCustomer, ...failedAgent].map((m) => m.id)

  return {
    toCustomerLanguage: accumulator.toCustomerLanguage,
    toAgentLanguage: accumulator.toAgentLanguage,
    failedIds,
  }
}

// =============================================================================
// Batch Translation - API Execution
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface BatchRequestResult {
  text: string | null
  status: number
}

async function executeBatchRequest(prompt: string): Promise<BatchRequestResult> {
  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LM_STUDIO_MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      console.error(`Batch API error: ${response.status}`)
      return { text: null, status: response.status }
    }

    const data: LLMResponse = await response.json()
    const responseText = data.choices?.[0]?.message?.content || null
    console.log('[Batch] Raw response:', responseText)
    return { text: responseText, status: 200 }
  } catch (err) {
    console.error('Batch request failed:', err)
    return { text: null, status: 0 }
  }
}

interface AttemptOptions {
  toCustomer: BatchMessage[]
  toAgent: BatchMessage[]
  customerLang: string
  agentLang: string
  accumulator: ResultAccumulator
  onPartialResult?: (id: string, text: string) => void
}

interface AttemptResult {
  complete: boolean
  status: number
}

async function attemptBatchTranslation(opts: AttemptOptions): Promise<AttemptResult> {
  const { toCustomer, toAgent, customerLang, agentLang, accumulator, onPartialResult } = opts

  const prompt = buildBatchPrompt(toCustomer, toAgent, customerLang, agentLang)
  console.log('[Batch] Prompt:', prompt)
  const { text: responseText, status } = await executeBatchRequest(prompt)

  if (!responseText) return { complete: false, status }

  const parsed = parseBatchResponse(responseText)
  console.log('[Batch] Parsed response:', parsed)
  if (!parsed) return { complete: false, status }

  const expectedCount = toCustomer.length + toAgent.length
  const successCount = mapResultsToAccumulator(
    parsed,
    toCustomer,
    toAgent,
    accumulator,
    onPartialResult
  )

  return { complete: successCount === expectedCount, status }
}

function logIncompleteTranslations(
  accumulator: ResultAccumulator,
  toCustomer: BatchMessage[],
  toAgent: BatchMessage[]
): void {
  const failedCustomer = filterRemainingMessages(toCustomer, accumulator.toCustomerLanguage)
  const failedAgent = filterRemainingMessages(toAgent, accumulator.toAgentLanguage)
  const total = failedCustomer.length + failedAgent.length

  if (total > 0) {
    console.warn(`${total} message(s) could not be translated after ${MAX_RETRIES} attempts`)
  }
}

// =============================================================================
// Batch Translation - Public API
// =============================================================================

export async function batchTranslate(
  toCustomerMessages: BatchMessage[],
  toAgentMessages: BatchMessage[],
  options: BatchTranslateOptions
): Promise<BatchTranslateResult> {
  const { customerLangCode, agentLangCode, onPartialResult } = options
  const accumulator = createEmptyAccumulator()
  let lastStatus = 200

  // Track remaining messages for retry
  let remainingCustomer = [...toCustomerMessages]
  let remainingAgent = [...toAgentMessages]

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Skip if all done
    if (remainingCustomer.length === 0 && remainingAgent.length === 0) break

    const { complete, status } = await attemptBatchTranslation({
      toCustomer: remainingCustomer,
      toAgent: remainingAgent,
      customerLang: customerLangCode,
      agentLang: agentLangCode,
      accumulator,
      onPartialResult,
    })

    lastStatus = status
    if (complete) break

    // Update remaining for next attempt
    remainingCustomer = filterRemainingMessages(remainingCustomer, accumulator.toCustomerLanguage)
    remainingAgent = filterRemainingMessages(remainingAgent, accumulator.toAgentLanguage)

    if (attempt < MAX_RETRIES && (remainingCustomer.length > 0 || remainingAgent.length > 0)) {
      console.log(`Batch attempt ${attempt}/${MAX_RETRIES}: retrying ${remainingCustomer.length + remainingAgent.length} messages`)
      await delay(RETRY_DELAY)
    }
  }

  logIncompleteTranslations(accumulator, toCustomerMessages, toAgentMessages)
  const result = finalizeResults(accumulator, toCustomerMessages, toAgentMessages)
  return { ...result, isRateLimited: lastStatus === 429 }
}
