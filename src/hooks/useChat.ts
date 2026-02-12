import { useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import {
  translateWithRetry,
  batchTranslate,
  validateTone,
  type BatchMessage,
  type BatchTranslateResult,
  type ToneValidationResult,
} from '../services/gemini'
import type { Message, Tone } from '../types'

const STORAGE_KEY = 'babel-fish-messages'
const RATE_LIMIT_COOLDOWN = 60 // seconds

// =============================================================================
// Helper Functions
// =============================================================================

function generateMessageId(): string {
  return crypto.randomUUID()
}

function getMessagesNeedingTranslation(messages: Message[]): Message[] {
  return messages.filter((m) => !m.translatedText)
}

function partitionMessagesBySender(messages: Message[]): {
  agent: Message[]
  customer: Message[]
} {
  const agent: Message[] = []
  const customer: Message[] = []
  for (const msg of messages) {
    if (msg.sender === 'agent') {
      agent.push(msg)
    } else {
      customer.push(msg)
    }
  }
  return { agent, customer }
}

function toBatchMessages(messages: Message[]): BatchMessage[] {
  return messages.map((m) => ({ id: m.id, text: m.text }))
}

function countFailedTranslations(result: BatchTranslateResult): number {
  return result.failedIds.length
}

// =============================================================================
// Hook
// =============================================================================

export function useChat() {
  const [messages, setMessages] = useLocalStorage<Message[]>(STORAGE_KEY, [])
  const [isLoading, setIsLoading] = useState(false)
  const [customerLanguage, setCustomerLanguage] = useState('zh')
  const agentLanguage = 'en'

  // Fish mode state
  const [isTranslationOn, setIsTranslationOn] = useState(false)
  const [isBatchTranslating, setIsBatchTranslating] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [failedCount, setFailedCount] = useState(0)
  const [retryCountdown, setRetryCountdown] = useState(0)

  // Countdown timer effect
  useEffect(() => {
    if (retryCountdown <= 0) return
    const timer = setInterval(() => {
      setRetryCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [retryCountdown])

  // Tone state
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null)
  const [customToneText, setCustomToneText] = useState('')
  const [toneError, setToneError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Tone Management
  // ---------------------------------------------------------------------------

  const getEffectiveTone = useCallback((): string | undefined => {
    if (!selectedTone) return undefined
    if (selectedTone === 'custom') {
      return customToneText.trim() || undefined
    }
    return selectedTone
  }, [selectedTone, customToneText])

  const setTone = useCallback((tone: Tone | null) => {
    setSelectedTone(tone)
    if (tone !== 'custom') {
      setCustomToneText('')
      setToneError(null)
    }
  }, [])

  const setCustomTone = useCallback((value: string) => {
    setCustomToneText(value)
    if (value.trim()) {
      const result: ToneValidationResult = validateTone(value)
      setToneError(result.isValid ? null : result.error || 'Invalid tone')
    } else {
      setToneError(null)
    }
  }, [])

  const isToneValid = useCallback((): boolean => {
    if (!selectedTone) return true
    if (selectedTone !== 'custom') return true
    if (!customToneText.trim()) return true // Empty custom is OK (no tone applied)
    return validateTone(customToneText).isValid
  }, [selectedTone, customToneText])

  // ---------------------------------------------------------------------------
  // Batch Translation
  // ---------------------------------------------------------------------------

  const translateMissingMessages = useCallback(async () => {
    const needsTranslation = getMessagesNeedingTranslation(messages)
    if (needsTranslation.length === 0) return

    setIsBatchTranslating(true)
    setBatchError(null)
    setFailedCount(0)

    const { agent, customer } = partitionMessagesBySender(needsTranslation)

    // Agent messages → customer language, Customer messages → agent language
    const toCustomerBatch = toBatchMessages(agent)
    const toAgentBatch = toBatchMessages(customer)

    console.log('[Batch] toCustomerBatch:', toCustomerBatch)
    console.log('[Batch] toAgentBatch:', toAgentBatch)

    try {
      const result = await batchTranslate(toCustomerBatch, toAgentBatch, {
        customerLangCode: customerLanguage,
        agentLangCode: agentLanguage,
        onPartialResult: (id, translatedText) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === id ? { ...msg, translatedText } : msg))
          )
        },
      })

      const failed = countFailedTranslations(result)
      setFailedCount(failed)
      if (failed > 0) {
        setBatchError(`${failed} message(s) could not be translated`)
        if (result.isRateLimited) {
          setRetryCountdown(RATE_LIMIT_COOLDOWN)
        }
      }
    } catch (err) {
      console.error('Batch translation failed:', err)
      setBatchError('Translation failed. Please try again.')
    } finally {
      setIsBatchTranslating(false)
    }
  }, [messages, customerLanguage, agentLanguage, setMessages])

  const toggleTranslation = useCallback(async () => {
    const newState = !isTranslationOn
    setIsTranslationOn(newState)

    if (newState) {
      // Turning ON: batch translate missing messages
      await translateMissingMessages()
    }
    // Turning OFF: just hide translations (keep stored)
  }, [isTranslationOn, translateMissingMessages])

  const retryBatchTranslation = useCallback(async () => {
    await translateMissingMessages()
  }, [translateMissingMessages])

  // ---------------------------------------------------------------------------
  // Message Management
  // ---------------------------------------------------------------------------

  const addMessage = useCallback(
    async (
      text: string,
      sender: 'agent' | 'customer',
      translatedText?: string,
      tone?: Tone
    ) => {
      const language = sender === 'agent' ? agentLanguage : customerLanguage
      const translatedLanguage = sender === 'agent' ? customerLanguage : agentLanguage

      const newMessage: Message = {
        id: generateMessageId(),
        text,
        translatedText,
        sender,
        timestamp: Date.now(),
        language,
        translatedLanguage,
        tone,
      }

      setMessages((prev) => [...prev, newMessage])

      // Auto-translate customer messages when fish mode is ON
      if (sender === 'customer' && isTranslationOn && !translatedText) {
        setIsLoading(true)
        try {
          const translated = await translateWithRetry(text, agentLanguage)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newMessage.id ? { ...msg, translatedText: translated } : msg
            )
          )
        } catch (error) {
          console.error('Translation failed:', error)
        } finally {
          setIsLoading(false)
        }
      }
    },
    [customerLanguage, agentLanguage, setMessages, isTranslationOn]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setBatchError(null)
    setFailedCount(0)
  }, [setMessages])

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // Messages
    messages,
    isLoading,
    addMessage,
    clearMessages,

    // Language
    customerLanguage,
    agentLanguage,
    setCustomerLanguage,

    // Fish mode
    isTranslationOn,
    isBatchTranslating,
    batchError,
    failedCount,
    retryCountdown,
    toggleTranslation,
    retryBatchTranslation,

    // Tone
    selectedTone,
    customToneText,
    toneError,
    setTone,
    setCustomTone,
    getEffectiveTone,
    isToneValid,
  }
}
